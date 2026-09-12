# Seguridad y Autenticación — LexControl

## 1. Visión General

Este documento describe la implementación de seguridad en la capa de autenticación de LexControl, cubriendo:

- **BCrypt** — Hash de contraseñas con migración transparente desde SHA256 legacy
- **Refresh Tokens** — Tokens de larga duración con rotación y revocación
- **JWT Blacklist** — Invalidación de access tokens en logout
- **Rate Limiting** — Protección contra fuerza bruta en el endpoint de login

**Archivo de migración:** `ScriptsDB/sp_seguridad.sql` (UTF-8 con BOM, 417 líneas)

---

## 2. Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular)                    │
│                                                         │
│  auth-service.ts                                        │
│  ├── iniciarSesion()  ──POST /api/auth/login──┐        │
│  ├── refrescar()      ──POST /api/auth/refresh─┤        │
│  └── cerrarSesion()   ──POST /api/auth/logout──┤        │
│                                                         │
│  auth-interceptor.ts                                    │
│  ├── Agrega Bearer <token> a cada petición              │
│  └── En 401: intenta refrescar → reintenta → logout     │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP
┌─────────────────────────▼───────────────────────────────┐
│                    BACKEND (.NET 10)                     │
│                                                         │
│  AuthController                                         │
│  ├── POST /login       → AuthService.LoginAsync()       │
│  ├── POST /refresh     → RefreshTokenService.Validar()  │
│  ├── POST /logout      → RefreshTokenService.Revocar()  │
│  └── POST /logout-all  → RefreshTokenService.RevocarTodos() │
│                                                         │
│  AuthService                                            │
│  ├── Login: SHA256 → BCrypt fallback → migración        │
│  └── Genera access token (15min) + refresh token (7d)   │
│                                                         │
│  JwtService        → Genera access tokens (HS256)       │
│  RefreshTokenService → CRUD de refresh tokens           │
│                                                         │
│  Rate Limiter: FixedWindow 5 intentos/min por IP        │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   SQL Server                            │
│                                                         │
│  Tablas:                                                │
│  ├── USUARIO (columnas: HashLegacy, FechaUltimoCambioHash) │
│  ├── REFRESH_TOKEN (TokenHash, expiración, revocado)    │
│  └── TOKEN_BLACKLIST (JTI, expiración, motivo)          │
│                                                         │
│  SPs de seguridad (13 en sp_seguridad.sql):             │
│  ├── SP_Usuario_ActualizarHash                          │
│  ├── SP_Usuario_ObtenerPorNombre                        │
│  ├── SP_Usuario_Autenticar (actualizado)                │
│  ├── SP_RefreshToken_Crear                              │
│  ├── SP_RefreshToken_Validar                            │
│  ├── SP_RefreshToken_Revocar                            │
│  ├── SP_RefreshToken_RevocarTodos                       │
│  ├── SP_RefreshToken_Limpiar                            │
│  ├── SP_TokenBlacklist_Insertar                         │
│  ├── SP_TokenBlacklist_Existe                           │
│  └── SP_TokenBlacklist_Limpiar                          │
└─────────────────────────────────────────────────────────┘
```

---

## 3. BCrypt — Migración Transparente

### 3.1 Problema
El seed de la BD usa hashes SHA256 sin salt, que son débiles contra rainbow tables.

### 3.2 Solución
Migración dual: login intenta SHA256 primero; si falla, intenta BCrypt. Si SHA256 funciona, migra el hash a BCrypt en el mismo request.

### 3.3 Flujo

```
LoginRequest { usuario, contraseña }
         │
         ▼
┌─ SP_Usuario_Autenticar (SHA256) ─┐
│                                   │
│  ¿Encontró fila?                  │
│  ├── SÍ → HashLegacy = true       │
│  │         ├── Calcular BCrypt     │
│  │         ├── SP_Usuario_ActualizarHash (nuevoHash, HashLegacy=0) │
│  │         └── Generar tokens      │
│  │                                │
│  └── NO → Fallback BCrypt:        │
│            ├── SP_Usuario_ObtenerPorNombre │
│            ├── ¿EsHashBcrypt(hash)?│
│            ├── VerifyPassword()?   │
│            ├── SÍ → Generar tokens │
│            └── NO → Registrar intento fallido │
└───────────────────────────────────┘
```

### 3.4 Configuración BCrypt

- **Work factor:** 12 (~250ms por hash en hardware moderno)
- **Algoritmo:** BCrypt.Net-Next v4.0.3
- **Detección:** `EsHashBcrypt()` verifica prefijo `$2a$`, `$2b$` o `$2x$`

### 3.5 Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `Helpers/HashHelper.cs` | `HashPassword()`, `VerifyPassword()`, `EsHashBcrypt()`. `Sha256Hex` marcado `[Obsolete]` |
| `Services/AuthService.cs` | Login dual SHA256→BCrypt con migración transparente |
| `Dtos/Usuarios/UsuarioDtos.cs` | `AutenticacionFila.HashLegacy`, nueva clase `UsuarioAutenticacionFila` |
| `ScriptsDB/sp_seguridad.sql` | `SP_Usuario_ActualizarHash`, `SP_Usuario_ObtenerPorNombre`, `SP_Usuario_Autenticar` actualizado |

---

## 4. Refresh Tokens

### 4.1 Ciclo de Vida

```
    ┌──────────┐
    │  Login   │
    └────┬─────┘
         │
         ▼
  ┌──────────────┐     ┌──────────────────┐
  │ Access Token  │     │  Refresh Token   │
  │ (15 minutos)  │     │  (7 días)        │
  │ JWT HS256     │     │  SHA256 en BD    │
  └──────┬───────┘     └────────┬─────────┘
         │                      │
         │  Expira               │  Se mantiene válido
         ▼                      ▼
  ┌──────────────┐     ┌──────────────────┐
  │  POST        │     │  POST            │
  │  /api/auth/  │     │  /api/auth/      │
  │  refresh     │     │  refresh         │
  └──────┬───────┘     └────────┬─────────┘
         │                      │
         │  Nuevo par de tokens │  Anterior se revoca
         ▼                      ▼
  ┌──────────────┐     ┌──────────────────┐
  │ Nuevo Access │     │ Nuevo Refresh    │
  │ + Nuevo      │     │ (el anterior     │
  │   Refresh    │     │  queda revocado) │
  └──────────────┘     └──────────────────┘
```

### 4.2 Propiedades

| Propiedad | Valor |
|-----------|-------|
| Access token expiración | 15 minutos |
| Refresh token expiración | 7 días |
| Almacenamiento en BD | SHA256 hash (nunca en claro) |
| Rotación | Cada uso genera un nuevo refresh token |
| Revocación | Un solo token o todos los del usuario |

### 4.3 Tabla REFRESH_TOKEN

```sql
CREATE TABLE REFRESH_TOKEN (
    ID              INT IDENTITY(1,1) PRIMARY KEY,
    Usuario_ID      INT NOT NULL FK → USUARIO(ID) ON DELETE CASCADE,
    TokenHash       NVARCHAR(255) NOT NULL,  -- SHA256 del token en claro
    FechaCreacion   DATETIME NOT NULL DEFAULT GETDATE(),
    FechaExpiracion DATETIME NOT NULL,
    Revocado        BIT NOT NULL DEFAULT 0,
    FechaRevocacion DATETIME NULL,
    ReemplazadoPor  NVARCHAR(255) NULL,      -- hash del token que lo reemplazó
    UserAgent       NVARCHAR(500) NULL,
    IPAddress       NVARCHAR(45) NULL
);
```

**Índices:**
- `IX_REFRESH_TOKEN_TokenHash` (UNIQUE) — búsqueda por hash
- `IX_REFRESH_TOKEN_Usuario` (Usuario_ID, Revocado) — tokens activos por usuario
- `IX_REFRESH_TOKEN_Expiracion` — limpieza de tokens expirados

### 4.4 SPs de Refresh Token

| SP | Descripción |
|----|-------------|
| `SP_RefreshToken_Crear` | Inserta nuevo refresh token con hash |
| `SP_RefreshToken_Validar` | Valida: no revocado, no expirado, usuario activo |
| `SP_RefreshToken_Revocar` | Marca como revocado, registra reemplazadoPor |
| `SP_RefreshToken_RevocarTodos` | Revoca todos los tokens activos de un usuario |
| `SP_RefreshToken_Limpiar` | Elimina tokens expirados/revocados (mantenimiento) |

### 4.5 Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `Services/RefreshTokenService.cs` | Crear, validar, rotar, revocar refresh tokens |
| `Services/AuthService.cs` | Genera refresh token en login, pasa a `LoginResponseDto` |
| `Controllers/AuthController.cs` | `POST /refresh`, `POST /logout`, `POST /logout-all` |
| `Dtos/Auth/AuthDtos.cs` | `RefreshRequestDto`, `LogoutRequestDto`, `LoginResponseDto.RefreshToken` |

---

## 5. JWT Blacklist

### 5.1 Problema
Un access token JWT es válido hasta que expira. Si un usuario cierra sesión, el token sigue siendo válido.

### 5.2 Solución
Al hacer logout, el `jti` (JWT ID) del token se agrega a una blacklist. Cada petición autenticada verifica que el `jti` no esté en la blacklist.

### 5.3 Tabla TOKEN_BLACKLIST

```sql
CREATE TABLE TOKEN_BLACKLIST (
    JTI              NVARCHAR(50) PRIMARY KEY,   -- JWT ID del token
    Usuario_ID       INT NOT NULL,
    FechaExpiracion  DATETIME NOT NULL,
    FechaRevocacion  DATETIME NOT NULL DEFAULT GETDATE(),
    Motivo           NVARCHAR(200) NULL           -- 'logout', 'logout-all'
);
```

**Índice:** `IX_TOKEN_BLACKLIST_Expiracion` — limpieza de entradas expiradas

### 5.4 SPs de Blacklist

| SP | Descripción |
|----|-------------|
| `SP_TokenBlacklist_Insertar` | Agrega JTI a blacklist |
| `SP_TokenBlacklist_Existe` | Verifica si un JTI está activo en blacklist |
| `SP_TokenBlacklist_Limpiar` | Elimina entradas expiradas (mantenimiento) |

### 5.5 Nota
El access token tiene 15 minutos de vida. La blacklist solo necesita retener entries hasta que los tokens expiren naturalmente. El job `SP_TokenBlacklist_Limpiar` puede ejecutarse periódicamente.

---

## 6. Rate Limiting

### 6.1 Configuración

| Parámetro | Valor |
|-----------|-------|
| Política | `FixedWindowLimiter` |
| Nombre | `login` |
| Límite | 5 peticiones |
| Ventana | 1 minuto |
| Cola | 0 (rechazo inmediato) |
| Código de respuesta | HTTP 429 Too Many Requests |

### 6.2 Implementación

**Backend (`Program.cs`):**
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

app.UseRateLimiter();  // Antes de UseAuthentication
```

**Controlador (`AuthController.cs`):**
```csharp
[HttpPost("login")]
[EnableRateLimiting("login")]  // Aplica la política
```

### 6.3 Consideraciones
- El rate limit es **por IP** (fixed window por defecto)
- Solo aplica al endpoint `POST /api/auth/login`
- En producción, considerar rate limiting global y por endpoint
- El middleware `UseRateLimiter()` debe ir antes de `UseAuthentication` en el pipeline

---

## 7. Migración de Base de Datos

### 7.1 Prerequisitos
- SQL Server (SQLEXPRESS o superior)
- Base de datos `DBLexControl` existente con el schema actual

### 7.2 Ejecución

Abrir SSMS, conectar a la instancia, y ejecutar el archivo completo:

```
ScriptsDB/sp_seguridad.sql
```

### 7.3 Qué crea

**Columnas nuevas en USUARIO:**
| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `HashLegacy` | BIT | 1 | `true` si el hash aún es SHA256 |
| `FechaUltimoCambioHash` | DATETIME | NULL | Cuándo se migró a BCrypt |

**Tablas nuevas:**
| Tabla | Registros iniciales |
|-------|-------------------|
| `REFRESH_TOKEN` | 0 (se puebla con cada login) |
| `TOKEN_BLACKLIST` | 0 (se puebla con cada logout) |

**SPs creados (13 en total):**
- `SP_Usuario_ActualizarHash`
- `SP_Usuario_ObtenerPorNombre`
- `SP_RefreshToken_Crear`
- `SP_RefreshToken_Validar`
- `SP_RefreshToken_Revocar`
- `SP_RefreshToken_RevocarTodos`
- `SP_RefreshToken_Limpiar`
- `SP_TokenBlacklist_Insertar`
- `SP_TokenBlacklist_Existe`
- `SP_TokenBlacklist_Limpiar`

**SPs actualizados:**
- `SP_Usuario_Autenticar` (ahora retorna `HashLegacy`)

### 7.4 Verificación

```sql
-- Verificar columnas
SELECT name FROM sys.columns
WHERE object_id = OBJECT_ID('USUARIO') AND name IN ('HashLegacy', 'FechaUltimoCambioHash');

-- Verificar tablas
SELECT name FROM sys.tables WHERE name IN ('REFRESH_TOKEN', 'TOKEN_BLACKLIST');

-- Verificar SPs
SELECT name FROM sys.procedures WHERE name LIKE 'SP_%Refresh%' OR name LIKE 'SP_%Blacklist%' OR name = 'SP_Usuario_ActualizarHash';
```

### 7.5 Rollback

```sql
-- Eliminar columnas
ALTER TABLE USUARIO DROP COLUMN HashLegacy;
ALTER TABLE USUARIO DROP COLUMN FechaUltimoCambioHash;

-- Eliminar tablas (CASCADE elimina FKs)
DROP TABLE IF EXISTS TOKEN_BLACKLIST;
DROP TABLE IF EXISTS REFRESH_TOKEN;

-- Eliminar SPs
DROP PROCEDURE IF EXISTS SP_Usuario_ActualizarHash;
DROP PROCEDURE IF EXISTS SP_Usuario_ObtenerPorNombre;
DROP PROCEDURE IF EXISTS SP_RefreshToken_Crear;
DROP PROCEDURE IF EXISTS SP_RefreshToken_Validar;
DROP PROCEDURE IF EXISTS SP_RefreshToken_Revocar;
DROP PROCEDURE IF EXISTS SP_RefreshToken_RevocarTodos;
DROP PROCEDURE IF EXISTS SP_RefreshToken_Limpiar;
DROP PROCEDURE IF EXISTS SP_TokenBlacklist_Insertar;
DROP PROCEDURE IF EXISTS SP_TokenBlacklist_Existe;
DROP PROCEDURE IF EXISTS SP_TokenBlacklist_Limpiar;
```

---

## 8. Configuración

### 8.1 appsettings.json

```json
{
  "Jwt": {
    "Secret": "",
    "Issuer": "LexControlApi",
    "Audience": "LexControlApp",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 7
  }
}
```

> **Nota:** El `Secret` está vacío intencionalmente. El valor real se configura vía variable de entorno `JWT_SECRET`.

### 8.2 Variables de Entorno

**Prioridad:** `JWT_SECRET` (env var) → `Jwt:Secret` (appsettings.json)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `JWT_SECRET` | Clave secreta HS256 (mínimo 32 chars) | **Sí** — el API no inicia sin ella |

**Configurar en la máquina (una sola vez):**

```powershell
# Ejecutar el script incluido:
.\scripts\set-jwt-secret.ps1

# O manualmente:
$secret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", $secret, "User")
```

**Verificar:**
```powershell
[System.Environment]::GetEnvironmentVariable("JWT_SECRET", "User")
```

> **Importante:** Reiniciar la terminal o Visual Studio después de configurar la variable.

### 8.3 Consideraciones de Producción

- **Usar HTTPS** obligatorio (el token viaja en headers)
- **Rate limiting** considerar usar Redis para ventanas compartidas entre instancias
- **Blacklist** considerar Redis para high-availability
- **Refresh tokens** ejecutar `SP_RefreshToken_Limpiar` periódicamente
- **Secret** generar con valores aleatorios de alta entropía

---

## 9. Endpoints

### 9.1 POST /api/auth/login

**Rate limit:** 5/min por IP

**Request:**
```json
{
  "usuario": "admin",
  "contrasena": "Test1234!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiracion": "2026-09-11T15:30:00Z",
    "refreshToken": "a1b2c3d4e5...",
    "usuarioId": 1,
    "usuario": "admin",
    "nombreCompleto": "Administrador General",
    "rolId": 1,
    "rol": "Administrador"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Usuario o contraseña incorrectos."
}
```

**Response 429:**
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.16",
  "title": "Too Many Requests",
  "status": 429
}
```

### 9.2 POST /api/auth/refresh

**Request:**
```json
{
  "refreshToken": "a1b2c3d4e5..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiracion": "2026-09-11T15:45:00Z",
    "refreshToken": "f6g7h8i9j0...",
    "usuarioId": 1,
    "usuario": "admin",
    "nombreCompleto": "Administrador General",
    "rolId": 1,
    "rol": "Administrador"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Refresh token inválido o expirado."
}
```

### 9.3 POST /api/auth/logout

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "refreshToken": "f6g7h8i9j0..."
}
```

**Response:** `204 No Content`

**Efectos:**
- Revoca el refresh token
- Agrega el `jti` del access token a la blacklist

### 9.4 POST /api/auth/logout-all

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Efectos:**
- Revoca **todos** los refresh tokens del usuario
- Agrega el `jti` del access token actual a la blacklist

---

## 10. Flujo de Autenticación Completo

### 10.1 Login

```
1. Usuario ingresa credenciales → POST /api/auth/login
2. Rate limiter verifica intentos (5/min por IP)
3. AuthService.LoginAsync():
   a. Calcula SHA256 de la contraseña
   b. Ejecuta SP_Usuario_Autenticar (búsqueda SHA256)
   c. Si no encuentra → fallback BCrypt:
      - SP_Usuario_ObtenerPorNombre
      - Verifica BCrypt hash
   d. Si encuentra con SHA256 → migra a BCrypt transparentemente
   e. Genera access token (15 min) con claims: sub, name, usuario, rol_id, role, jti
   f. Genera refresh token (7 días) → hash SHA256 → guarda en BD
   g. Actualiza último acceso
4. Respuesta: access token + refresh token + datos de usuario
5. Frontend guarda ambos tokens en sessionStorage
```

### 10.2 Petición Autenticada

```
1. Frontend envía petición con header: Authorization: Bearer <token>
2. Interceptor agrega Bearer automáticamente
3. Backend valida JWT (firma, expiración, issuer, audience)
4. Controlador procesa la petición
```

### 10.3 Token Expirado (401)

```
1. Backend retorna HTTP 401
2. Interceptor detecta 401 (no es login ni refresh)
3. Interceptor llama a auth.refrescar():
   a. POST /api/auth/refresh con refreshToken
   b. Backend valida refresh token en BD
   c. Si válido: genera nuevos tokens, revoca el anterior
   d. Si inválido: limpia sesión → redirect /login
4. Si refresh exitoso: reintenta petición original con nuevo token
5. Si falla: redirect a /login
```

### 10.4 Logout

```
1. Usuario hace clic en "Cerrar Sesión"
2. Frontend llama POST /api/auth/logout con refreshToken
3. Backend:
   a. Revoca refresh token en BD
   b. Agrega jti del access token a TOKEN_BLACKLIST
4. Frontend limpia sessionStorage → redirect /login
```

---

## 11. Frontend

### 11.1 AuthService (`auth-service.ts`)

| Método | Descripción |
|--------|-------------|
| `iniciarSesion(usuario, contrasena)` | POST /api/auth/login, guarda sesión |
| `refrescar()` | POST /api/auth/refresh, actualiza tokens |
| `cerrarSesion()` | Limpia storage, setea sesión a null |
| `token()` | Retorna access token actual |

**Storage keys:**
| Clave | Contenido |
|-------|-----------|
| `lexcontrol_token` | Access token JWT |
| `lexcontrol_refresh` | Refresh token en claro |
| `lexcontrol_usuarioId` | ID del usuario |
| `lexcontrol_usuario` | Nombre de usuario |
| `lexcontrol_nombre` | Nombre completo |
| `lexcontrol_rolId` | ID del rol |
| `lexcontrol_rol` | Nombre del rol |
| `lexcontrol_expiracion` | Fecha expiración ISO |

### 11.2 Auth Interceptor (`auth-interceptor.ts`)

**Comportamiento:**
1. Agrega `Authorization: Bearer <token>` a toda petición al API
2. En 401 (excepto login/refresh):
   - Llama `auth.refrescar()`
   - Si éxito: reintenta petición original con nuevo token
   - Si falla: redirige a `/login`

### 11.3 SesionRespuesta (`respuesta-api.ts`)

```typescript
export interface SesionRespuesta {
    token: string;
    expiracion: string;
    refreshToken: string;    // ← Nuevo
    usuarioId: number;
    usuario: string;
    nombreCompleto: string;
    rolId: number;
    rol: string;
}
```

---

## 12. Seguridad — Consideraciones

### 12.1 BCrypt

- Work factor 12: balance entre seguridad y rendimiento (~250ms/hash)
- Tokens de refresh almacenados como SHA256, nunca en claro
- Migración transparente: no requiere resetear contraseñas de usuarios existentes

### 12.2 JWT

- Access token de 15 minutos (reducido de 120 minutos)
- Secret mínimo 32 caracteres, HS256
- Claims: `sub` (usuarioId), `name` (nombre), `usuario`, `rol_id`, `role`, `jti` (GUID único)
- Blacklist para invalidación anticipada

### 12.3 Refresh Token

- Almacenado como SHA256 en BD (nunca en claro)
- Rotación: cada uso genera un nuevo token y revoca el anterior
- Revocación individual o masiva (logout-all)
- Limpieza periódica de tokens expirados

### 12.4 Rate Limiting

- 5 intentos por minuto por IP en `/api/auth/login`
- Rechazo inmediato (sin cola)
- HTTP 429 en exceso

### 12.5 Recomendaciones de Producción

1. **HTTPS obligatorio** — el token viaja en headers
2. **Secret JWT** — generar con `openssl rand -base64 48`
3. **Rate limiting** — considerar Redis para ventanas compartidas
4. **Blacklist** — considerar Redis para high-availability
5. **Monitoreo** — alertar sobre picos de 429 y tokens en blacklist
6. **Limpieza** — job periódico ejecutando `SP_RefreshToken_Limpiar` y `SP_TokenBlacklist_Limpiar`
7. **Logs** — registrar intentos fallidos, refresh tokens, y logouts

---

## 13. Archivos Involucrados

### Backend

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `ScriptsDB/sp_seguridad.sql` | SQL | 13 SPs + 2 tablas + ALTER TABLE (migración) |
| `Helpers/HashHelper.cs` | C# | BCrypt: HashPassword, VerifyPassword, EsHashBcrypt |
| `Services/JwtService.cs` | C# | Generación de access tokens (HS256, 15min) |
| `Services/RefreshTokenService.cs` | C# | CRUD de refresh tokens (SHA256 hash) |
| `Services/AuthService.cs` | C# | Login dual SHA256→BCrypt, generación de par de tokens |
| `Controllers/AuthController.cs` | C# | Endpoints: login, refresh, logout, logout-all |
| `Program.cs` | C# | DI (IJwtService, IRefreshTokenService), rate limiting, pipeline |
| `appsettings.json` | JSON | Jwt:AccessTokenMinutes=15, Jwt:RefreshTokenDays=7 |
| `LexControlApi.csproj` | XML | BCrypt.Net-Next v4.0.3 |
| `Dtos/Auth/AuthDtos.cs` | C# | RefreshRequestDto, LogoutRequestDto, LoginResponseDto.RefreshToken |
| `Dtos/Usuarios/UsuarioDtos.cs` | C# | AutenticacionFila.HashLegacy, UsuarioAutenticacionFila |

### Frontend

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `core/auth/auth-service.ts` | TypeScript | refrescar(), persistencia de refreshToken |
| `core/auth/auth-interceptor.ts` | TypeScript | Auto-refresh en 401 |
| `core/api/respuesta-api.ts` | TypeScript | SesionRespuesta.refreshToken |
