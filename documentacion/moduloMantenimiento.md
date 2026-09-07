# Módulo de Mantenimiento — Documentación Técnica

> Documentación del módulo **Mantenimiento** de **LexControl**, el sistema de gestión de expedientes para un bufete jurídico guatemalteco.
>
> **Criterio**: Incluye (1) funcionalidad de la aplicación, (2) verificación en la base de datos, y (3) explicación técnica de modelos, rutas y componentes.

---

## 1. Estructura de carpetas del módulo

```
LexControl/
├── Back-end/LexControlApi/
│   ├── Controllers/
│   │   └── CatalogosController.cs         — 10 endpoints REST
│   ├── Services/
│   │   └── CatalogoService.cs             — ICatalogoService + CatalogoService (10 métodos)
│   └── Dtos/Catalogos/
│       └── CatalogoDtos.cs                — 7 clases DTO
│
├── Front-end/LexControlFornt/src/app/
│   ├── core/
│   │   ├── models/
│   │   │   └── catalogo.model.ts          — 6 interfaces TypeScript
│   │   └── services/
│   │       └── catalogos-service.ts       — Servicio HTTP (10 métodos)
│   ├── features/mantenimiento/
│   │   ├── mantenimiento-page.ts          — Grid de catálogos
│   │   ├── mantenimiento-page.html        — Template del grid
│   │   ├── mantenimiento-detalle-page.ts  — Tabla CRUD de un catálogo
│   │   ├── mantenimiento-detalle-page.html — Template de la tabla
│   │   ├── mantenimiento-item-modal.ts    — Modal crear/editar
│   │   └── mantenimiento-item-modal.html  — Template del modal
│   └── styles/modules/
│       └── mantenimiento.css              — Estilos del módulo
│
├── ScriptsDB/
│   └── sp_mantenimientos.sql              — 10 SPs (genéricos + Juzgado)
│
└── documentacion/
    └── moduloMantenimiento.md             — ← Este documento
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

Los SPs del módulo de mantenimiento están en un solo archivo:

```sql
-- SPs de mantenimiento (CRUD genérico + Juzgado)
LexControl/ScriptsDB/sp_mantenimientos.sql
```

> **Nota**: Este script requiere que la BD `DBLexControl` ya exista (creada por `Base_Datos.sql`). Ejecutar después de `Proceso_almacenados.sql`.
> Todos los SPs usan `CREATE OR ALTER` (idempotentes).

### 2.3 Backend (API REST)

```bash
cd Back-end/LexControlApi
dotnet run
```

- La API arranca en `https://localhost:7276`.
- Swagger UI: `https://localhost:7276/swagger`

### 2.4 Frontend (SPA Angular)

```bash
cd Front-end/LexControlFornt
npm install        # primera vez
npm start
```

- El SPA arranca en `http://localhost:4200`.
- El proxy redirige `/api/*` a `https://localhost:7276` (ver `proxy.conf.json`).

### 2.5 Secuencia de prueba del módulo

1. Navegar a `http://localhost:4200/login`.
2. Ingresar `admin` / `admin123`.
3. Click en **Mantenimiento** en el sidebar.
4. Verificar que el grid muestra 17 catálogos con iconos, títulas y tablas.
5. Usar la búsqueda para filtrar catálogos por nombre o tabla.
6. Click en "Ramas del Derecho" → navega al detalle.
7. Verificar que la tabla muestra los items del catálogo con toggle activo/inactivo.
8. Click en "Nuevo valor" → completar formulario → Guardar.
9. Click en "Editar" (lápiz) en una fila → modificar datos → Guardar.
10. Toggle el switch de activo/inactivo en una fila.
11. Volver al grid usando "Volver a Catálogos" o breadcrumb.

---

## 3. Funcionalidad de la aplicación

### 3.1 Grid de catálogos

| Aspecto | Detalle |
|---|---|
| Componente | `MantenimientoPage` (`features/mantenimiento/mantenimiento-page.ts`) |
| Ruta | `/mantenimiento` |
| Datos | Lista estática de 17 catálogos definida en el componente |

**Funcionalidades**:
- **Grid responsivo**: Cards con icono SVG, título, nombre de tabla, descripción y enlace "Administrar".
- **Búsqueda**: Filtro por texto en tiempo real (nombre, tabla, descripción).
- **Banner de advertencia**: "Los cambios impactan globalmente."
- **Click en card**: Navega a `/mantenimiento/{key}`.
- **Conteo de items**: Al montar, carga el total de items de cada catálogo (request inicial para verificar conexión).

### 3.2 Detalle de catálogo (CRUD)

| Aspecto | Detalle |
|---|---|
| Endpoint genérico | `GET /api/catalogos/{tabla}` |
| Endpoint juzgados | `GET /api/catalogos/juzgados` |
| Componente | `MantenimientoDetallePage` (`features/mantenimiento/mantenimiento-detalle-page.ts`) |
| Ruta | `/mantenimiento/:catalogo` |

**Funcionalidades**:
- **Breadcrumb**: "Mantenimiento / {Título del catálogo}" con enlace de regreso.
- **Filtros**: Búsqueda por texto + checkbox "Incluir inactivos".
- **Tabla dinámica**: Columnas según tipo de catálogo:
  - **Estándar**: Nombre, Valor, Color, Orden, Estado, Fecha Creación, Acciones.
  - **Juzgado**: Nombre, Tipo, Dirección, Teléfono, Email, Estado, Fecha Creación, Acciones.
- **Paginación server-side**: 10 items por página con botones de página.
- **Toggle activo/inactiv**: Switch en cada fila para activar/desactivar.
- **Botón "Nuevo valor":** Abre modal de creación.
- **Botón "Editar"**: Abre modal de edición con datos prellenados.
- **Columna color**: Muestra punto de color (solo catálogos estándar).

### 3.3 Modal crear/editar

| Aspecto | Detalle |
|---|---|
| Endpoint crear | `POST /api/catalogos/{tabla}` o `POST /api/catalogos/juzgados` |
| Endpoint editar | `PUT /api/catalogos/{tabla}/{id}` o `PUT /api/catalogos/juzgados/{id}` |
| Componente | `MantenimientoItemModal` (`features/mantenimiento/mantenimiento-item-modal.ts`) |
| Autorización | Solo Administrador (`[Authorize(Roles = "Administrador")]`) |

**Formulario catálogo estándar**:

| Campo | Tipo | Obligatorio | Restricciones |
|---|---|---|---|
| Nombre | text | Sí | máx. 50, único en la tabla |
| Valor | text | No | máx. 20 (código abreviado) |
| Color | color + text | No | Formato hex `#RRGGBB` |
| Orden | number | No | Entero ≥ 0 |
| Descripción | textarea | No | máx. 200 |

**Formulario juzgado**:

| Campo | Tipo | Obligatorio | Restricciones |
|---|---|---|---|
| Nombre | text | Sí | máx. 100, único |
| Tipo de juzgado | number | Sí | ID de TIPO_JUZGADO |
| Municipio | number | Sí | ID de MUNICIPIO |
| Dirección | text | No | máx. 200 |
| Teléfono | text | No | máx. 20 |
| Email | email | No | formato válido |

**Validaciones client-side**:
- Nombre不能为空 (HTML `required`).
- Email con formato válido si se ingresa.
- Tipo de juzgado y municipio requeridos (solo juzgado).

---

## 4. Verificación en la base de datos

### 4.1 Tablas involucradas

El módulo de mantenimiento opera sobre **16 tablas de catálogos** más la tabla **JUZGADO**:

#### Catálogos estándar (mismo esquema)

```sql
-- Patrón común para: RAMA, ESTADO_EXPEDIENTE, TIPO_AUDIENCIA, ESTADO_AUDIENCIA,
-- RESULTADO_AUDIENCIA, TIPO_TRAMITE, ESTADO_TRAMITE, TIPO_DILIGENCIA,
-- ESTADO_DILIGENCIA, TIPO_NOTIFICACION_OJ, ESTADO_NOTIFICACION_OJ,
-- TIPO_PROCESO, ETIQUETA_NOTA, ESTADO_EVENTO, TIPO_JUZGADO, ROL_PROCESAL

CREATE TABLE <TABLA> (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Valor NVARCHAR(20) NULL,
    Descripcion NVARCHAR(200) NULL,
    Color NVARCHAR(7) NULL,
    Orden INT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
);
```

#### JUZGADO (tabla con FKs)

```sql
CREATE TABLE JUZGADO (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Tipo_Juzgado_ID INT NOT NULL,
    Direccion NVARCHAR(200) NULL,
    Telefono NVARCHAR(20) NULL,
    Email NVARCHAR(100) NULL,
    Municipio_ID INT NOT NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_JUZGADO_TIPO FOREIGN KEY (Tipo_Juzgado_ID) REFERENCES TIPO_JUZGADO(ID),
    CONSTRAINT FK_JUZGADO_MUNICIPIO FOREIGN KEY (Municipio_ID) REFERENCES MUNICIPIO(ID)
);
```

### 4.2 Procedimientos almacenados

#### SPs genéricos (aplican a 6 tablas con whitelist)

| SP | Tablas | Parámetros | Return | Descripción |
|---|---|---|---|---|
| `SP_Catalogo_Buscar` | RAMA, ESTADO_EXPEDIENTE, TIPO_PROCESO, ROL_PROCESAL, TIPO_JUZGADO, ETIQUETA_NOTA | `@Tabla`, `@Busqueda`, `@IncluirInactivos`, `@Pagina`, `@TamanoPagina` | SELECT filas + Total | Búsqueda paginada con whitelist de tablas |
| `SP_Catalogo_Insertar` | (las mismas) | `@Tabla`, `@Nombre`, `@Valor`, `@Descripcion`, `@Color`, `@Orden` | OUTPUT `@NuevoID` | Inserta fila (valida nombre único) |
| `SP_Catalogo_Actualizar` | (las mismas) | `@Tabla`, `@ID`, `@Nombre`, `@Valor`, `@Descripcion`, `@Color`, `@Orden` | RETURN 0 | Actualiza fila (valida nombre único) |
| `SP_Catalogo_CambiarEstado` | (las mismas) | `@Tabla`, `@ID`, `@Activo` | RETURN 0 | Activa/desactiva (verifica integridad) |
| `SP_Catalogo_ObtenerPorID` | (las mismas) | `@Tabla`, `@ID` | SELECT fila | Obtiene una fila por ID |

#### SPs dedicados para JUZGADO

| SP | Parámetros | Return | Descripción |
|---|---|---|---|
| `SP_Juzgado_Buscar` | `@Busqueda`, `@IncluirInactivos`, `@Pagina`, `@TamanoPagina` | SELECT filas + Total | Lista con joins de Tipo/Municipio/Departamento |
| `SP_Juzgado_Insertar` | `@Nombre`, `@TipoJuzgadoId`, `@Direccion`, `@Telefono`, `@Email`, `@MunicipioId` | OUTPUT `@NuevoID` | Crea juzgado (valida nombre único) |
| `SP_Juzgado_Actualizar` | `@ID`, `@Nombre`, `@TipoJuzgadoId`, `@Direccion`, `@Telefono`, `@Email`, `@MunicipioId` | RETURN 0 | Actualiza juzgado |
| `SP_Juzgado_CambiarEstado` | `@ID`, `@Activo` | RETURN 0 | Activa/desactiva (verifica integridad referencial) |
| `SP_Juzgado_ObtenerPorID` | `@ID` | SELECT fila | Obtiene juzgado por ID |

### 4.3 Seguridad en SPs (whitelist)

Los SPs genéricos validan que el parámetro `@Tabla` esté en una lista blanca predefinida para prevenir inyección SQL:

```sql
-- En SP_Catalogo_Buscar, SP_Catalogo_Insertar, etc.
IF @Tabla NOT IN ('RAMA', 'ESTADO_EXPEDIENTE', 'TIPO_PROCESO', 'ROL_PROCESAL', 'TIPO_JUZGADO', 'ETIQUETA_NOTA')
BEGIN
    RAISERROR('Tabla no permitida.', 16, 1);
    RETURN;
END
```

### 4.4 Verificación de datos

```sql
-- Contar items por catálogo
SELECT COUNT(*) FROM RAMA WHERE Activo = 1;
SELECT COUNT(*) FROM ESTADO_EXPEDIENTE WHERE Activo = 1;
SELECT COUNT(*) FROM JUZGADO WHERE Activo = 1;

-- Probar SP_Catalogo_Buscar
EXEC SP_Catalogo_Buscar @Tabla = 'RAMA', @Pagina = 1, @TamanoPagina = 10;

-- Probar SP_Juzgado_Buscar
EXEC SP_Juzgado_Buscar @Pagina = 1, @TamanoPagina = 10;

-- Verificar integridad referencial (intenta desactivar una rama en uso)
-- Debería fallar si hay expedientes activos con esa rama
EXEC SP_Catalogo_CambiarEstado @Tabla = 'RAMA', @ID = 1, @Activo = 0;
```

---

## 5. Explicación técnica

### 5.1 Arquitectura del módulo

```
┌─────────────────────────────────────────────────────────┐
│           Frontend (Angular 20 Standalone)               │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │ Mantenimiento│  │ Mantenimiento    │  │ Mantenim. │  │
│  │    Page      │  │ Detalle Page     │  │ ItemModal │  │
│  │  (grid)      │  │  (tabla CRUD)    │  │  (crear/  │  │
│  │              │  │                  │  │  editar)  │  │
│  └──────┬───────┘  └────────┬─────────┘  └─────┬─────┘  │
│         │                   │                   │         │
│  ┌──────▼───────────────────▼───────────────────▼─────┐  │
│  │           CatalogosService (10 métodos)             │  │
│  │           HTTP + JWT Bearer                        │  │
│  └──────────────────────┬────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│         Backend (.NET 10 / ASP.NET Core)                 │
│  ┌──────────────────────┐  ┌──────────────────────┐     │
│  │ CatalogosController  │──│   CatalogoService     │     │
│  │ (10 endpoints)       │  │   (10 métodos)        │     │
│  └──────────┬───────────┘  └──────────┬───────────┘     │
│             │                          │                  │
│  ┌──────────▼──────────────────────────▼───────────┐    │
│  │           Data Layer (Dapper)                    │    │
│  │  IRepositorio → ConsultarLista, EjecutarRetorno  │    │
│  └──────────────────────┬──────────────────────────┘    │
└─────────────────────────┼───────────────────────────────┘
                          │ Stored Procedures
┌─────────────────────────▼───────────────────────────────┐
│                 DBLexControl (SQL Server)                │
│  16 tablas de catálogos + JUZGADO con FKs               │
│  10 SPs de mantenimiento en sp_mantenimientos.sql        │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Backend — Controlador, servicio y DTOs

#### `CatalogosController.cs` — `api/catalogos`

| Método | Endpoint | Autorización | Descripción |
|---|---|---|---|
| GET | `/{tabla}` | Autenticado | Lista items de un catálogo estándar |
| GET | `/{tabla}/{id}` | Autenticado | Obtiene un item por ID |
| POST | `/{tabla}` | Solo Admin | Crea un item |
| PUT | `/{tabla}/{id}` | Solo Admin | Actualiza un item |
| PUT | `/{tabla}/{id}/estado` | Solo Admin | Activa/desactiva un item |
| GET | `/juzgados` | Autenticado | Lista juzgados |
| GET | `/juzgados/{id}` | Autenticado | Obtiene un juzgado por ID |
| POST | `/juzgados` | Solo Admin | Crea un juzgado |
| PUT | `/juzgados/{id}` | Solo Admin | Actualiza un juzgado |
| PUT | `/juzgados/{id}/estado` | Solo Admin | Activa/desactiva un juzgado |

**Nota**: Los endpoints POST, PUT y PUT/estado requieren `[Authorize(Roles = "Administrador")]`. Solo el rol Administrador puede modificar catálogos.

#### `CatalogoService.cs` — Lógica de negocio

| Método | SP | Manejo de errores |
|---|---|---|
| `BuscarCatalogoAsync` | `SP_Catalogo_Buscar` | Retorna (lista, total) |
| `ObtenerCatalogoPorIdAsync` | `SP_Catalogo_ObtenerPorID` | ExcepcionNegocio si no existe |
| `InsertarCatalogoAsync` | `SP_Catalogo_Insertar` | Valida whitelist + duplicado (2627 → 400) |
| `ActualizarCatalogoAsync` | `SP_Catalogo_Actualizar` | Valida whitelist + duplicado (2627 → 400) |
| `CambiarEstadoCatalogoAsync` | `SP_Catalogo_CambiarEstado` | Verifica integridad referencial |
| `BuscarJuzgadoAsync` | `SP_Juzgado_Buscar` | Retorna (lista, total) |
| `ObtenerJuzgadoPorIdAsync` | `SP_Juzgado_ObtenerPorID` | ExcepcionNegocio si no existe |
| `InsertarJuzgadoAsync` | `SP_Juzgado_Insertar` | Duplicado (2627 → 400) |
| `ActualizarJuzgadoAsync` | `SP_Juzgado_Actualizar` | Duplicado (2627 → 400) |
| `CambiarEstadoJuzgadoAsync` | `SP_Juzgado_CambiarEstado` | Verifica integridad referencial |

**Códigos de retorno manejados**:
| Retorno | Significado |
|---|---|
| `0` | Éxito |
| `-1` | Item no encontrado (404) |
| `2601` / `2627` | Nombre duplicado (400 Bad Request) |
| Otro | Error de BD (500) |

**Whitelist de tablas** (prevenir inyección SQL):
```csharp
private static readonly HashSet<string> TablasPermitidas = new(StringComparer.OrdinalIgnoreCase)
{
    "RAMA", "ESTADO_EXPEDIENTE", "TIPO_AUDIENCIA", "ESTADO_AUDIENCIA",
    "RESULTADO_AUDIENCIA", "TIPO_TRAMITE", "ESTADO_TRAMITE",
    "TIPO_DILIGENCIA", "ESTADO_DILIGENCIA", "TIPO_NOTIFICACION_OJ",
    "ESTADO_NOTIFICACION_OJ", "TIPO_PROCESO", "ETIQUETA_NOTA",
    "ESTADO_EVENTO", "TIPO_JUZGADO", "ROL_PROCESAL"
};
```

#### DTOs de entrada

`CatalogoCrearDto` (catálogos estándar):
```csharp
{
  Nombre:    string  [Required, MaxLength(50)]
  Valor:     string? [MaxLength(20)]
  Descripcion: string? [MaxLength(200)]
  Color:     string? [MaxLength(7)]
  Orden:     int
}
```

`JuzgadoCrearDto`:
```csharp
{
  Nombre:         string  [Required, MaxLength(100)]
  TipoJuzgadoId:  int     [Required]
  MunicipioId:    int     [Required]
  Direccion:      string? [MaxLength(200)]
  Telefono:       string? [MaxLength(20)]
  Email:          string? [EmailAddress, MaxLength(100)]
}
```

`CatalogoEstadoDto`:
```csharp
{
  Activo: bool
}
```

#### DTOs de salida

`CatalogoDto` (catálogos estándar):
```csharp
{
  Id:            int
  Nombre:        string
  Valor:         string?
  Descripcion:   string?
  Color:         string?
  Orden:         int
  Activo:        bool
  FechaCreacion: string   // ISO 8601
}
```

`JuzgadoDto`:
```csharp
{
  Id:              int
  Nombre:          string
  TipoJuzgado:     string?
  TipoJuzgadoId:   int
  Direccion:       string?
  Telefono:        string?
  Email:           string?
  Municipio:       string?
  MunicipioId:     int
  Departamento:    string?
  DepartamentoId:  int
  Activo:          bool
  FechaCreacion:   string
}
```

### 5.3 Frontend — Modelos, servicios y componentes

#### Modelo TypeScript (`catalogo.model.ts`)

```typescript
interface CatalogoItem {
  id: number;
  nombre: string;
  valor: string | null;
  descripcion: string | null;
  color: string | null;
  orden: number;
  activo: boolean;
  fechaCreacion: string | null;
}

interface JuzgadoItem {
  id: number;
  nombre: string;
  tipoJuzgado: string | null;
  tipoJuzgadoId: number;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  municipio: string | null;
  municipioId: number;
  departamento: string | null;
  departamentoId: number;
  activo: boolean;
  fechaCreacion: string | null;
}

interface CatalogoCrearDto { nombre, valor?, descripcion?, color?, orden? }
interface JuzgadoCrearDto { nombre, tipoJuzgadoId, municipioId, direccion?, telefono?, email? }
interface CatalogoEstadoDto { activo: boolean }
interface CatalogoDef { key, titulo, tabla, texto, color, tipo: 'estandar' | 'juzgado' }
```

#### Servicio (`catalogos-service.ts`)

| Método | HTTP | Endpoint | Retorna |
|---|---|---|---|
| `buscarCatalogo(tabla, filtros)` | GET | `/api/catalogos/{tabla}?...` | `{ items, total }` |
| `obtenerCatalogoPorId(tabla, id)` | GET | `/api/catalogos/{tabla}/{id}` | `CatalogoItem` |
| `insertarCatalogo(tabla, dto)` | POST | `/api/catalogos/{tabla}` | `CatalogoItem` |
| `actualizarCatalogo(tabla, id, dto)` | PUT | `/api/catalogos/{tabla}/{id}` | `CatalogoItem` |
| `cambiarEstadoCatalogo(tabla, id, dto)` | PUT | `/api/catalogos/{tabla}/{id}/estado` | `void` |
| `buscarJuzgados(filtros)` | GET | `/api/catalogos/juzgados?...` | `{ items, total }` |
| `obtenerJuzgadoPorId(id)` | GET | `/api/catalogos/juzgados/{id}` | `JuzgadoItem` |
| `insertarJuzgado(dto)` | POST | `/api/catalogos/juzgados` | `JuzgadoItem` |
| `actualizarJuzgado(id, dto)` | PUT | `/api/catalogos/juzgados/{id}` | `JuzgadoItem` |
| `cambiarEstadoJuzgado(id, dto)` | PUT | `/api/catalogos/juzgados/{id}/estado` | `void` |

#### Router (`app.routes.ts`)

| Ruta | Componente | Guard |
|---|---|---|
| `/mantenimiento` | `MantenimientoPage` (lazy) | `moduloGuard('mantenimiento')` |
| `/mantenimiento/:catalogo` | `MantenimientoDetallePage` (lazy) | `moduloGuard('mantenimiento')` |

**Parámetro `:catalogo`**: Clave del catálogo (ej. `rama`, `estado-expediente`, `juzgado`). El componente resuelve la definición del catálogo a partir de un mapa interno.

### 5.4 Permisos de acceso

| Rol | Acceso a Mantenimiento | Puede CRUD |
|---|---|---|
| Administrador | Sí | Sí (POST, PUT, PUT/estado) |
| Secretaria | Sí (solo lectura) | No |
| Abogado | No (oculto del sidebar) | No |

**Configuración de permisos** (`permisos.ts`):
```typescript
// Defaults por rol
Administrador: todosActivos(),           // incluye 'mantenimiento'
Secretaria:    todosMenos(['historico', 'notificaciones']),  // incluye 'mantenimiento' (lectura)
Abogado:       todosMenos(['mantenimiento']),               // NO incluye 'mantenimiento'
```

---

## 6. DTOs resumen (contrato frontend ↔ backend)

### Listar items de un catálogo

```
GET /api/catalogos/RAMA?busqueda=civil&incluirInactivos=false&pagina=1&tamanoPagina=50

200 → {
  success: true,
  data: [
    {
      id: 1,
      nombre: "Civil",
      valor: "CIV",
      descripcion: "Materia civil: contratos, propiedad, responsabilidad civil.",
      color: "#358292",
      orden: 0,
      activo: true,
      fechaCreacion: "2026-01-10T00:00:00"
    },
    ...
  ]
}
Headers: X-Total-Count: 6
```

### Crear item (catálogo estándar)

```
POST /api/catalogos/RAMA
{
  nombre: "Derecho Ambiental",
  valor: "AMB",
  descripcion: "Materia ambiental y recursos naturales.",
  color: "#27AE60",
  orden: 6
}

201 → {
  success: true,
  data: {
    id: 7,
    nombre: "Derecho Ambiental",
    valor: "AMB",
    color: "#27AE60",
    orden: 6,
    activo: true,
    ...
  }
}
```

### Actualizar item

```
PUT /api/catalogos/RAMA/7
{
  nombre: "Derecho Ambiental",
  valor: "AMB",
  descripcion: "Materia ambiental, recursos naturales y desarrollo sostenible.",
  color: "#27AE60",
  orden: 6
}

200 → { success: true, data: CatalogoDto }
```

### Cambiar estado

```
PUT /api/catalogos/RAMA/7/estado
{ activo: false }

204 No Content
```

### Listar juzgados

```
GET /api/catalogos/juzgados?pagina=1&tamanoPagina=10

200 → {
  success: true,
  data: [
    {
      id: 1,
      nombre: "Juzgado de Primera Instancia Civil de Sololá",
      tipoJuzgado: "Civil",
      tipoJuzgadoId: 1,
      direccion: "8ª Calle 4-16, Zona 1, Sololá",
      telefono: "7762-0391",
      email: "juzgado1civsolola@oj.gob.gt",
      municipio: "Sololá",
      municipioId: 1,
      departamento: "Sololá",
      departamentoId: 1,
      activo: true,
      fechaCreacion: "2026-01-10T00:00:00"
    },
    ...
  ]
}
Headers: X-Total-Count: 7
```

### Crear juzgado

```
POST /api/catalogos/juzgados
{
  nombre: "Juzgado de Paz de San Pedro La Laguna",
  tipoJuzgadoId: 5,
  municipioId: 3,
  direccion: "Barrio San Pedro",
  telefono: "7721-0000",
  email: "juzgadopazsanpedro@oj.gob.gt"
}

201 → { success: true, data: JuzgadoDto }
```

---

## 7. Consideraciones y limitaciones

### 7.1 Whitelist de tablas

Los SPs genéricos solo operan sobre 6 tablas: RAMA, ESTADO_EXPEDIENTE, TIPO_PROCESO, ROL_PROCESAL, TIPO_JUZGADO, ETIQUETA_NOTA. Las demás tablas de catálogos (TIPO_AUDIENCIA, ESTADO_AUDIENCIA, etc.) están soportadas por el backend pero no incluidas en el whitelist actual de los SPs genéricos. Para agregarlas, modificar la lista `TablasPermitidas` en `CatalogoService.cs` y el `IF @Tabla NOT IN (...)` en los SPs.

### 7.2 Juzgados requieren SPs dedicados

La tabla JUZGADO tiene foreign keys a TIPO_JUZGADO y MUNICIPIO, lo que requiere joins especiales y validaciones adicionales. Por esto se implementaron SPs dedicados (`SP_Juzgado_*`) en lugar de usar los genéricos.

### 7.3 Integridad referencial al desactivar

Los SPs de `CambiarEstado` verifican si el valor está en uso por otras entidades antes de desactivarlo. Si hay registros activos que referencian el valor, el SP retorna un error y el frontend muestra un mensaje.

### 7.4 Catálogos visibles vs editables

El módulo muestra los 17 catálogos definidos en la lista `CATALOGOS_MAP` del componente `MantenimientoPage`. Solo losAdministradores pueden crear, editar o cambiar estados. Los demás roles pueden ver la información pero no modificarla.

### 7.5 Formulario dinámico

El modal `MantenimientoItemModal` cambia dinámicamente los campos del formulario según el tipo de catálogo:
- **Estándar**: nombre, valor, color, orden, descripción.
- **Juzgado**: nombre, tipo de juzgado (ID), municipio (ID), dirección, teléfono, email.

### 7.6 Componentes compartidos reutilizados

El módulo reutiliza los componentes compartidos creados para Clientes/Expedientes:
- `PageHeader` — Encabezado de página con título y acciones.
- `EmptyState` — Mensaje cuando no hay datos.
- `Paginacion` — Controles de paginación server-side.

---

## 8. Capturas de pantalla

> Reemplace los marcadores de posición a continuación con capturas reales del sistema.

### 8.1 Grid de catálogos

`[INSERTAR CAPTURA: /mantenimiento — grid de cards con iconos, títulas y tablas de 17 catálogos.]`

### 8.2 Detalle de catálogo (estándar)

`[INSERTAR CAPTURA: /mantenimiento/rama — tabla con columnas Nombre, Valor, Color, Orden, Estado, Fecha, Acciones.]`

### 8.3 Detalle de juzgados

`[INSERTAR CAPTURA: /mantenimiento/juzgado — tabla con columnas Nombre, Tipo, Dirección, Teléfono, Email, Estado.]`

### 8.4 Modal crear valor

`[INSERTAR CAPTURA: Modal "Nuevo valor" con campos Nombre, Valor, Color, Orden, Descripción.]`

### 8.5 Modal editar juzgado

`[INSERTAR CAPTURA: Modal "Editar" con campos Nombre, Tipo de juzgado, Municipio, Dirección, Teléfono, Email.]`

---

## 9. Archivos SQL del módulo

### 9.1 `sp_mantenimientos.sql`

Ubicación: `LexControl/ScriptsDB/sp_mantenimientos.sql`

**Contenido**: 10 procedimientos almacenados agrupados en 2 secciones:

1. **Catálogos genéricos** (6 tablas con whitelist):
   - `SP_Catalogo_Buscar`
   - `SP_Catalogo_Insertar`
   - `SP_Catalogo_Actualizar`
   - `SP_Catalogo_CambiarEstado`
   - `SP_Catalogo_ObtenerPorID`

2. **Juzgados** (tabla con FKs):
   - `SP_Juzgado_Buscar`
   - `SP_Juzgado_Insertar`
   - `SP_Juzgado_Actualizar`
   - `SP_Juzgado_CambiarEstado`
   - `SP_Juzgado_ObtenerPorID`

**Características**:
- Todos usan `CREATE OR ALTER` (idempotentes).
- SPs genéricos validan `@Tabla` contra whitelist.
- SPs de juzgado hacen joins con TIPO_JUZGADO, MUNICIPIO y DEPARTAMENTO.
- Paginación con `OFFSET ... FETCH NEXT`.
- `SP_Catalogo_Buscar` y `SP_Juzgado_Buscar` devuelven `Total` como columna en el result set (requerido por el frontend para paginación).
