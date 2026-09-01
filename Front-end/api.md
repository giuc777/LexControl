# LexControl API — Guía de conexión para el Frontend

Documentación de los puntos de conexión del backend (`LexControlApi`, .NET 10) para el cliente SPA.
Referencia interactiva disponible con la API corriendo en: **`/swagger`** (documento OpenAPI: `/openapi/v1.json`).

---

## 1. Base URL

| Entorno | URL |
|---|---|
| HTTP | `http://localhost:5181` |
| HTTPS | `https://localhost:7276` |

**Orígenes permitidos por CORS**: `http://localhost:5173`, `http://localhost:4200`, `http://localhost:3000`, `http://localhost:8080`.
Si el SPA corre en otro puerto/puerto de producción, agregarlo en `Program.cs` (política `LexControlCors`).

---

## 2. Formato estándar de respuesta

Toda respuesta exitosa o de error de negocio usa este sobre (camelCase):

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `success` | boolean | `true` si la operación fue exitosa |
| `data` | objeto/array | Carga útil (solo en éxito) |
| `error` | string | Mensaje legible (solo en error) |

### Errores de validación (400)

Los DTOs validan con DataAnnotations; todos los mensajes se unen en un solo string:

```json
{ "success": false, "error": "El nombre completo es obligatorio. La contraseña debe tener al menos 8 caracteres..." }
```

### Errores comunes

| HTTP | Cuándo |
|---|---|
| 400 | Validación de DTO o regla de negocio |
| 401 | Credenciales inválidas o token ausente/expirado |
| 404 | Recurso no encontrado |
| 409 | Conflicto (p. ej. cuenta duplicada) |
| 500 | Error interno o de base de datos |

---

## 3. Autenticación (JWT Bearer)

1. Llamar a `POST /api/auth/login`.
2. Guardar el `token` devuelto.
3. Enviar cada petición protegida con el header:

```
Authorization: Bearer <token>
```

El token expira según `Expiracion` (por defecto 120 minutos). Claims incluidos: id de usuario, nombre, cuenta y rol.

### Roles y acceso a los endpoints

El rol viaja dentro del JWT (claim estándar `Role`) y el backend lo valida en cada petición.
La respuesta del login incluye `rol` y `rolId` para que el SPA oculte opciones del menú según el perfil.

| Grupo de endpoints | Administrador | Otros roles autenticados |
|---|---|---|
| `POST /api/auth/login` | ✔ | ✔ |
| `GET/PUT /api/perfil`, `PUT /api/perfil/contrasena` | ✔ | ✔ |
| `/api/usuarios` — CRUD completo, `roles`, `estado`, `desbloquear` | ✔ | ✖ **403** |
| `GET /api/permisos` — matriz completa (pantalla admin) | ✔ | ✖ **403** |
| `GET /api/permisos/{rolId}` — módulos visibles de un rol | ✔ | ✔ (filtro de menú propio) |
| `PUT /api/permisos/{rolId}` — guardar matriz del rol | ✔ | ✖ **403** |

Códigos al fallar la autorización: **401** sin token o token inválido/expirado · **403** con token válido pero rol insuficiente.

> Regla del prototipo para el menú: las secciones «Usuarios del Sistema» y «Permisos de Roles»
> solo se muestran si `data.rol === "Administrador"` en la respuesta del login. El backend
> rechaza de todos modos cualquier intento de un rol no autorizado.

---

## 4. Endpoints

### 4.1 Auth — `/api/auth`

#### `POST /api/auth/login` (público)

Inicia sesión.

**Body**

```json
{
  "usuario": "admin",
  "contrasena": "admin123"
}
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "expiracion": "2026-08-24T17:30:00Z",
    "usuarioId": 1,
    "usuario": "admin",
    "nombreCompleto": "Administrador del Sistema",
    "rolId": 1,
    "rol": "Administrador"
  }
}
```

**Errores**: `401` credenciales incorrectas · `400` campos vacíos.

---

### 4.2 Perfil propio — `/api/perfil` (requiere token)

#### `GET /api/perfil`

Perfil del usuario autenticado.

**200 OK**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombreCompleto": "Administrador del Sistema",
    "usuario": "admin",
    "email": "admin@lexcontrol.gt",
    "telefono": "+502 5555-0000",
    "rolId": 1,
    "rol": "Administrador",
    "activo": true
  }
}
```

#### `PUT /api/perfil`

Actualiza datos propios. **204 No Content** al éxito.

**Body**

```json
{
  "nombreCompleto": "Nuevo Nombre",
  "email": "nuevo@correo.com",
  "telefono": "+502 5555-1234"
}
```

`telefono` es opcional (máx. 20 caracteres).

#### `PUT /api/perfil/contrasena`

Cambio de contraseña propia. **204 No Content** al éxito.

**Body**

```json
{
  "contrasenaActual": "Actual#2026",
  "contrasenaNueva": "NuevaClave#1",
  "confirmacion": "NuevaClave#1"
}
```

**Errores**: `400` contraseña actual no coincide, nueva igual a la actual, o no cumple la política.

> **Política de contraseñas**: mínimo 8 caracteres, al menos un dígito y un carácter especial.

---

### 4.3 Usuarios — `/api/usuarios` (requiere rol `Administrador`)

#### `GET /api/usuarios`

Lista con filtros opcionales (query string).

| Parámetro | Tipo | Descripción |
|---|---|---|
| `filtroNombre` | string? | Busca por nombre completo |
| `rolId` | int? | Filtra por rol |
| `activo` | bool? | Filtra por estado |

Ejemplo: `GET /api/usuarios?filtroNombre=carlos&rolId=3&activo=true`

**200 OK** → `data` es un array:

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "nombreCompleto": "Lic. Diego Matzar",
      "usuario": "dmatzar",
      "email": "diego@lexcontrol.gt",
      "telefono": "+502 5555-0202",
      "rolId": 3,
      "rol": "Abogado",
      "activo": true,
      "bloqueado": false,
      "ultimoAcceso": "2026-08-23T14:02:11Z",
      "fechaCreacion": "2026-01-10T09:00:00Z"
    }
  ]
}
```

#### `GET /api/usuarios/roles`

Catálogo de roles para el formulario. **200 OK**:

```json
{
  "success": true,
  "data": [
    { "id": 1, "nombre": "Administrador", "descripcion": "Acceso total" },
    { "id": 3, "nombre": "Abogado", "descripcion": null }
  ]
}
```

#### `GET /api/usuarios/{id}`

Detalle de un usuario. Mismo shape que un elemento de la lista.
**Errores**: `404` no existe.

#### `POST /api/usuarios`

Crea Persona + Usuario (transacción). **201 Created** con el usuario creado; header `Location` apunta a `GET /api/usuarios/{id}`.

**Body**

```json
{
  "nombreCompleto": "Lic. Ana López",
  "email": "ana@lexcontrol.gt",
  "telefono": "+502 5555-0333",
  "cuenta": "alopez",
  "rolId": 3,
  "contrasena": "ClaveSegura#1"
}
```

**Errores**: `409` cuenta duplicada · `400` validaciones.

#### `PUT /api/usuarios/{id}`

Edita un usuario. **200 OK** con el usuario actualizado.

**Body**: igual que crear, pero `contrasena` es **opcional**: vacío o nulo conserva la actual.

**Errores**: `404` · `409` cuenta duplicada.

#### `PUT /api/usuarios/{id}/estado`

Activa/desactiva una cuenta (borrado lógico). **204 No Content**.

**Body**

```json
{ "activo": false }
```

**Errores**: `404` · `409` no se puede desactivar a un Administrador.

#### `POST /api/usuarios/{id}/desbloquear`

Desbloquea una cuenta tras intentos fallidos. **204 No Content**. **Errores**: `404`.

---

### 4.4 Permisos por rol — `/api/permisos` (requiere token)

Matriz rol × módulo que controla qué módulos ve cada rol en el menú del SPA.
Claves de módulo válidas: `dashboard`, `clientes`, `expedientes`, `audiencias`, `tramites`, `historico`, `notificaciones`, `mantenimiento`, `reportes`, `ajustes`.

**Reglas fijas**: `dashboard` nunca puede ocultarse · al `Administrador` nunca se le puede quitar `ajustes`.

**Valores por defecto**: Administrador = todo · Secretaria = todo salvo `historico` y `notificaciones` · Abogado = todo salvo `mantenimiento`.

#### `GET /api/permisos` (solo rol Administrador)

Matriz completa agrupada por rol (pantalla de administración).

**Errores**: `403` si el usuario autenticado no es Administrador.

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "rolId": 3,
      "rol": "Abogado",
      "modulos": [
        { "clave": "dashboard", "nombre": "Dashboard", "ruta": "/dashboard", "icono": "dashboard", "orden": 1, "activo": true },
        { "clave": "clientes", "nombre": "Clientes", "ruta": "/clientes", "icono": "people", "orden": 2, "activo": true }
      ]
    }
  ]
}
```

#### `GET /api/permisos/{rolId}`

Módulos de un solo rol; `data` es directamente el array `modulos`.
Disponible para **cualquier usuario autenticado**: cada usuario consulta así los
módulos visibles de su propio rol para filtrar el menú al iniciar sesión.

```json
{ "success": true, "data": [ { "clave": "dashboard", "nombre": "Dashboard", "...": "..." } ] }
```

**Errores**: `404` rol inexistente.

#### `PUT /api/permisos/{rolId}` (solo rol Administrador)

Guarda la matriz **completa** del rol en una transacción. Enviar siempre las 10 claves: toda clave omitida queda oculta. **204 No Content** al éxito.

**Body**

```json
{
  "modulos": {
    "dashboard": true,
    "clientes": true,
    "expedientes": true,
    "audiencias": true,
    "tramites": true,
    "historico": false,
    "notificaciones": false,
    "mantenimiento": false,
    "reportes": true,
    "ajustes": true
  }
}
```

**Errores**: `400` claves desconocidas/vacías, intentar ocultar `dashboard`, o quitar `ajustes` al administrador · `404` rol inexistente.

Ejemplo de guardado desde el front (botón "Guardar permisos" guarda cada rol):

```javascript
for (const rolId in matrizPorRol) {
  await fetch(`${BASE}/api/permisos/${rolId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json",
               Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: JSON.stringify({ modulos: matrizPorRol[rolId] })
  });
}
```

---

## 5. Ejemplo rápido (JavaScript)

```javascript
const BASE = "http://localhost:5181";

// 1. Login
const res = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ usuario: "admin", contrasena: "admin123" })
});
const { success, data, error } = await res.json();
if (!success) throw new Error(error);

localStorage.setItem("token", data.token);
localStorage.setItem("rol", data.rol);

// 2. Petición autenticada
const resPerfil = await fetch(`${BASE}/api/perfil`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});
const perfil = await resPerfil.json();
```

---

## 6. Notas

- **Fechas**: siempre ISO 8601 UTC (`2026-08-24T15:30:00Z`).
- **JSON**: propiedades en camelCase; el binding acepta camelCase o PascalCase en el body entrante.
- **Borrado lógico**: no hay `DELETE`; se desactiva con `PUT .../estado { "activo": false }`.
- **Endpoints futuros** (expedientes, agenda, reportes): seguirán este mismo sobre y patrón de rutas REST.
- **Menú por rol**: usar `GET /api/permisos/{rolId}` (o el claim `rol_id` del token) para filtrar los módulos visibles al iniciar sesión.

---

### 4.5 Clientes — `/api/clientes` (requiere token)

CRUD completo de clientes del bufete. Datos de PERSONA + CLIENTE en transacción.

#### `GET /api/clientes`

Listado paginado con filtros opcionales (query string).

| Parámetro | Tipo | Descripción |
|---|---|---|
| `filtroNombre` | string? | Busca por nombre completo (LIKE) |
| `filtroEstado` | bool? | `true` = solo activos, `false` = solo inactivos, omitir = todos |
| `filtroTipo` | string? | Filtra por tipo de cliente (ej. "Particular", "Empresa") |
| `pagina` | int? | Página (default: 1) |
| `tamanioPagina` | int? | Registros por página (default: 20) |

Ejemplo: `GET /api/clientes?filtroNombre=Morales&filtroEstado=true&pagina=1&tamanioPagina=10`

**200 OK** → `data` es un array + header `X-Total-Count`:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombreCompleto": "Carlos Morales Ortiz",
      "dpi": "2983123450101",
      "telefonoPrincipal": "+502 5555-0123",
      "emailPrincipal": "carlos.mo@email.com",
      "direccion": "Calle Principal 5-20, Zona 1",
      "fechaNacimiento": null,
      "genero": null,
      "telefonoSecundario": null,
      "emailSecundario": null,
      "tipoCliente": "Particular",
      "notas": "Cliente referido por recomendación.",
      "activo": true,
      "fechaCreacion": "2026-08-31T22:54:06",
      "totalExpedientes": 2,
      "expedientesActivos": 1,
      "ultimaActividad": "2026-08-15"
    }
  ],
  "error": null
}
```

#### `GET /api/clientes/estadisticas`

Estadísticas para el bento grid. **200 OK**:

```json
{
  "success": true,
  "data": {
    "totalClientes": 45,
    "totalInactivos": 3,
    "totalExpedientesActivos": 12,
    "totalExpedientes": 28
  }
}
```

#### `GET /api/clientes/{id}`

Detalle de un cliente (sin campos de paginación ni conteos). **200 OK**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombreCompleto": "Carlos Morales Ortiz",
    "dpi": "2983123450101",
    "telefonoPrincipal": "+502 5555-0123",
    "emailPrincipal": "carlos.mo@email.com",
    "direccion": "Calle Principal 5-20, Zona 1",
    "fechaNacimiento": "1985-03-12",
    "genero": "M",
    "telefonoSecundario": "+502 5555-0456",
    "emailSecundario": "carlos.personal@email.com",
    "tipoCliente": "Particular",
    "notas": "Cliente referido por recomendación.",
    "activo": true,
    "fechaCreacion": "2026-08-31T22:54:06"
  }
}
```

**Errores**: `404` no existe.

#### `GET /api/clientes/{id}/expedientes`

Expedientes de un cliente específico (para la página de detalle). **200 OK**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero": "CIV-2026-0045",
      "fechaIngreso": "2026-01-15",
      "descripcion": "Demanda por incumplimiento de contrato.",
      "rama": "Civil",
      "estado": "Activo",
      "estadoColor": "#2ECC71",
      "juzgado": "Juzgado de Primera Instancia Civil de Sololá",
      "ultimaActuacion": "Audiencia de conciliación programada",
      "fechaUltimaActuacion": "2026-08-10"
    }
  ]
}
```

#### `POST /api/clientes` (solo rol Administrador)

Crea Persona + Cliente en transacción. **201 Created** con el cliente creado.

**Body**

```json
{
  "nombreCompleto": "Carlos Morales Ortiz",
  "dpi": "2983123450101",
  "telefonoPrincipal": "+502 5555-0123",
  "emailPrincipal": "carlos.mo@email.com",
  "direccion": "Calle Principal 5-20, Zona 1, Panajachel",
  "telefonoSecundario": null,
  "emailSecundario": null,
  "tipoCliente": "Particular",
  "notas": "Cliente referido por recomendación."
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `nombreCompleto` | Sí | Máx. 100 caracteres |
| `dpi` | No | Máx. 20 caracteres |
| `telefonoPrincipal` | No | Máx. 20 caracteres |
| `emailPrincipal` | No | Debe ser email válido |
| `direccion` | No | Máx. 200 caracteres |
| `tipoCliente` | No | Default: "Particular" |
| `notas` | No | Máx. 500 caracteres |

**Errores**: `400` validaciones · `409` duplicado.

#### `PUT /api/clientes/{id}` (solo rol Administrador)

Actualiza datos del cliente y su Persona asociada. Usa patrón ISNULL (NULL = conservar actual). **200 OK** con el cliente actualizado.

**Body** (igual que crear, todos los campos opcionales excepto `nombreCompleto`):

```json
{
  "nombreCompleto": "Carlos Morales Ortiz",
  "dpi": "2983123450101",
  "telefonoPrincipal": "+502 5555-9999",
  "emailPrincipal": "carlos.nuevo@email.com",
  "direccion": "Nueva dirección 123",
  "tipoCliente": "Empresa",
  "notas": "Cliente actualizado"
}
```

**Errores**: `404` · `409` duplicado.

#### `PUT /api/clientes/{id}/estado` (solo rol Administrador)

Activa o desactiva un cliente (borrado lógico). **204 No Content**.

**Body**

```json
{ "activo": false }
```

**Errores**: `404` no existe.
