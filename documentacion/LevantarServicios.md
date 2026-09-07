# Levantar Servicios - LexControl

Guia paso a paso para levantar todos los servicios del proyecto LexControl en tu maquina local.

---

## 1. Prerequisitos

| Requisito | Version minima | Verificar con |
|---|---|---|
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **.NET SDK** | 10.0 | `dotnet --version` |
| **SQL Server** | Express o superior | SQL Server Management Studio (SSMS) |
| **Microsoft Edge** | Cualquier version reciente | `msedge --version` |

---

## 2. Base de datos

### 2.1 Crear la base de datos

Abrir SSMS, conectarse a `DESKTOP-V7G3G1I\SQLEXPRESS` (Windows Auth) y ejecutar los scripts en este orden:

1. **`Base_Datos.sql`** — Crea `DBLexControl` (48 tablas + inserts de catálogos + usuario admin)
2. **`Proceso_almacenados.sql`** — 38 procedimientos almacenados de CRUD
3. **`Reportes_almacenados.sql`** — 9 procedimientos de reportes
4. **`LexControl/ScriptsDB/sp_mantenimientos.sql`** — 10 procedimientos de mantenimiento de catálogos (CRUD genérico + Juzgado)

> **Importante**: Los scripts deben ejecutarse contra la base de datos `DBLexControl` ya existente. Si la BD no existe, ejecutar primero `Base_Datos.sql`.

### 2.2 Credenciales por defecto

| Usuario | Contrasena | Rol |
|---|---|---|
| `admin` | `Test1234!` | Administrador |

> **NOTA**: El backend hashea la contrasena con SHA256 antes de comparar. La contrasena `Test1234!` tiene el hash `0fadf52a4580cfebb99e61162139af3d3a6403c1d36b83e4962b721d1c8cbd0b` (guardado en la BD).

---

## 3. Backend (LexControlApi)

### 3.1 Ubicacion

```
LexControl/Back-end/LexControlApi/
```

### 3.2 Levantar el backend

```powershell
cd LexControl/Back-end/LexControlApi
dotnet run --launch-profile https
```

Esto arranca el API en:
- **HTTPS**: `https://localhost:7276` (perfil por defecto en desarrollo)
- **HTTP**: `http://localhost:5181` (solo si se usa el perfil `http`)

### 3.3 Verificar que funciona

```powershell
# PowerShell — ignora certificado autofirmado temporalmente
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("Content-Type", "application/json")
$wc.UploadString("https://localhost:7276/api/auth/login", '{"Usuario":"admin","Contrasena":"Test1234!"}')
```

Si devuelve JSON con `token`, el backend esta funcionando.

### 3.4 Puertos y perfiles

| Perfil | URL HTTP | URL HTTPS | Nota |
|---|---|---|---|
| `http` | `http://localhost:5181` | — | Sin SSL |
| `https` | `http://localhost:5181` | `https://localhost:7276` | **Recomendado** |

El perfil `https` (el recomendado) expone **ambos** puertos: HTTP y HTTPS. El middleware `UseHttpsRedirection` redirige cualquier peticion HTTP a HTTPS automaticamente.

### 3.5 Puertos en uso (verificar antes de levantar)

```powershell
netstat -ano | Select-String ":7276"
netstat -ano | Select-String ":5181"
```

Si algun puerto esta ocupado, matar el proceso anterior:

```powershell
# Matar todos los procesos dotnet
Get-Process -Name dotnet | Stop-Process -Force
```

---

## 4. Frontend (LexControlFornt)

### 4.1 Ubicacion

```
LexControl/Front-end/LexControlFornt/
```

### 4.2 Instalar dependencias (solo la primera vez)

```powershell
cd LexControl/Front-end/LexControlFornt
npm install
```

### 4.3 Levantar el frontend

```powershell
ng serve
```

Esto arranca el dev server en `http://localhost:4200` con **hot reload**.

> **IMPORTANTE**: El Angular dev server incluye un **proxy** (`proxy.conf.json`) que reenvia todas las peticiones `/api/*` al backend en `https://localhost:7276`. No necesitas configurar CORS manualmente ni tocar el navegador para aceptar el certificado autofirmado.

### 4.4 Proxy automatico

El archivo `proxy.conf.json` esta configurado para:

| Ruta del frontend | Se reenvia a | Nota |
|---|---|---|
| `http://localhost:4200/api/*` | `https://localhost:7276/api/*` | `secure: false` (acepta cert autofirmado) |

Esto significa que el frontend y el backend comparten el mismo origen (`localhost:4200`) desde la perspectiva del navegador. No hay problemas de CORS ni de certificado SSL.

### 4.5 Variable de entorno

En `src/environments/environment.development.ts`:

```typescript
export const environment = {
    apiBaseUrl: ''  // Vacio = usa el proxy (mismo origen)
};
```

**NUNCA** cambiar `apiBaseUrl` a una URL absoluta en desarrollo. Si lo cambias a `https://localhost:7276`, el navegador rechazara las peticiones por el certificado autofirmado.

### 4.6 Verificar que funciona

Abrir `http://localhost:4200` en Edge. Deberia cargar la pantalla de login. Iniciar sesion con `admin` / `Test1234!`.

---

## 5. Pruebas E2E (Playwright)

### 5.1 Ubicacion

```
LexControl/Front-end/LexControlFornt/e2e/
```

### 5.2 Instalar Playwright (solo la primera vez)

```powershell
cd LexControl/Front-end/LexControlFornt
npm install -D @playwright/test
npx playwright install chromium
```

### 5.3 Ejecutar todas las pruebas

```powershell
npx playwright test --reporter=list
```

Esto ejecuta **35 pruebas** en Edge:
- Login (5)
- Dashboard (4)
- Clientes (8)
- Cliente Detalle (5)
- Ajustes (6)
- Reportes (3)
- Permisos y Navegacion (4)

### 5.4 Configuracion de Playwright

En `playwright.config.ts`:

- **Navegador**: Edge (proyecto `msedge`)
- **workers**: 1 (secuencial, sin conflictos entre tests)
- **baseURL**: `http://localhost:4200`
- **webServer**: Angular dev server automatico (`ng serve`)
- **ignoreHTTPSErrors**: true (para el certificado autofirmado del backend)

### 5.5 Orden de ejecucion importante

Los tests E2E ejecutan login y acciones reales en la BD. Despues de ejecutarlos, puede que la cuenta `admin` quede bloqueada por intentos fallidos (la SP `SP_Usuario_RegistrarIntentoFallido` bloquea despues de 5 intentos). Si esto ocurre:

```sql
-- En SSMS
UPDATE USUARIO
SET IntentosFallidos = 0, Bloqueado = 0
WHERE Usuario = 'admin';
```

---

## 6. Orden correcto de levantamiento

Para evitar problemas, seguir este orden:

```
1. SQL Server (debe estar corriendo)
2. Backend: dotnet run --launch-profile https
3. Frontend: ng serve
4. Abrir http://localhost:4200 en Edge
```

### Script rapido (PowerShell)

```powershell
# 1. Verificar que SQL Server esta corriendo
sqlcmd -S "DESKTOP-V7G3G1I\SQLEXPRESS" -Q "SELECT 1" -E

# 2. Levantar backend (ventana nueva)
Start-Process -FilePath "dotnet" -ArgumentList "run --launch-profile https" `
    -WorkingDirectory "C:\Users\Gadiel\Documents\Tareas\proyectograduacion\programa\prueba 3\Dasorrollo3\LexControl\Back-end\LexControlApi"

# 3. Esperar a que el backend este listo
Start-Sleep -Seconds 20

# 4. Verificar backend
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$wc = New-Object System.Net.WebClient; $wc.Headers.Add("Content-Type", "application/json")
try { $wc.UploadString("https://localhost:7276/api/auth/login", '{"Usuario":"admin","Contrasena":"Test1234!"}'); "Backend OK" }
catch { "Backend DOWN" }

# 5. Levantar frontend (ventana nueva)
Start-Process -FilePath "ng" -ArgumentList "serve" `
    -WorkingDirectory "C:\Users\Gadiel\Documents\Tareas\proyectograduacion\programa\prueba 3\Dasorrollo3\LexControl\Front-end\LexControlFornt"

# 6. Abrir navegador
Start-Process "http://localhost:4200"
```

---

## 7. Problemas comunes y soluciones

### 7.1 "No fue posible iniciar sesion" en el login

**Causa**: El backend no esta corriendo, o la URL del API es incorrecta en `environment.development.ts`.

**Solucion**:
1. Verificar que el backend esta en `https://localhost:7276`
2. Verificar que `environment.development.ts` tiene `apiBaseUrl: ''`
3. Verificar que el proxy esta configurado en `angular.json`

### 7.2 Cuenta admin bloqueada

**Causa**: La SP `SP_Usuario_RegistrarIntentoFallido` bloquea la cuenta despues de 5 intentos fallidos. Los tests E2E disparan estos intentos.

**Solucion**:
```sql
UPDATE USUARIO SET IntentosFallidos = 0, Bloqueado = 0 WHERE Usuario = 'admin';
```

### 7.3 Puerto 4200 en uso

**Solucion**:
```powershell
$port = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue
if ($port) { Stop-Process -Id $port.OwningProcess -Force }
```

### 7.4 Puerto 7276 en uso

**Solucion**:
```powershell
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 7.5 Certificado SSL rechazado por el navegador

**Causa**: El frontend esta llamando directamente a `https://localhost:7276` sin usar el proxy.

**Solucion**: Verificar que `environment.development.ts` tiene `apiBaseUrl: ''` (vacio), NO una URL absoluta. El proxy se encarga de la conexion SSL.

### 7.6 Angular build falla con errores de tipos

**Solucion**: Verificar que no se editaron archivos del backend sin rebuild:
```powershell
cd LexControl/Back-end/LexControlApi
dotnet build
```

### 7.7 Tests E2E fallan en login

**Causa**: El `ng serve` no se reinicio despues de cambios en `proxy.conf.json` o `environment.development.ts`.

**Solucion**: Matar el `ng serve` actual y dejar que Playwright lo reinicie:
```powershell
Get-Process -Name node | Where-Object { $_.MainWindowTitle -like "*ng*" } | Stop-Process -Force
npx playwright test --reporter=list
```

### 7.8 Base de datos no existe

**Solucion**: Ejecutar `Base_Datos.sql` en SSMS primero, luego `Proceso_almacenados.sql` y `Reportes_almacenados.sql`.

---

## 8. Arquitectura de conexion

```
┌─────────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Edge (navegador)   │─────>│  Angular :4200   │─────>│  .NET API :7276  │
│                     │      │  (proxy.conf)    │      │  (HTTPS autofirm)│
│  http://localhost   │      │  /api/* → proxy  │      │  /api/*           │
│  :4200              │      │                  │      │                  │
└─────────────────────┘      └──────────────────┘      └──────────────────┘
```

- El navegador solo habla HTTP con `localhost:4200`
- El Angular dev server reenvia `/api/*` al backend via proxy
- El proxy maneja la conexion HTTPS con el certificado autofirmado
- No hay problemas de CORS porque todo es el mismo origen
