# Módulo de Usuarios — Documentación Técnica

> Documentación del submódulo **Gestión de Usuarios** (Login, Perfil, Usuarios y Permisos) de **LexControl**, el sistema de gestión de expedientes para un bufete jurídico guatemalteco.
>
> **Criterio**: Incluye (1) funcionalidad de la aplicación, (2) verificación en la base de datos, y (3) explicación técnica de modelos, rutas y componentes.

---

## 1. Estructura de carpetas del proyecto

```
LexControl/
├── Base_Datos.sql                  — Creación de BD DBLexControl (esquema principal)
├── Proceso_almacenados.sql         — 38 procedimientos SP_* de CRUD (Windows-1252)
├── Reportes_almacenados.sql        — 9 procedimientos SP_Reporte_* (UTF-8 BOM)
├── link-figma.txt                  — Enlace de diseño + token API Figma (no versionar)
├── AGENTS.md                       — Instrucciones para agentes IA
├── Incremento1.txt                 — Requerimientos de documentación (este archivo)
├── MóduloUsuarios.md               — ← Este documento
│
├── Desarrollo/
│   ├── LexControlDB.sql            — Script único (esquema + SPs + seeds) de referencia
│   ├── Usuarios_SP.sql             — SPs extra para Login + Gestión de Usuarios
│   ├── Back-end/
│   │   └── LexControlApi/          — API REST en .NET 10 (Dapper + JWT)
│   │       ├── Controllers/        — EndPoints RESTful (Auth, Perfil, Usuarios, Permisos)
│   │       ├── Services/           — Lógica de negocio (AuthService, UsuarioService, etc.)
│   │       ├── Data/               — Capa de datos (IRepositorio, ConnectionFactory)
│   │       ├── Dtos/               — DTOs de entrada/salida por controlador
│   │       ├── Models/             — Modelos de dominio (futuro)
│   │       ├── Helpers/            — ApiResponse, HashHelper, ClaimsExtension
│   │       ├── Middleware/         — ManejadorExcepciones (captura global de errores)
│   │       ├── Excepciones/        — ExcepcionNegocio
│   │       ├── appsettings.json    — Configuración (conexiones, JWT)
│   │       ├── Program.cs          — Bootstrap de la aplicación
│   │       └── LexControlApi.csproj
│   │
│   └── Front-end/
│       ├── LexControlFornt/        — SPA Angular 20 (standalone components)
│       │   ├── src/app/
│       │   │   ├── core/           — Servicios, guards, interceptores, modelos
│       │   │   ├── layout/         — Shell, sidebar, topbar, toast
│       │   │   ├── shared/         — Componentes reutilizables (modal, íconos)
│       │   │   ├── features/       — Módulos por pantalla (login, ajustes, etc.)
│       │   │   ├── app.routes.ts   — Rutas (login público; resto bajo shell + guards)
│       │   │   └── app.config.ts   — Providers globales
│       │   └── src/environments/
│       │       ├── environment.ts  — Producción
│       │       └── environment.development.ts — Dev (apiBaseUrl: localhost:5181)
│       └── LexControlFornt/package.json
│
├── despliegue/LexControlDemo/      — Frontend estático mock (HTML/CSS/JS + datos mock)
└── Pototipo/                        — Copia del demo (validación visual con cliente)
```

### Convenciones del repositorio

| Aspecto | Regla |
|---|---|
| Nombres de tablas | UPPERCASE |
| Nombres de columnas | CamelCase |
| Nombres de SP | `SP_Entidad_Accion` (ej. `SP_Usuario_Autenticar`) |
| Codificación `Proceso_almacenados.sql` | Windows-1252 (ANSI), sin BOM — **conservar al editar** |
| Codificación `Reportes_almacenados.sql` | UTF-8 con BOM |
| Codificación `Base_Datos.sql` | UTF-8 con BOM |
| Borrado | Nunca `DELETE`; siempre `Activo = 0` (borrado lógico) |
| Comentarios | En español |

---

## 2. Instrucciones de inicio

### 2.1 Requisitos previos

| Herramienta | Versión |
|---|---|
| SQL Server (SSMS o `sqlcmd`) | SQL Server 2019+ |
| .NET SDK | 10.0 |
| Node.js + npm | 20+ |
| Angular CLI | 20.1+ (`npm i -g @angular/cli`) |

### 2.2 1. Crear la base de datos

Ejecutar en orden sobre una instancia SQL Server local (ej. `.\SQLEXPRESS`):

```sql
-- 1) Esquema + seeds + usuario admin
Base_Datos.sql

-- 2) Procedimientos almacenados de CRUD (codificación Windows-1252)
Proceso_almacenados.sql

-- 3) Procedimientos de reportes (UTF-8 con BOM)
Reportes_almacenados.sql

-- 4) SPs de usuarios/permisos (submódulo de Ajustes)
Desarrollo\Usuarios_SP.sql
```

> **Usuario admin por defecto**: `admin` / `admin123`
>
> **Bug conocido** (`Base_Datos.sql:12-16`): el `IF EXISTS` comprueba `DBLexControl` pero el `DROP` usa `LexControlDB` — el drop falla silenciosamente. Ejecutar igual crea la BD correctamente.

### 2.3 2. Iniciar el backend (API REST)

```bash
cd Desarrollo/Back-end/LexControlApi
dotnet run
```

- La API arranca en `http://localhost:5181` (o `https://localhost:7186`).
- Swagger UI disponible en `https://localhost:7186/swagger` con botón "Authorize" (Bearer JWT).
- Credenciales admin: `admin` / `admin123`.

### 2.4 3. Iniciar el frontend (SPA Angular)

```bash
cd Desarrollo/Front-end/LexControlFornt
npm install        # primera vez
npm start
```

- El SPA arranca en `http://localhost:4200`.
- El `proxy.conf.json` redirige `/api/*` al backend (`http://localhost:5181`), evitando CORS en desarrollo.

### 2.5 4. Secuencia de prueba del módulo

1. Navegar a `http://localhost:4200/login`.
2. Ingresar `admin` / `admin123`.
3. El dashboard carga con datos reales del API.
4. Click en **Ajustes** → pestaña **Perfil** para editar nombre/email/teléfono.
5. En **Ajustes** → **Usuarios** se lista, crea, edita y activa/desactiva usuarios.
6. En **Ajustes** → **Permisos** se ajusta la matriz de módulos por rol.
7. Cerrar sesión desde el menú del sidebar.

---

## 3. Funcionalidad de la aplicación

### 3.1 Login y autenticación

| Aspecto | Detalle |
|---|---|
| Endpoint | `POST /api/auth/login` |
| Cuerpo | `{ usuario: string, contrasena: string }` |
| Respuesta 200 | `{ success, data: { token, expiracion, usuarioId, usuario, nombreCompleto, rolId, rol } }` |
| Respuesta 401 | `"Usuario o contraseña incorrectos."` |
| Hash | SHA256 hex (sin salt — debilidad heredada del seed; ver §7.2) |
| Token | JWT con claims: `NameIdentifier`, `Name`, `usuario`, `rol_id`, `Role`. Expira en 120 min. |
| Bloqueo | Tras 5 intentos fallidos (`SP_Usuario_RegistrarIntentoFallido`) |
| Sesión | JWT en `sessionStorage` (claves: `lexcontrol_token`, `lexcontrol_usuario`, etc.) |
| Interceptor | Agrega `Authorization: Bearer` a toda petición al API; ante 401 en endpoints protegidos, cierra sesión y redirige a `/login`. |

**[Captura de pantalla: Pantalla de login]**

### 3.2 Perfil del usuario

Perfil propio del usuario autenticado, conectado a la tabla `PERSONA` + `USUARIO`.

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/perfil` | GET | Obtiene nombre, email, teléfono, rol del usuario autenticado |
| `/api/perfil` | PUT | Actualiza nombre, email, teléfono (campos obligatorios: nombre y email) |
| `/api/perfil/contrasena` | PUT | Cambia contraseña validando la actual (no puede ser igual a la nueva) |

**Componente frontend**: `PerfilCard` (`src/app/features/ajustes/perfil-card.ts`)
- Muestra nombre, rol, email y teléfono.
- Modal de edición con formulario reactivo (`ReactiveFormsModule`).
- Al guardar, actualiza la señal de sesión (`AuthService.actualizarNombre`) y el topbar en tiempo real.

**Política de contraseña** (replicada del prototipo `ajustes-comun.js`):
- Mínimo 8 caracteres
- Al menos un dígito
- Al menos un carácter especial

### 3.3 Gestión de usuarios

CRUD completo de usuarios del sistema, **solo rol Administrador**. Conectado a las tablas `PERSONA` y `USUARIO`.

| Acción | Endpoint | Método | SP | Descripción |
|---|---|---|---|---|
| Listar | `/api/usuarios` | GET | `SP_Usuario_Listar` | Filtros: `filtroNombre`, `rolId`, `activo` (query params opcionales) |
| Roles | `/api/usuarios/roles` | GET | `SP_Rol_Listar` | Catálogo de roles activos para el formulario |
| Detalle | `/api/usuarios/{id}` | GET | `SP_Usuario_ObtenerPorID` | Datos completos de PERSONA + ROL |
| Crear | `/api/usuarios` | POST | `SP_Usuario_CrearCompleto` | Crea PERSONA + USUARIO en transacción |
| Editar | `/api/usuarios/{id}` | PUT | `SP_Usuario_Actualizar` | Contraseña vacía conserva la actual |
| Cambiar estado | `/api/usuarios/{id}/estado` | PUT | `SP_Usuario_CambiarEstado` | Borrado lógico (`Activo=0`); no aplica a Admin |
| Desbloquear | `/api/usuarios/{id}/desbloquear` | POST | `SP_Usuario_Desbloquear` | Limpia bloqueo por intentos fallidos |

**Componentes frontend**:
- `UsuariosCard` (`src/app/features/ajustes/usuarios-card.ts`): tabla con filtros reactivos, botones de activar/desactivar y desbloquear.
- `UsuarioModal` (`src/app/features/ajustes/usuario-modal.ts`): formulario modal de alta/edición con validaciones.
  - Al **crear**: contraseña obligatoria (mín. 8, dígito y especial).
  - Al **editar**: contraseña opcional (vacía = conserva la actual).

**Reglas de negocio**:
- No se puede desactivar el Administrador (retorna `-2`).
- El nombre de la cuenta (`Usuario`) es `UNIQUE`; crear con uno repetido retorna error `2627`/`409 Conflict`.
- El DPI tiene índice `UNIQUE` filtrado (admite múltiples nulos).

**[Captura de pantalla: Tabla de usuarios con filtros]**

**[Captura de pantalla: Modal de crear/editar usuario]**

### 3.4 Matriz de permisos

Control de visibilidad de módulos por rol. Conectado a las tablas `MODULO` y `PERMISO_ROL`.

| Endpoint | Método | SP | Descripción | Autorización |
|---|---|---|---|---|
| `/api/permisos` | GET | `SP_Permiso_Listar` | Matriz completa (todos los roles) | Solo Administrador |
| `/api/permisos/{rolId}` | GET | `SP_Permiso_ObtenerPorRol` | Módulos visibles de un rol | Cualquiera (menú lateral) |
| `/api/permisos/{rolId}` | PUT | `SP_Permiso_GuardarRol` | Guarda matriz completa del rol | Solo Administrador |

**Componente frontend**: `PermisosCard` (`src/app/features/ajustes/permisos-card.ts`)
- Tabla rol × módulo con checkboxes.
- Botones: **Guardar** (envía toda la matriz) y **Restaurar valores por defecto**.
- Reglas fijas validadas también en backend:
  - `dashboard` nunca puede ocultarse.
  - Al `Administrador` nunca se le quita acceso a `ajustes`.

**Defaults por rol** (`permisos.ts`):
| Rol | Módulos visibles |
|---|---|
| Administrador | Todos (10 módulos) |
| Secretaria | Todos excepto Histórico Legal y Notificaciones OJ |
| Abogado | Todos excepto Mantenimiento |

**[Captura de pantalla: Matriz de permisos rol × módulo]**

---

## 4. Verificación en la base de datos

### 4.1 Tablas involucradas

#### `PERSONA` (tabla base, herencia por subclase)

```sql
CREATE TABLE PERSONA (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    NombreCompleto NVARCHAR(100) NOT NULL,
    DPI NVARCHAR(20) NULL,
    TelefonoPrincipal NVARCHAR(20) NULL,
    EmailPrincipal NVARCHAR(100) NULL,
    Direccion NVARCHAR(200) NULL,
    FechaNacimiento DATE NULL,
    Genero CHAR(1) NULL,               -- CHECK: 'M'|'F'|'O'
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NULL,
    UsuarioCreacion_ID INT NULL,
    UsuarioModificacion_ID INT NULL,
    CONSTRAINT CHK_PERSONA_Genero CHECK (Genero IN ('M', 'F', 'O'))
);
-- Índices: IX_PERSONA_Nombre, IX_PERSONA_Email, IX_PERSONA_Activo
-- Índice único filtrado: UX_PERSONA_DPI (admite múltiples NULLs)
```

#### `USUARIO` (hereda de PERSONA vía Persona_ID UNIQUE)

```sql
CREATE TABLE USUARIO (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Persona_ID INT NOT NULL UNIQUE,     -- herencia: 1:1 con PERSONA
    Rol_ID INT NOT NULL,
    Usuario NVARCHAR(50) NOT NULL UNIQUE,
    ContraseñaHash NVARCHAR(255) NOT NULL,
    UltimoAcceso DATETIME NULL,
    IntentosFallidos INT NOT NULL DEFAULT 0,
    Bloqueado BIT NOT NULL DEFAULT 0,
    FechaBloqueo DATETIME NULL,
    CONSTRAINT FK_USUARIO_PERSONA FOREIGN KEY (Persona_ID) REFERENCES PERSONA(ID) ON DELETE CASCADE,
    CONSTRAINT FK_USUARIO_ROL FOREIGN KEY (Rol_ID) REFERENCES ROL(ID)
);
```

#### `ROL`

```sql
CREATE TABLE ROL (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(30) NOT NULL UNIQUE,
    Descripcion NVARCHAR(200) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
);
-- Seeds: Administrador (ID 1), Secretaria (ID 2), Abogado (ID 3)
```

#### `MODULO` + `PERMISO_ROL` (gestión de permisos)

```sql
CREATE TABLE MODULO (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Icono NVARCHAR(50) NULL,   -- clave del ícono SVG
    Ruta NVARCHAR(100) NULL,   -- ruta del router
    Orden INT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE PERMISO_ROL (
    Rol_ID INT NOT NULL,
    Modulo_ID INT NOT NULL,
    Activo BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK_PERMISO_ROL PRIMARY KEY (Rol_ID, Modulo_ID),
    CONSTRAINT FK_PERMISO_ROL_ROL FOREIGN KEY (Rol_ID) REFERENCES ROL(ID) ON DELETE CASCADE,
    CONSTRAINT FK_PERMISO_ROL_MODULO FOREIGN KEY (Modulo_ID) REFERENCES MODULO(ID) ON DELETE CASCADE
);

-- Módulos sembrados (8 módulos según Usuarios_SP.sql)
-- Dashboard, Clientes, Expedientes, Agenda, Trámites, Histórico Legal,
-- Notificaciones OJ, Mantenimiento
```

#### `CONFIGURACION`

```sql
CREATE TABLE CONFIGURACION (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Clave NVARCHAR(50) NOT NULL UNIQUE,
    Valor NVARCHAR(MAX) NOT NULL,
    Descripcion NVARCHAR(200) NULL,
    FechaModificacion DATETIME NOT NULL DEFAULT GETDATE(),
    Usuario_ID INT NOT NULL,
    CONSTRAINT FK_CONFIGURACION_USUARIO FOREIGN KEY (Usuario_ID) REFERENCES USUARIO(ID)
);
-- Seeds: NombreBufete, EmailBufete, FormatoExpediente, Días de anticipación...
```

### 4.2 Procedimientos almacenados utilizados

#### Autenticación

| SP | Parámetros | Return / SELECT | Uso |
|---|---|---|---|
| `SP_Usuario_Autenticar` | `@Usuario`, `@ContraseñaHash` | SELECT fila o nada | Login (AuthService) |
| `SP_Usuario_RegistrarIntentoFallido` | `@Usuario` | RETURN 0 | Incrementa IntentosFallidos; bloquea a los 5 |
| `SP_Usuario_ActualizarAcceso` | `@Usuario` | (UPDATE) | Actualiza UltimoAcceso en login exitoso |

#### Gestión de usuarios

| SP | Parámetros | Return | Uso |
|---|---|---|---|
| `SP_Usuario_Listar` | `@FiltroNombre`, `@Rol_ID`, `@Activo` (todos NULL/default) | RETURN 0 + SELECT lista | Listado con filtros |
| `SP_Usuario_ObtenerPorID` | `@ID` | RETURN 0 + SELECT fila | Detalle / Perfil |
| `SP_Usuario_CrearCompleto` | `@NombreCompleto`, `@EmailPrincipal`, `@TelefonoPrincipal`, `@Usuario`, `@Rol_ID`, `@ContraseñaHash` | OUTPUT `@NuevoID` | Crear usuario (transacción PERSONA + USUARIO) |
| `SP_Usuario_Actualizar` | `@ID`, `@NombreCompleto`, `@EmailPrincipal`, `@TelefonoPrincipal`, `@Usuario`, `@Rol_ID`, `@ContraseñaHash` (NULL = conservar) | RETURN 0 / -1 | Editar usuario |
| `SP_Usuario_CambiarEstado` | `@ID`, `@Activo` | RETURN 0 / -1 / -2 | Activar/desactivar (bloquea Admin) |
| `SP_Usuario_Desbloquear` | `@ID` | RETURN 0 | Desbloquear cuenta |
| `SP_Usuario_CambiarContrasena` | `@ID`, `@HashActual`, `@HashNuevo` | RETURN 0 / -1 / -2 | Cambio de contraseña (Perfil) |
| `SP_Rol_Listar` | — | SELECT lista | Catálogo de roles |
| `SP_Perfil_Actualizar` | `@Usuario_ID`, `@NombreCompleto`, `@EmailPrincipal`, `@TelefonoPrincipal` | RETURN 0 | Actualizar perfil propio |

#### Permisos

| SP | Parámetros | Return | Uso |
|---|---|---|---|
| `SP_Permiso_Listar` | — | SELECT matriz rol×módulo | `GET /api/permisos` |
| `SP_Permiso_ObtenerPorRol` | `@Rol_ID` | SELECT módulos | `GET /api/permisos/{rolId}` (menú) |
| `SP_Permiso_Actualizar` | `@Rol_ID`, `@Modulo_Nombre`, `@Activo` | RETURN 0 / THROW | Actualización individual (SP alternativo) |

> **Nota**: El `PermisoService` backend llama a `SP_Permiso_Listar` y `SP_Permiso_GuardarRol`, pero **estos SPs no están definidos** en `Usuarios_SP.sql` (que define `SP_Permiso_ObtenerPorRol` y `SP_Permiso_Actualizar` en su lugar). `SP_Permiso_GuardarRol` (guardado masivo en JSON) **no existe todavía**. Esto es un gap conocido por implementar.

### 4.3 Seeds de catálogos (verificación)

#### Roles

```sql
INSERT INTO ROL (Nombre, Descripcion) VALUES
('Administrador', 'Acceso total al sistema'),      -- ID 1
('Secretaria', 'Acceso a gestión de agenda y documentos'), -- ID 2
('Abogado', 'Acceso a gestión de casos y audiencias'); -- ID 3
```

#### Usuario administrador

```sql
-- Persona base
INSERT INTO PERSONA (NombreCompleto, EmailPrincipal, Activo)
VALUES ('Administrador del Sistema', 'admin@bufete.com', 1);

-- Usuario (hash SHA256 de "admin123")
INSERT INTO USUARIO (Persona_ID, Rol_ID, Usuario, ContraseñaHash)
SELECT @PersonaAdminID,
       (SELECT MIN(ID) FROM ROL WHERE Nombre = 'Administrador'),
       'admin',
       '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
```

Verificación del hash:
```sql
SELECT HASHBYTES('SHA2_256', 'admin123')
-- Devuelve: 0x240BE518FABD2724DDB6F04EEB1DA5967448D7E831C08C8FA822809F74C720A9
-- Convertir a hex minúscula → 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9 ✓
```

#### Módulos (MODULO)

| Nombre | Icono | Ruta | Orden |
|---|---|---|---|
| Dashboard | dashboard | /dashboard | 1 |
| Clientes | people | /clientes | 2 |
| Expedientes | folder | /expedientes | 3 |
| Agenda | event | /agenda | 4 |
| Trámites | assignment | /tramites | 5 |
| Histórico Legal | history | /historico | 6 |
| Notificaciones OJ | notifications | /notificaciones | 7 |
| Mantenimiento | settings | /mantenimiento | 8 |

---

## 5. Explicación técnica

### 5.1 Arquitectura general

```
    ┌─────────────────────────────────────────────┐
    │              Frontend SPA (Angular 20)       │
    │  src/app/  (standalone components, signals)  │
    └──────────────┬──────────────────────────────┘
                   │  HTTPS + Bearer JWT (sessionStorage)
    ┌──────────────▼──────────────────────────────┐
    │  Backend API (.NET 10 / ASP.NET Core)       │
    │  ┌──────────────┐  ┌──────────┐  ┌───────┐   │
    │  │ Controllers  │──│ Services │──│ Repo  │   │
    │  │  REST/JSON   │  │  Business│  │ Dapper│   │
    │  └──────────────┘  └──────────┘  └───┬───┘   │
    └───────────────────────────────────────┼───────┘
                                           │ Stored Procedures (SQL Server)
    ┌───────────────────────────────────────▼───────┐
    │              Base de datos DBLexControl       │
    │  Base_Datos.sql + Proceso_almacenados.sql     │
    │  + Usuarios_SP.sql (módulo usuarios/permisos)  │
    │  + Reportes_almacenados.sql                   │
    └───────────────────────────────────────────────┘
```

**Principios de diseño**:
- **Data access vía Stored Procedures exclusivamente** — el backend nunca envía SQL dinámico; los SPs son el "muro contra inyección SQL" (convención del repositorio `AGENTS.md`).
- **Dapper como micro-ORM** — mapea resultados de SP a DTOs sin `DbContext` ni Entity Framework.
- **Borrado lógico** — nunca `DELETE`; se usa `Activo = 0`.
- **Respuesta estándar** — todos los endpoints devuelven `{ success: bool, data: T, error: string|null }`.
- **Errores centralizados** — `ManejadorExcepciones` catcha `ExcepcionNegocio`, `SqlException` y `Exception` general, devolviendo JSON consistente.

### 5.2 Backend — Modelos, rutas y componentes

#### Dependency Injection (`Program.cs`)

```
IConnectionFactory  → SqlConnectionFactory (singleton)
IRepositorio       → RepositorioSql (scoped)
IAuthService       → AuthService (scoped)
IUsuarioService    → UsuarioService (scoped)
IPerfilService     → PerfilService (scoped)
IPermisoService    → PermisoService (scoped)
```

#### Controladores y rutas

##### `AuthController` — `api/auth`

| Método | Endpoint | Body | Respuesta |
|---|---|---|---|
| POST | `/login` | `LoginRequestDto { usuario, contrasena }` | `LoginResponseDto` (token JWT + datos sesión) |

**Flujo** (`AuthService.LoginAsync`):
1. Hash SHA256 hex de la contraseña (`HashHelper.Sha256Hex`).
2. Ejecuta `SP_Usuario_Autenticar` con parámetros nombrados.
3. Si la fila existe → actualiza `UltimoAcceso` (`SP_Usuario_ActualizarAcceso`) y genera JWT.
4. Si falla → registra intento fallido (`SP_Usuario_RegistrarIntentoFallido`).

**Claims del JWT**:
| Claim | Tipo | Valor |
|---|---|---|
| NameIdentifier | `ClaimTypes.NameIdentifier` | `U.ID` (int) |
| Name | `ClaimTypes.Name` | `P.NombreCompleto` |
| usuario | custom | `U.Usuario` |
| rol_id | custom | `U.Rol_ID` (int) |
| Role | `ClaimTypes.Role` | `R.Nombre` |

##### `PerfilController` — `api/perfil` (autenticado)

| Método | Endpoint |
|---|---|
| GET | `/` — Perfil del usuario autenticado |
| PUT | `/` — Actualizar nombre, email, teléfono |
| PUT | `/contrasena` — Cambiar contraseña (valida actual) |

**DTOs**:
- `PerfilDto`: `{ id, nombreCompleto, usuario, email, telefono, rolId, rol, activo }`
- `PerfilActualizarDto`: `{ nombreCompleto, email, telefono? }`
- `CambioContrasenaDto`: `{ contrasenaActual, contrasenaNueva, confirmacion }` — valida que la nueva ≠ actual (retorno `-3`).

##### `UsuariosController` — `api/usuarios` (solo `Administrador`)

| Método | Endpoint | Body |
|---|---|---|
| GET | `/` (filtros query) | — |
| GET | `/roles` | — |
| GET | `/{id}` | — |
| POST | `/` | `UsuarioCrearDto` |
| PUT | `/{id}` | `UsuarioActualizarDto` |
| PUT | `/{id}/estado` | `UsuarioEstadoDto` |
| POST | `/{id}/desbloquear` | — |

**DTOs**:

`UsuarioCrearDto`:
```csharp
{
  NombreCompleto: string  [Required, MaxLength(100)]
  Email:          string  [Required, EmailAddress, MaxLength(100)]
  Telefono:       string? [MaxLength(20)]
  Cuenta:         string  [Required, MaxLength(50), Regex ^[A-Za-z0-9._-]+$]
  RolId:          int     [Required, Range(1, int.MaxValue)]
  Contrasena:     string  [Required, Regex: 8+ + dígito + especial]
}
```

`UsuarioActualizarDto`: igual, pero `Contrasena` es opcional (NULL = conservar).

`UsuarioEstadoDto`: `{ Activo: bool }`

**Mapeo UsuarioFila → UsuarioDto**:
`UsuarioFila` (columnas del SP) → `UsuarioDto` (camelCase para el frontend) vía método estático `Desde()`.

##### `PermisosController` — `api/permisos`

| Método | Endpoint | Autorización |
|---|---|---|
| GET | `/` (matriz completa) | Administrador |
| GET | `/{rolId}` (módulos visibles) | Cualquiera |
| PUT | `/{rolId}` (guardar matriz) | Administrador |

**DTOs**:
- `PermisoDto`: `{ clave, nombre, ruta, icono, orden, activo }` — fila individual.
- `PermisoRolDto`: `{ rolId, rol, modulos: PermisoDto[] }` — matriz agrupada por rol.
- `PermisoGuardarDto`: `{ modulos: Dictionary<string, bool> }` — cuerpo del PUT.

#### Data layer (`IRepositorio` / `RepositorioSql`)

| Método | Uso |
|---|---|
| `ConsultarListaAsync<T>(sp, params)` | SPs que devuelven listas (ej. `SP_Usuario_Listar`) |
| `ConsultarPrimeroAsync<T>(sp, params)` | SPs que devuelven un fila (ej. `SP_Usuario_ObtenerPorID`) |
| `EjecutarRetornoAsync(sp, params)` | SPs de acción que devuelven código (RETURN 0/-1/-2) |
| `InsertarAsync(sp, params, outputParam)` | SPs con parámetro OUTPUT (ej. `SP_Usuario_CrearCompleto`) |

`DynamicParameters` captura `@RETURN_VALUE` automáticamente para validar el retorno del SP.

### 5.3 Frontend — Modelos, rutas y componentes

#### Router (`app.routes.ts`)

| Ruta | Componente | Guard | Auth |
|---|---|---|---|
| `/login` | `LoginPage` | `loginGuard` (redirige si ya logueado) | Pública |
| `''` → `/dashboard` | `DashboardPage` | `authGuard` + `moduloGuard('dashboard')` | Shell |
| `/ajustes` | `AjustesPage` | `authGuard` + `moduloGuard('ajustes')` | Shell |
| `/clientes`, `/expedientes`, etc. | `PaginaEnConstruccion` | `moduloGuard(key)` | Shell |
| `**` | redirect `/dashboard` | — | — |

#### Shell y layout (`src/app/layout/`)

- **`shell.ts`**: contenedor con `<router-outlet>`, incluye `Sidebar` y `Topbar`.
- **`sidebar.ts`**: navegación filtrada por permisos del rol. Usa `PermisosService.menu` (signal computada). Íconos SVG inline (paths de `MODULOS` en `permisos.ts`).
- **`topbar.ts`**: búsqueda global, campana de notificaciones, avatar con nombre + rol.

#### Guards (`src/app/core/auth/`)

| Guard | Lógica |
|---|---|
| `authGuard` | Si no hay sesión válida → redirect `/login` |
| `loginGuard` | Si ya hay sesión → redirect `/dashboard` |
| `moduloGuard(key)` | Carga menú del rol (`GET /api/permisos/{rolId}`); si el módulo no está activo → redirect `/dashboard` |

#### Interceptor (`auth-interceptor.ts`)

- Agrega `Authorization: Bearer <token>` a toda petición hacia `environment.apiBaseUrl`.
- Ante `401` en endpoints protegidos (no `/login`): cierra sesión y redirige a `/login`.

#### Modelos TypeScript (`src/app/core/models/`)

**`usuario.model.ts`**:
```typescript
interface Perfil              { id, nombreCompleto, usuario, email, telefono, rol, rolId, activo }
interface PerfilActualizarDto { nombreCompleto, email, telefono? }
interface CambioContrasenaDto { contrasenaActual, contrasenaNueva, confirmacion }
interface UsuarioLista        { id, nombreCompleto, usuario, email, telefono, rol, rolId,
                                activo, bloqueado, ultimoAcceso, fechaCreacion }
interface RolCatalogo         { id, nombre, descripcion }
interface UsuarioGuardarDto   { nombreCompleto, email, telefono?, cuenta, rolId, contrasena? }
```

**`permiso.model.ts`**:
```typescript
interface ModuloPermiso    { clave, nombre, ruta, icono, orden, activo }
interface RolConModulos    { rolId, rol, modulos: ModuloPermiso[] }
interface PermisosGuardarDto { modulos: Record<string, boolean> }
```

**`respuesta-api.ts`**:
```typescript
interface RespuestaApi<T>      { success: boolean, data: T, error: string | null }
interface SesionRespuesta      { token, expiracion, usuarioId, usuario, nombreCompleto, rolId, rol }
```

#### Servicios (`src/app/core/services/`)

**`auth-service.ts`**:
- `iniciarSesion(usuario, contrasena)`: POST `/api/auth/login` → persiste sesión en `sessionStorage`.
- `cerrarSesion()`: limpia storage y señal.
- `actualizarNombre(nombre)`: actualiza señal + storage tras editar perfil.
- Señales expuestas: `sesion`, `estaAutenticado`, `nombre`, `rol`, `rolId`, `token`.
- `leerSesion()`: reconstruye sesión al cargar la app (valida expiración).

**`usuarios-service.ts`**:
- `listar(filtros?)`: GET `/api/usuarios` con query params.
- `roles()`: GET `/api/usuarios/roles`.
- `crear(datos)`: POST `/api/usuarios` → 201.
- `actualizar(id, datos)`: PUT `/api/usuarios/{id}` → 200.
- `cambiarEstado(id, activo)`: PUT `/api/usuarios/{id}/estado` → 204.
- `desbloquear(id)`: POST `/api/usuarios/{id}/desbloquear` → 204.

**`perfil-service.ts`**:
- `obtener()`: GET `/api/perfil`.
- `actualizar(datos)`: PUT `/api/perfil` → 204.
- `cambiarContrasena(datos)`: PUT `/api/perfil/contrasena` → 204.

**`permisos.ts` (PermisosService)**:
- `cargarMenu()`: GET `/api/permisos/{rolId}` → señal `_menu`.
- `obtenerMatriz()`: GET `/api/permisos` (solo Admin).
- `guardarRol(rolId, modulos)`: PUT `/api/permisos/{rolId}`.
- `recargarMenu()`: fuerza recarga tras cambios.
- `tiene(clave)`: verifica si el módulo está activo en el menú.
- Defaults por rol hardcodeados (`PERMISOS_DEFECTO`), usados como fallback.

### 5.4 Seguridad

| Aspecto | Implementación |
|---|---|
| Transport | HTTPS (backend redirige HTTP→HTTPS) |
| Auth | JWT Bearer (120 min de expiración) |
| Hash de contraseñas | SHA256 hex sin salt (compatible con seed) — **debilidad conocida** |
| Token storage | `sessionStorage` (no persiste en refresh) |
| CORS | Orígenes: `localhost:5173`, `localhost:4200`, `localhost:3000`, `localhost:8080` |
| Inyección SQL | Bloqueada por SPs con parámetros nombrados (Dapper) |
| Autorización | `[Authorize(Roles = "Administrador")]` en Usuarios/Permisos |
| Errores | `ManejadorExcepciones` oculta detalles en producción |

### 5.5 DTOs resumen (contrato frontend ↔ backend)

#### Login

```
POST /api/auth/login
  { usuario: "admin", contrasena: "admin123" }

200 → { success: true, data: {
  token: "eyJhbGci...",
  expiracion: "2026-08-26T15:30:00Z",
  usuarioId: 1,
  usuario: "admin",
  nombreCompleto: "Administrador del Sistema",
  rolId: 1,
  rol: "Administrador"
}}

401 → { success: false, error: "Usuario o contraseña incorrectos." }
```

#### Usuario (listado → detalle → crear/editar)

```
GET /api/usuarios?filtroNombre=juan&rolId=2&activo=true
  → { success: true, data: [ UsuarioLista[] ] }

POST /api/usuarios
  { nombreCompleto, email, telefono?, cuenta, rolId, contrasena }
  → 201 Created, data: UsuarioDto

PUT /api/usuarios/{id}
  { nombreCompleto, email, telefono?, cuenta, rolId, contrasena? }
  → 200 OK, data: UsuarioDto

PUT /api/usuarios/{id}/estado
  { activo: false }
  → 204 No Content
```

#### Permiso (matriz → módulos de un rol → guardar)

```
GET /api/permisos
  → 200, data: PermisoRolDto[]  (solo Admin)

GET /api/permisos/{rolId}
  → 200, data: ModuloPermiso[]

PUT /api/permisos/{rolId}
  { modulos: { "dashboard": true, "clientes": false, ... } }
  → 204 No Content (solo Admin)
```

---

## 6. Capturas de pantalla

> Reemplace los marcadores de posición a continuación con capturas reales del sistema. Cada captura debe mostrarse al momento de la acción correspondiente.

### 6.1 Pantalla de login

`[INSERTAR CAPTURA: /login — formulario con campos Usuario y Contraseña, botón "Iniciar Sesión" y mensaje de error rojo.]`

### 6.2 Dashboard (después del login)

`[INSERTAR CAPTURA: Dashboard con tarjetas de estadísticas, agenda semanal y FAB "Nuevo Expediente".]`

### 6.3 Menú lateral y topbar (shell)

`[INSERTAR CAPTURA: Shell con sidebar colapsable, topbar con búsqueda, campana de notificaciones y avatar.]`

### 6.4 Ajustes — Tarjetas (Perfil, Preferencias, Usuarios, Permisos, Bufete, Seguridad)

`[INSERTAR CAPTURA: Página de Ajustes con todas las tarjetas visibles (rol Administrador).]`

### 6.5 Ajustes — Tabla de usuarios con filtros

`[INSERTAR CAPTURA: UsuariosCard con tabla, filtros de nombre/rol/estado activo, botones activar/desactivar/desbloquear.]`

### 6.6 Ajustes — Modal crear/editar usuario

`[INSERTAR CAPTURA: UsuarioModal con formulario (nombre, email, teléfono, cuenta, rol, contraseña).]`

### 6.7 Ajustes — Matriz de permisos

`[INSERTAR CAPTURA: PermisosCard con tabla rol × módulo, checkboxes activos/inactivos, botones Guardar y Restaurar.]`

### 6.8 Ajustes — Seguridad (cambio de contraseña)

`[INSERTAR CAPTURA: SeguridadCard con formulario de cambio de contraseña (actual, nueva, confirmación).]`

---

## 7. Consideraciones y limitaciones

### 7.1 Gaps conocidos

1. **`SP_Permiso_Listar` y `SP_Permiso_GuardarRol`**: el `PermisoService` backend los invoca, pero **no están definidos** en `Usuarios_SP.sql`. El archivo define `SP_Permiso_ObtenerPorRol` y `SP_Permiso_Actualizar` (individual). Se requiere crear estos SPs para que la matriz de permisos funcione end-to-end.
2. **SPs faltantes para reportes**: `SP_Reporte_AlertasPendientes` y `SP_Reporte_EventosAgendaMes` existen en `LexControlDB.sql` pero no en `Reportes_almacenados.sql`.
3. **Dashboard**: aún no consume endpoints reales de reportes (usa mock temporal).
4. **Módulos pendientes**: Clientes, Expedientes, Agenda, Trámites, Histórico, Notificaciones OJ, Mantenimiento y Reportes muestran `PaginaEnConstruccion` (carga perezosa con componente placeholder).

### 7.2 Debilidad de seguridad: SHA256 sin salt

El seed semilla de la BD almacena contraseñas como `HASHBYTES('SHA2_256', contraseña)` en hexadecimal minúscula. El backend replica esto en `HashHelper.Sha256Hex()` para compatibilidad.

**Riesgo**: SHA256 sin salt es vulnerable a ataques de diccionario/rainbow table.

**Recomendación**: Migrar a **PBKDF2** (integrado en .NET via `Rfc2898DeriveBytes`) o **BCrypt** con salt aleatorio por usuario. Requiere:
- Una columna nueva `Salt` en `USUARIO`.
- Un script de migración que relance todos los hashes.
- Un flag de "hash legacy" para validar migraciones graduales.

### 7.3 Codificación de archivos SQL

| Archivo | Codificación correcta |
|---|---|
| `Base_Datos.sql` | UTF-8 con BOM |
| `Reportes_almacenados.sql` | UTF-8 con BOM |
| `Proceso_almacenados.sql` | Windows-1252 (ANSI) sin BOM — **no cambiar** |
| `Usuarios_SP.sql` | Windows-1252 (detallado en encabezado) |
| `LexControlDB.sql` | UTF-8 con BOM |

### 7.4 Política de contraseñas

```
Regex: ^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$
Reglas:
  ✓ Mínimo 8 caracteres
  ✓ Al menos un dígito
  ✓ Al menos un carácter especial (no alfanumérico)
  ✗ No distingue mayúsculas/minúsculas ni longitud máxima
```

### 7.5 Bloqueo de cuentas

| Evento | Acción |
|---|---|
| 1er intento fallido | Se registra (`IntentosFallidos++`) |
| 5to intento fallido | `Bloqueado = 1`, `FechaBloqueo = GETDATE()` |
| Login exitoso | `IntentosFallidos` no se reinicia en el SP actual — **posible mejora** |
| Desbloqueo manual | Admin → Ajustes → Usuarios → click "Desbloquear" |
