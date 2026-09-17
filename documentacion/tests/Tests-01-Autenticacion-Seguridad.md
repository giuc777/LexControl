# Tests de Autenticación y Seguridad

## Configuración del Entorno de Pruebas

### Infraestructura

| Componente | Descripción |
|---|---|
| **Framework** | xUnit 2.9.3 |
| **HTTP Client** | `WebApplicationFactory<Program>` (servidor en memoria) |
| **Base de datos** | SQL Server local (`DESKTOP-V7G3G1I\SQLEXPRESS`, DB: `DBLexControl`) |
| **JWT Secret** | `LexControl_Tests_Secret_Key_32_Chars_2026!` (variable de entorno) |
| **Credenciales admin** | `admin` / `admin123` |

### Archivos de Soporte

| Archivo | Función |
|---|---|
| `Fixtures/TestWebApplicationFactory.cs` | Configura el servidor de prueba con DI override, JWT y conexión a BD |
| `Fixtures/AuthHelper.cs` | Genera tokens JWT localmente y realiza login real contra la API |
| `GlobalUsings.cs` | Imports globales (`global using Xunit;`) |

### Tokens de Prueba

| Token | Rol | Generado por |
|---|---|---|
| Admin | `Administrador` (rolId=1) | `AuthHelper.GenerarTokenAdmin()` |
| Abogado | `Abogado` (rolId=3) | `AuthHelper.GenerarTokenAbogado()` |
| Secretaria | `Secretaria` (rolId=2) | `AuthHelper.GenerarTokenSecretaria()` |

---

## 1. Tests de Login

**Archivo:** `AuthControllerTests.cs`

| # | Método | Endpoint | Credenciales | Status Esperado | Qué Valida |
|---|---|---|---|---|---|
| 1 | `Login_CredencialesValidas_DevuelveToken` | `POST /api/auth/login` | `admin/admin123` | `200 OK` o `429 TooManyRequests` | Body no nulo, `Success == true`, `Data.Token` no vacío, `Data.Usuario == "admin"`, `Data.Rol == "Administrador"`, `Data.UsuarioId > 0` |
| 2 | `Login_ContrasenaInvalida_Devuelve401` | `POST /api/auth/login` | `admin/wrong_password` | `401 Unauthorized` | `Success == false`, `Data` es null |
| 3 | `Login_UsuarioInexistente_Devuelve401` | `POST /api/auth/login` | `usuario_no_existe/cualquier` | `401 Unauthorized` | `Success == false`, `Data` es null |
| 4 | `Login_CamposVacios_Devuelve400` | `POST /api/auth/login` | `""/""` | `400 BadRequest` | Campos vacíos rechazados |
| 5 | `Login_CampoFaltante_Devuelve400` | `POST /api/auth/login` | `{Usuario: "admin"}` (sin contraseña) | `400 BadRequest` | Campo requerido faltante |

### Flujo de Login Válido

```
Request:  POST /api/auth/login
Body:     { "Usuario": "admin", "Contrasena": "admin123" }
Response: 200 OK
Body: {
  "Success": true,
  "Data": {
    "Token": "eyJhbGciOiJIUzI1NiIs...",
    "Usuario": "admin",
    "Rol": "Administrador",
    "UsuarioId": 1,
    "RefreshToken": "..."
  }
}
```

---

## 2. Tests de Logout

**Archivo:** `AuthControllerTests.cs`

| # | Método | Endpoint | Autenticación | Status Esperado | Qué Valida |
|---|---|---|---|---|---|
| 6 | `Logout_ConTokenValido_Devuelve204` | `POST /api/auth/logout` | Token real (login API) | `204 NoContent` | Logout exitoso con token válido |
| 7 | `Logout_SinToken_Devuelve401` | `POST /api/auth/logout` | Ninguna | `401 Unauthorized` | Rechaza logout sin token |

> **Nota:** El test de logout con token usa `AuthHelper.LoginRealAsync()` que realiza un POST real a `/api/auth/login` para obtener un token válido, ya que el logout requiere un token de sesión activo.

---

## 3. Tests de Endpoints Sin Autenticación (401)

Todos los controladores protegidos deben retornar `401 Unauthorized` cuando se accede sin token.

| Controlador | Método | Endpoint | Status |
|---|---|---|---|
| **Clientes** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/clientes` | 401 |
| **Expedientes** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/expedientes` | 401 |
| **Audiencias** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/audiencias` | 401 |
| **Trámites** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/tramites` | 401 |
| **Diligencias** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/diligencias` | 401 |
| **Notificaciones** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/notificaciones` | 401 |
| **Eventos** | `ObtenerDelDia_SinAutenticacion_Devuelve401` | `GET /api/eventos/dia` | 401 |
| **Histórico** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/historico` | 401 |
| **Reportes** | `ExpedientesPorEstado_SinAutenticacion_Devuelve401` | `GET /api/reportes/expedientes-por-estado` | 401 |
| **Catálogos** | `BuscarCatalogo_SinAutenticacion_Devuelve401` | `GET /api/catalogos/RAMA` | 401 |
| **Usuarios** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/usuarios` | 401 |
| **Permisos** | `Listar_SinAutenticacion_Devuelve401` | `GET /api/permisos` | 401 |
| **Perfil** | `Obtener_SinAutenticacion_Devuelve401` | `GET /api/perfil` | 401 |

**Total: 13 tests**

---

## 4. Tests de Control de Acceso por Roles (403)

Verifican que usuarios sin permisos adecuados reciben `403 Forbidden`.

| Controlador | Método | Token Usado | Endpoint | Status | Regla |
|---|---|---|---|---|---|
| **Clientes** | `Crear_SinRolesAdmin_Devuelve403` | Secretaria | `POST /api/clientes` | 403 | Solo Admin puede crear clientes |
| **Expedientes** | `Crear_SinRolAbogado_Devuelve403` | Secretaria | `POST /api/expedientes` | 403 | Solo Abogado/Admin puede crear expedientes |
| **Trámites** | `Crear_SinRolAbogado_Devuelve403` | Secretaria | `POST /api/tramites` | 403 | Solo Abogado/Admin puede crear trámites |
| **Diligencias** | `Crear_SinRolAbogado_Devuelve403` | Secretaria | `POST /api/diligencias` | 403 | Solo Abogado/Admin puede crear diligencias |
| **Notificaciones** | `Crear_SinRolAbogado_Devuelve403` | Secretaria | `POST /api/notificaciones` | 403 | Solo Abogado/Admin puede crear notificaciones |
| **Catálogos** | `InsertarCatalogo_SinRolAdmin_Devuelve403` | Abogado | `POST /api/catalogos/RAMA` | 403 | Solo Admin puede modificar catálogos |
| **Usuarios** | `Listar_SinRolAdmin_Devuelve403` | Abogado | `GET /api/usuarios` | 403 | Solo Admin puede listar usuarios |
| **Permisos** | `Listar_SinRolAdmin_Devuelve403` | Abogado | `GET /api/permisos` | 403 | Solo Admin puede listar permisos |

**Total: 8 tests**

### Matriz de Permisos

| Recurso | Admin | Abogado | Secretaria |
|---|---|---|---|
| Clientes (CRUD) | ✅ | ❌ | ❌ |
| Expedientes (lectura) | ✅ | ✅ | ✅ |
| Expedientes (escritura) | ✅ | ✅ | ❌ |
| Trámites (escritura) | ✅ | ✅ | ❌ |
| Diligencias (escritura) | ✅ | ✅ | ❌ |
| Notificaciones (escritura) | ✅ | ✅ | ❌ |
| Catálogos (modificar) | ✅ | ❌ | ❌ |
| Usuarios (lectura) | ✅ | ❌ | ❌ |
| Permisos (lectura) | ✅ | ❌ | ❌ |
| Perfil (lectura/escritura) | ✅ | ✅ | ✅ |

---

**Total de tests de autenticación y seguridad: 29**
