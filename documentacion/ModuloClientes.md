# Módulo de Clientes — Documentación Técnica

> Documentación del módulo **Clientes** de **LexControl**, el sistema de gestión de expedientes para un bufete jurídico guatemalteco.
>
> **Criterio**: Incluye (1) funcionalidad de la aplicación, (2) verificación en la base de datos, y (3) explicación técnica de modelos, rutas y componentes.

---

## 1. Estructura de carpetas del módulo

```
LexControl/
├── Back-end/LexControlApi/
│   ├── Controllers/
│   │   └── ClientesController.cs        — 7 endpoints REST
│   ├── Services/
│   │   ├── IClienteService.cs           — Interfaz
│   │   └── ClienteService.cs            — Lógica de negocio (7 métodos)
│   └── Dtos/Clientes/
│       └── ClienteDtos.cs               — 9 clases DTO
│
├── Front-end/LexControlFornt/src/app/
│   ├── core/
│   │   ├── models/
│   │   │   └── cliente.model.ts         — 7 interfaces TypeScript
│   │   └── services/
│   │       └── clientes-service.ts      — Servicio HTTP (7 métodos)
│   ├── features/clientes/
│   │   ├── clientes-page.ts             — Listado principal
│   │   ├── clientes-page.html           — Template del listado
│   │   ├── cliente-detalle-page.ts      — Detalle del cliente
│   │   ├── cliente-detalle-page.html    — Template del detalle
│   │   ├── cliente-modal.ts             — Modal crear/editar
│   │   └── cliente-modal.html           — Template del modal
│   └── shared/components/
│       ├── page-header/                 — Encabezado reutilizable
│       ├── stat-card/                   — Tarjeta de estadística
│       ├── badge-estado/                — Pill de estado coloreado
│       ├── empty-state/                 — Mensaje de datos vacíos
│       └── paginacion/                  — Controles de paginación
│
├── Clientes_SP.sql                      — SPs nuevos del módulo
├── Extras_SP.sql                         — SPs complementarios
├── LexControlDB.sql                      — SPs originales de clientes
└── ModuloClientes.md                     — ← Este documento
```

---

## 2. Instrucciones de inicio

### 2.1 Requisitos previos

| Herramienta | Versión |
|---|---|
| SQL Server (SSMS o `sqlcmd`) | SQL Server 2019+ |
| .NET SDK | 10.0 |
| Node.js + npm | 20+ |
| Angular CLI | 20.1+ (`npm i -g @angular/cli`) |

### 2.2 Base de datos

Los SPs del módulo de clientes se distribuyen en 3 archivos:

```sql
-- 1) SPs originales (Insertar, ObtenerPorID, Buscar)
LexControlDB.sql

-- 2) SPs complementarios (Actualizar, Desactivar)
Extras_SP.sql

-- 3) SPs nuevos del módulo (Listar, Estadisticas, ObtenerExpedientes, Reactivar)
Clientes_SP.sql
```

> **Orden de ejecución**: Primero `LexControlDB.sql` → luego `Extras_SP.sql` → finalmente `Clientes_SP.sql`.
> Todos usan `CREATE OR ALTER` (idempotentes).

### 2.3 Backend (API REST)

```bash
cd Back-end/LexControlApi
dotnet run
```

- La API arranca en `http://localhost:5181` (o `https://localhost:7276`).
- Swagger UI: `https://localhost:7276/swagger`

### 2.4 Frontend (SPA Angular)

```bash
cd Front-end/LexControlFornt
npm install        # primera vez
npm start
```

- El SPA arranca en `http://localhost:4200`.

### 2.5 Secuencia de prueba del módulo

1. Navegar a `http://localhost:4200/login`.
2. Ingresar `admin` / `admin123`.
3. Click en **Clientes** en el sidebar.
4. Verificar que el listado carga con las tarjetas de estadísticas (bento grid) y la tabla de clientes.
5. Filtrar por estado (Activo/Inactivo/Todos).
6. Click en "Nuevo Cliente" → completar formulario → Guardar.
7. Click en una fila de la tabla → navega al detalle del cliente.
8. En el detalle, click en "Editar cliente" → modificar datos → Guardar cambios.
9. Verificar que los expedientes del cliente aparecen en la tabla del detalle.
10. Volver al listado usando el breadcrumb "Clientes".

---

## 3. Funcionalidad de la aplicación

### 3.1 Listado de clientes

| Aspecto | Detalle |
|---|---|
| Endpoint | `GET /api/clientes` |
| Query params | `filtroNombre`, `filtroEstado` (bool), `filtroTipo`, `pagina`, `tamanioPagina` |
| Respuesta | `{ success, data: ClienteLista[] }` + header `X-Total-Count` |
| Componente | `ClientesPage` (`features/clientes/clientes-page.ts`) |
| Ruta | `/clientes` |

**Funcionalidades**:
- **Bento grid**: Dos tarjetas de estadísticas (Total Clientes, Casos Activos) obtenidas de `GET /api/clientes/estadisticas`.
- **Filtros**: Select de estado (Todos, Activo, Inactivo). Al cambiar, resetea la página a 1.
- **Tabla**: 6 columnas — ID, Nombre (con avatar), DPI, Contacto (teléfono + email), Expedientes (pills), Última Actividad.
- **Paginación server-side**: Botones de página con info "Mostrando X-Y de Z clientes".
- **Click en fila**: Navega a `/clientes/{id}`.
- **Botón "Nuevo Cliente"**: Abre modal de creación.

### 3.2 Detalle del cliente

| Aspecto | Detalle |
|---|---|
| Endpoint | `GET /api/clientes/{id}` |
| Endpoint expedientes | `GET /api/clientes/{id}/expedientes` |
| Respuesta | `{ success, data: ClienteDetalle }` |
| Componente | `ClienteDetallePage` (`features/clientes/cliente-detalle-page.ts`) |
| Ruta | `/clientes/:id` |

**Funcionalidades**:
- **Breadcrumb**: "Clientes / {Nombre del cliente}" con enlace de regreso.
- **Info card**: Avatar con iniciales + color, badges (ACTIVO/INACTIVO + tipo Particular/Empresa), grid de datos (DPI, teléfonos, emails, dirección, fecha nacimiento, género, notas).
- **Acciones**: Botón "Editar cliente" (abre modal), botón "Nuevo expediente" (deshabilitado, pendiente).
- **Tabla de expedientes**: 6 columnas — No. Expediente, Rama, Fecha Ingreso, Estado (badge coloreado), Juzgado, Última Actuación.

### 3.3 Modal crear/editar cliente

| Aspecto | Detalle |
|---|---|
| Endpoint crear | `POST /api/clientes` |
| Endpoint editar | `PUT /api/clientes/{id}` |
| Componente | `ClienteModal` (`features/clientes/cliente-modal.ts`) |
| Autorización | Solo Administrador |

**Formulario** (2 fieldsets):

**Datos personales**:
- Nombre completo (requerido, máx. 100)
- DPI (requerido, exactamente 13 dígitos)
- Fecha de nacimiento (opcional)
- Género (Masculino/Femenino/Otro)
- Tipo de cliente (Particular/Empresa)

**Contacto**:
- Teléfono principal (requerido)
- Email principal (requerido, formato válido)
- Teléfono secundario (opcional, formato válido)
- Email secundario (opcional, formato válido)
- Dirección (opcional, máx. 200)
- Notas (opcional, máx. 500)

**Validaciones client-side**:
- Nombre不能为空
- DPI exactamente 13 dígitos numéricos
- Teléfono y email requeridos
- Email con formato válido (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Email secundario con formato válido si se ingresa

---

## 4. Verificación en la base de datos

### 4.1 Tablas involucradas

#### `PERSONA` (tabla base)

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

#### `CLIENTE` (hereda de PERSONA vía Persona_ID)

```sql
CREATE TABLE CLIENTE (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Persona_ID INT NOT NULL UNIQUE,     -- herencia: 1:1 con PERSONA
    TelefonoSecundario NVARCHAR(20) NULL,
    EmailSecundario NVARCHAR(100) NULL,
    TipoCliente NVARCHAR(20) NOT NULL DEFAULT 'Particular',
    Notas NVARCHAR(500) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_CLIENTE_PERSONA FOREIGN KEY (Persona_ID) REFERENCES PERSONA(ID) ON DELETE CASCADE
);
```

#### `EXPEDIENTE` (referenciada por el detalle)

```sql
CREATE TABLE EXPEDIENTE (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Cliente_ID INT NOT NULL,
    Rol_Procesal_ID INT NOT NULL,
    NoExpediente NVARCHAR(50) NOT NULL,
    Rama_ID INT NOT NULL,
    TipoProceso NVARCHAR(50) NULL,
    Juzgado_ID INT NOT NULL,
    FechaIngreso DATE NOT NULL DEFAULT GETDATE(),
    Estado_ID INT NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    NotasInternas NVARCHAR(1000) NULL,
    Usuario_ID INT NOT NULL,
    CONSTRAINT FK_EXPEDIENTE_CLIENTE FOREIGN KEY (Cliente_ID) REFERENCES CLIENTE(ID)
);
```

### 4.2 Procedimientos almacenados del módulo

#### SPs originales (`LexControlDB.sql`)

| SP | Parámetros | Return | Descripción |
|---|---|---|---|
| `SP_Cliente_Insertar` | `@NombreCompleto`, `@DPI`, `@TelefonoPrincipal`, `@EmailPrincipal`, `@Direccion`, `@TelefonoSecundario`, `@EmailSecundario`, `@TipoCliente`, `@Notas`, `@UsuarioCreacion_ID` | OUTPUT `@NuevoClienteID` | Crea Persona + Cliente en transacción |
| `SP_Cliente_ObtenerPorID` | `@ID` | SELECT fila | Detalle del cliente con joins de PERSONA |
| `SP_Cliente_Buscar` | `@Nombre`, `@DPI`, `@Telefono`, `@Email` | SELECT lista | Búsqueda simple (solo activos) |

#### SPs complementarios (`Extras_SP.sql`)

| SP | Parámetros | Return | Descripción |
|---|---|---|---|
| `SP_Cliente_Actualizar` | `@ID`, `@NombreCompleto`, `@DPI`, `@TelefonoPrincipal`, `@EmailPrincipal`, `@TelefonoSecundario`, `@EmailSecundario`, `@Direccion`, `@FechaNacimiento`, `@Genero`, `@TipoCliente`, `@Notas` | RETURN 0 / -1 | Actualiza datos (ISNULL conserva valores) |
| `SP_Cliente_Desactivar` | `@ID` | RETURN 0 / -1 | Borrado lógico (Activo = 0 en CLIENTE y PERSONA) |

#### SPs nuevos (`Clientes_SP.sql`)

| SP | Parámetros | Return | Descripción |
|---|---|---|---|
| `SP_Cliente_Listar` | `@FiltroNombre`, `@FiltroEstado`, `@FiltroTipo`, `@Pagina`, `@TamanioPagina` | SELECT filas + TotalRegistros | Listado paginado con conteo de expedientes |
| `SP_Cliente_Estadisticas` | — | SELECT totales | TotalClientes, TotalInactivos, TotalExpedientesActivos, TotalExpedientes |
| `SP_Cliente_ObtenerExpedientes` | `@ClienteID` | SELECT lista | Expedientes del cliente con última actuación (nota más reciente) |
| `SP_Cliente_Reactivar` | `@ID` | RETURN 0 / -1 | Reactiva cliente (Activo = 1 en CLIENTE y PERSONA) |

### 4.3 Verificación de datos

```sql
-- Contar clientes activos
SELECT COUNT(*) FROM CLIENTE WHERE Activo = 1;

-- Verificar estructura de SP_Cliente_Listar
EXEC SP_Cliente_Listar @Pagina = 1, @TamanioPagina = 5;

-- Verificar estadísticas
EXEC SP_Cliente_Estadisticas;

-- Ver expedientes de un cliente específico
EXEC SP_Cliente_ObtenerExpedientes @ClienteID = 1;
```

---

## 5. Explicación técnica

### 5.1 Arquitectura del módulo

```
┌─────────────────────────────────────────────────────┐
│           Frontend (Angular 20 Standalone)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Clientes │  │ Cliente  │  │ Shared Components│   │
│  │   Page   │  │ Detalle  │  │ (page-header,    │   │
│  │          │  │   Page   │  │  stat-card, etc.)│   │
│  └────┬─────┘  └────┬─────┘  └──────────────────┘   │
│       │              │                                │
│  ┌────▼──────────────▼────┐                           │
│  │  ClientesService       │  HTTP + JWT Bearer        │
│  │  (7 métodos)           │                           │
│  └────────────┬───────────┘                           │
└───────────────┼───────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────┐
│         Backend (.NET 10 / ASP.NET Core)              │
│  ┌─────────────────────┐  ┌──────────────────────┐    │
│  │ ClientesController  │──│   ClienteService     │    │
│  │ (7 endpoints)       │  │   (7 métodos)        │    │
│  └─────────┬───────────┘  └──────────┬───────────┘    │
│            │                          │                │
│  ┌─────────▼──────────────────────────▼───────────┐   │
│  │           Data Layer (Dapper)                   │   │
│  │  IRepositorio → ConsultarLista, ConsultarPrimero│   │
│  │                EjecutarRetorno, Insertar         │   │
│  └──────────────────────┬─────────────────────────┘   │
└─────────────────────────┼─────────────────────────────┘
                          │ Stored Procedures
┌─────────────────────────▼─────────────────────────────┐
│                 DBLexControl (SQL Server)              │
│  CLIENTE ←→ PERSONA (herencia 1:1)                    │
│  EXPEDIENTE ←→ CLIENTE (FK)                           │
│  8 SPs de clientes distribuidos en 3 archivos SQL      │
└───────────────────────────────────────────────────────┘
```

### 5.2 Backend — Controlador, servicio y DTOs

#### `ClientesController.cs` — `api/clientes`

| Método | Endpoint | Autorización | Descripción |
|---|---|---|---|
| GET | `/` | Autenticado | Listado paginado con filtros |
| GET | `/estadisticas` | Autenticado | Métricas del bento grid |
| GET | `/{id}` | Autenticado | Detalle del cliente |
| GET | `/{id}/expedientes` | Autenticado | Expedientes del cliente |
| POST | `/` | Solo Admin | Crear cliente |
| PUT | `/{id}` | Solo Admin | Editar cliente |
| PUT | `/{id}/estado` | Solo Admin | Activar/desactivar |

**DTOs de entrada**:

`ClienteCrearDto`:
```csharp
{
  NombreCompleto: string  [Required, MaxLength(100)]
  DPI:            string? [MaxLength(20)]
  TelefonoPrincipal: string? [MaxLength(20)]
  EmailPrincipal: string? [EmailAddress, MaxLength(100)]
  Direccion:      string? [MaxLength(200)]
  TelefonoSecundario: string? [MaxLength(20)]
  EmailSecundario: string? [EmailAddress, MaxLength(100)]
  TipoCliente:    string? [MaxLength(20)]  // default "Particular"
  Notas:          string? [MaxLength(500)]
}
```

`ClienteActualizarDto`: igual, pero agrega `FechaNacimiento` (DateTime?) y `Genero` (string? [MaxLength(1)]).

`ClienteEstadoDto`: `{ Activo: bool }`

**DTOs de salida**:

`ClienteDto` (listado):
```csharp
{
  Id, NombreCompleto, DPI, TelefonoPrincipal, EmailPrincipal,
  Direccion, FechaNacimiento, Genero, TelefonoSecundario, EmailSecundario,
  TipoCliente, Notas, Activo, FechaCreacion,
  TotalExpedientes, ExpedientesActivos, UltimaActividad
}
```

`ClienteDetalleDto` (detalle): igual sin campos de paginación.

`ClienteExpedienteDto`:
```csharp
{
  Id, Numero, FechaIngreso, Descripcion, Rama, Estado,
  EstadoColor, Juzgado, UltimaActuacion, FechaUltimaActuacion
}
```

`EstadisticasClienteDto`:
```csharp
{
  TotalClientes, TotalInactivos, TotalExpedientesActivos, TotalExpedientes
}
```

#### `ClienteService.cs` — Lógica de negocio

| Método | SP | Manejo de errores |
|---|---|---|
| `ListarAsync` | `SP_Cliente_Listar` | Retorna (lista, total) |
| `ObtenerPorIdAsync` | `SP_Cliente_ObtenerPorID` | ExcepcionNegocio si no existe |
| `CrearAsync` | `SP_Cliente_Insertar` | Detecta duplicados (2627 → 409) |
| `ActualizarAsync` | `SP_Cliente_Actualizar` | VerificarAccion(retorno) |
| `ActivarDesactivarAsync` | `SP_Cliente_Reactivar` o `SP_Cliente_Desactivar` | VerificarAccion(retorno) |
| `ObtenerEstadisticasAsync` | `SP_Cliente_Estadisticas` | Retorna defaults si null |
| `ObtenerExpedientesAsync` | `SP_Cliente_ObtenerExpedientes` | Retorna lista |

**Códigos de retorno manejados**:
| Retorno | Significado |
|---|---|
| `0` | Éxito |
| `-1` | Cliente no encontrado (404) |
| `2601` / `2627` | Duplicado (409 Conflict) |
| Otro | Error de BD (500) |

### 5.3 Frontend — Modelos, servicios y componentes

#### Modelo TypeScript (`cliente.model.ts`)

```typescript
interface ClienteLista {
  id: number;
  nombreCompleto: string;
  dpi: string | null;
  telefonoPrincipal: string | null;
  emailPrincipal: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  telefonoSecundario: string | null;
  emailSecundario: string | null;
  tipoCliente: string;
  notas: string | null;
  activo: boolean;
  fechaCreacion: string;
  totalExpedientes: number;
  expedientesActivos: number;
  ultimaActividad: string | null;
}

interface ClienteDetalle { /* campos sin paginación */ }
interface ClienteEstadisticas { totalClientes, totalInactivos, totalExpedientesActivos, totalExpedientes }
interface ClienteExpediente { id, numero, fechaIngreso, rama, estado, estadoColor, juzgado, ultimaActuacion }
interface ClienteGuardarDto { nombreCompleto, dpi, telefonoPrincipal, emailPrincipal, ... }
interface ClienteActualizarDto extends ClienteGuardarDto { fechaNacimiento, genero }
interface ClienteFiltros { filtroNombre, filtroEstado, filtroTipo, pagina, tamanioPagina }
```

#### Servicio (`clientes-service.ts`)

| Método | HTTP | Endpoint | Retorna |
|---|---|---|---|
| `listar(filtros)` | GET | `/api/clientes?...` | `{ clientes, total }` (lee header X-Total-Count) |
| `estadisticas()` | GET | `/api/clientes/estadisticas` | `ClienteEstadisticas` |
| `obtenerPorId(id)` | GET | `/api/clientes/{id}` | `ClienteDetalle` |
| `obtenerExpedientes(id)` | GET | `/api/clientes/{id}/expedientes` | `ClienteExpediente[]` |
| `crear(datos)` | POST | `/api/clientes` | `ClienteLista` |
| `actualizar(id, datos)` | PUT | `/api/clientes/{id}` | `ClienteLista` |
| `cambiarEstado(id, activo)` | PUT | `/api/clientes/{id}/estado` | `void` |

#### Router (`app.routes.ts`)

| Ruta | Componente | Guard |
|---|---|---|
| `/clientes` | `ClientesPage` (lazy) | `moduloGuard('clientes')` |
| `/clientes/:id` | `ClienteDetallePage` (lazy) | `moduloGuard('clientes')` |

#### Componentes compartidos creados

| Componente | Selector | Propósito |
|---|---|---|
| `PageHeader` | `<app-page-header>` | Título + subtítulo + slot de acciones |
| `StatCard` | `<app-stat-card>` | Tarjeta bento (valor + badge) |
| `BadgeEstado` | `<app-badge-estado>` | Pill coloreado por estado |
| `EmptyState` | `<app-empty-state>` | Mensaje cuando no hay datos |
| `Paginacion` | `<app-paginacion>` | Controles server-side |

### 5.4 Helpers de formato (replicados del prototipo)

| Función | Descripción | Ejemplo |
|---|---|---|
| `iniciales(nombre)` | Primera letra de nombre y apellido | "Carlos Morales" → "CM" |
| `colorAvatar(nombre)` | Color determinístico por nombre | Hash de charCodes módulo 8 colores |
| `formatearDpi(dpi)` | Formatea DPI con espacios | "2983123450101" → "2983 12345 0101" |
| `formatearFecha(iso)` | Fecha ISO a formato legible | "2026-08-12" → "12 Ago 2026" |
| `generoTexto(genero)` | Código a texto | "M" → "Masculino" |
| `varianteEstado(estado)` | Estado a variante de badge | "Activo" → "activo" |

### 5.5 Seguridad

| Aspecto | Implementación |
|---|---|
| Transporte | HTTPS (backend redirige HTTP→HTTPS) |
| Autenticación | JWT Bearer (120 min de expiración) |
| Autorización | `[Authorize(Roles = "Administrador")]` en POST, PUT, DELETE |
| Borrado | Lógico (`Activo = 0`); nunca DELETE físico |
| SQL Injection | Bloqueado por SPs con parámetros nombrados (Dapper) |
| XSS | Interpolación `{{ }}` escapa automáticamente |
| Token storage | `sessionStorage` (claves: `lexcontrol_token`, etc.) |

---

## 6. DTOs resumen (contrato frontend ↔ backend)

### Listado de clientes

```
GET /api/clientes?filtroEstado=true&pagina=1&tamanioPagina=6

200 → {
  success: true,
  data: [
    {
      id: 1,
      nombreCompleto: "Carlos Morales Ortiz",
      dpi: "2983123450101",
      telefonoPrincipal: "+502 5555-0123",
      emailPrincipal: "carlos.mo@email.com",
      activo: true,
      tipoCliente: "Particular",
      totalExpedientes: 5,
      expedientesActivos: 2,
      ultimaActividad: "2026-08-12"
    },
    ...
  ]
}
Headers: X-Total-Count: 8
```

### Estadísticas

```
GET /api/clientes/estadisticas

200 → {
  success: true,
  data: {
    totalClientes: 7,
    totalInactivos: 1,
    totalExpedientesActivos: 8,
    totalExpedientes: 23
  }
}
```

### Detalle del cliente

```
GET /api/clientes/1

200 → {
  success: true,
  data: {
    id: 1,
    nombreCompleto: "Carlos Morales Ortiz",
    dpi: "2983123450101",
    fechaNacimiento: "1985-03-12",
    genero: "M",
    tipoCliente: "Particular",
    notas: "Cliente referido por recomendación.",
    activo: true
  }
}
```

### Expedientes del cliente

```
GET /api/clientes/1/expedientes

200 → {
  success: true,
  data: [
    {
      id: 101,
      numero: "2026-0045",
      fechaIngreso: "2025-10-15",
      rama: "Civil",
      estado: "Activo",
      estadoColor: "#358292",
      juzgado: "Juzgado de Primera Instancia Civil de Sololá",
      ultimaActuacion: "Audiencia de Conciliación"
    },
    ...
  ]
}
```

### Crear cliente

```
POST /api/clientes
{
  nombreCompleto: "Nuevo Cliente",
  dpi: "1234567890123",
  telefonoPrincipal: "+502 5555-0000",
  emailPrincipal: "nuevo@email.com",
  tipoCliente: "Particular"
}

201 → { success: true, data: ClienteDto }
```

### Editar cliente

```
PUT /api/clientes/1
{
  nombreCompleto: "Carlos Morales Ortiz (editado)",
  dpi: "2983123450101",
  telefonoPrincipal: "+502 5555-0123",
  emailPrincipal: "carlos.mo@email.com"
}

200 → { success: true, data: ClienteDto }
```

### Cambiar estado

```
PUT /api/clientes/1/estado
{ activo: false }

204 No Content
```

---

## 7. Consideraciones y limitaciones

### 7.1 Gaps conocidos

1. **Campo `tipoCaso`**: El prototipo muestra una columna "Tipo Caso" y un filtro "Último caso" que el backend NO expone. Estos campos fueron omitidos intencionalmente en la implementación actual.
2. **Botón "Nuevo expediente"**: En el detalle del cliente, el botón está deshabilitado hasta que se implemente el módulo de Expedientes.
3. **Filtro por tipo de cliente**: El select de tipo (Particular/Empresa) no está implementado en el frontend actual; el backend lo soporta via `filtroTipo`.

### 7.2 SP_Cliente_Listar — paginación

El SP usa `OFFSET ... FETCH NEXT` para paginación server-side. El frontend lee el header `X-Total-Count` para renderizar los controles de paginación.

**Nota**: El SP calcula `TotalRegistros` dos veces (en el conteo y en cada fila resultado). Esto es intencional para que Dapper pueda leerlo en la primera fila del result set.

### 7.3 SP_Cliente_ObtenerExpedientes — última actuación

La "última actuación" de cada expediente se obtiene de la **nota más reciente** (`NOTA_EXPEDIENTE`) via `ROW_NUMBER() OVER (PARTITION BY Expediente_ID ORDER BY FechaCreacion DESC)`. Si un expediente no tiene notas, el campo `UltimaActuacion` será NULL.

### 7.4 ISNULL en SP_Cliente_Actualizar

El SP usa `ISNULL(@parametro, valor_actual)` para conservar valores no enviados. Esto significa que si el frontend envía `null` para un campo opcional, se conserva el valor actual. El único campo que **siempre** se actualiza es `NombreCompleto` (parámetro obligatorio).

### 7.5 Borrado lógico en cascade

`SP_Cliente_Desactivar` y `SP_Cliente_Reactivar` desactivan/activan tanto `CLIENTE` como `PERSONA` asociada. Esto asegura que el cliente no aparezca en búsquedas globales cuando está inactivo.

### 7.6 Componentes compartidos reutilizables

Los 5 componentes creados (`PageHeader`, `StatCard`, `BadgeEstado`, `EmptyState`, `Paginacion`) están diseñados para ser reutilizados en otros módulos:
- **Expedientes**: `BadgeEstado` para estados de expediente, `Paginacion` para listado.
- **Agenda**: `PageHeader` para encabezados.
- **Reportes**: `StatCard` para métricas.
- **Todos**: `EmptyState` para tablas vacías.

---

## 8. Capturas de pantalla

> Reemplace los marcadores de posición a continuación con capturas reales del sistema.

### 8.1 Listado de clientes

`[INSERTAR CAPTURA: /clientes — bento grid con 2 tarjetas, filtros de estado, tabla con 6 columnas, paginación.]`

### 8.2 Modal crear cliente

`[INSERTAR CAPTURA: Modal "Nuevo Cliente" con fieldsets de Datos personales y Contacto, formulario vacío.]`

### 8.3 Detalle del cliente

`[INSERTAR CAPTURA: /clientes/1 — breadcrumb, info-card con avatar y badges, tabla de expedientes.]`

### 8.4 Modal editar cliente

`[INSERTAR CAPTURA: Modal "Editar Cliente" con campos prellenados.]`

---

## 9. Commits relacionados

| Commit | Descripción | Archivos |
|---|---|---|
| `a940147` | Backend: controlador, servicio, DTOs, registro DI | `ClientesController.cs`, `ClienteService.cs`, `ClienteDtos.cs`, `Program.cs` |
| `fe3cf19` | Frontend: modelo, servicio, 5 componentes compartidos, 3 feature components, rutas | 14 archivos, 1001 líneas |
