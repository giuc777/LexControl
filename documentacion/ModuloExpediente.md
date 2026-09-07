# Módulo de Expedientes — Documentación Técnica

> Documentación del módulo **Expedientes** de **LexControl**, el sistema de gestión de expedientes para un bufete jurídico guatemalteco.
>
> **Criterio**: Incluye (1) funcionalidad de la aplicación, (2) verificación en la base de datos, y (3) explicación técnica de modelos, rutas y componentes.

---

## 1. Estructura de carpetas del módulo

```
LexControl/
├── Back-end/LexControlApi/
│   ├── Controllers/
│   │   ├── ExpedientesController.cs      — 14 endpoints REST
│   │   └── DocumentosController.cs       — 3 endpoints (upload/download/delete)
│   ├── Services/
│   │   ├── IExpedienteService.cs         — Interfaz
│   │   ├── ExpedienteService.cs          — Lógica de negocio (13 métodos)
│   │   ├── IFileStorageService.cs        — Interfaz de almacenamiento
│   │   └── FileStorageService.cs         — Almacenamiento en disco
│   └── Dtos/
│       ├── Expedientes/
│       │   └── ExpedienteDtos.cs         — 18 clases DTO
│       └── Documentos/
│           └── DocumentoUploadDto.cs     — DTO de respuesta upload
│
├── Front-end/LexControlFornt/src/app/
│   ├── core/
│   │   ├── models/
│   │   │   └── expediente.model.ts       — 15 interfaces TypeScript
│   │   └── services/
│   │       ├── expedientes-service.ts    — Servicio HTTP (13 métodos)
│   │       └── documentos-service.ts     — Servicio HTTP upload/download (4 métodos)
│   ├── features/expedientes/
│   │   ├── expedientes-page.ts           — Listado principal
│   │   ├── expedientes-page.html         — Template del listado
│   │   ├── expediente-modal.ts           — Modal crear/editar
│   │   ├── expediente-modal.html         — Template del modal
│   │   ├── expediente-detalle-page.ts    — Detalle 2 columnas
│   │   └── expediente-detalle-page.html  — Template del detalle
│   └── styles/modules/
│       └── expedientes.css               — Estilos del módulo (portados del prototipo)
│
├── ScriptsDB/
│   ├── Expedientes_SP.sql                — 9 SPs nuevos del módulo
│   ├── LexControlDB.sql                  — 7 SPs originales de expedientes
│   └── ...
└── documentacion/
    ├── ModuloExpediente.md               — ← Este documento
    └── desarrolloBackExpedientes.md      — Documentación del backend
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

Los SPs del módulo de expedientes se distribuyen en 2 archivos:

```sql
-- 1) SPs originales (CRUD básico, insertar nota, insertar documento)
LexControlDB.sql

-- 2) SPs nuevos (listar paginado, partes procesales, notas, documentos)
Expedientes_SP.sql
```

> **Orden de ejecución**: Primero `LexControlDB.sql` → luego `Expedientes_SP.sql`.
> Todos usan `CREATE OR ALTER` (idempotentes).

### 2.3 Backend (API REST)

```bash
cd Back-end/LexControlApi
dotnet run --urls http://localhost:5181
```

- La API arranca en `http://localhost:5181`.
- CORS permite `http://localhost:4200` (frontend Angular).

### 2.4 Frontend (SPA Angular)

```bash
cd Front-end/LexControlFornt
npm install        # primera vez
npm start
```

- El SPA arranca en `http://localhost:4200`.

### 2.5 Secuencia de prueba del módulo

1. Navegar a `http://localhost:4200/login`.
2. Ingresar `admin` / `Test1234!`.
3. Click en **Expedientes** en el sidebar.
4. Verificar que el listado carga con la tabla de expedientes y filtros.
5. Filtrar por rama, estado o buscar por número.
6. Click en "Nuevo Expediente" → completar formulario → Guardar.
7. Click en una fila de la tabla → navega al detalle del expediente.
8. En el detalle, verificar:
   - **Información General**: datos del expediente, badge de estado, abogado asignado.
   - **Notas**: agregar nota → se muestra en la lista.
   - **Partes Procesales**: agregar parte → se muestra en la tabla.
   - **Documentos**: subir documento → se muestra en la lista.
9. Click en "Editar Expediente" → modificar datos → Guardar cambios.
10. Volver al listado usando el breadcrumb "Expedientes".

---

## 3. Funcionalidad de la aplicación

### 3.1 Listado de expedientes

| Aspecto | Detalle |
|---|---|
| Endpoint | `GET /api/expedientes` |
| Query params | `ramaId`, `estadoId`, `clienteId`, `abogadoId`, `noExpediente`, `pagina`, `tamanioPagina` |
| Respuesta | `{ success, data: ExpedienteLista[] }` + header `X-Total-Count` |
| Componente | `ExpedientesPage` (`features/expedientes/expedientes-page.ts`) |
| Ruta | `/expedientes` |

**Funcionalidades**:
- **Barra de búsqueda**: Input para buscar por número de expediente (live search).
- **Filtros**: Select de rama (Civil, Penal, Familiar, Municipal, Laboral, Constitucional) y select de estado (Activo, En Espera, Cerrado, Archivado, Urgente).
- **Tabla**: 8 columnas — No. Expediente, Cliente, Rama (badge coloreado), Tipo Proceso, Juzgado, Fecha Ingreso, Estado (pill coloreado), Abogado.
- **Paginación server-side**: 7 items por página, botones de página con info "Mostrando X-Y de Z expedientes".
- **Click en fila**: Navega a `/expedientes/{id}`.
- **Botón "Nuevo Expediente"**: Abre modal de creación.

### 3.2 Detalle del expediente (2 columnas)

| Aspecto | Detalle |
|---|---|
| Endpoint detalle | `GET /api/expedientes/{id}` |
| Endpoint partes | `GET /api/expedientes/{id}/partes` |
| Endpoint notas | `GET /api/expedientes/{id}/notas` |
| Endpoint documentos | `GET /api/expedientes/{id}/documentos` |
| Componente | `ExpedienteDetallePage` (`features/expedientes/expediente-detalle-page.ts`) |
| Ruta | `/expedientes/:id` |

**Columna izquierda**:

- **Información General** (info-card): Cliente, Rama (badge), Rol Procesal, Tipo de Proceso, Juzgado, Fecha de Ingreso, Descripción, Notas Internas, Abogado Asignado (strip).
- **Notas del Expediente**: Lista de notas con etiquetas, contenido, autor y fecha. Botón "Agregar Nota" abre modal.
- **Partes Procesales**: Tabla con Rol, Entidad/Nombre, Representante. Botón "Agregar Parte" abre modal.

**Columna derecha**:

- **Documentos**: Lista de archivos con icono por tipo (PDF/Word/Excel), nombre, tamaño y fecha. Botones de descarga y eliminación. Botón "Subir Documento" abre modal.

**Cabecera**:
- Breadcrumb: "Expedientes / {No. Expediente}"
- Badge de estado coloreado
- Botón "Editar Expediente" con icono de lápiz

### 3.3 Modal crear expediente

| Aspecto | Detalle |
|---|---|
| Endpoint crear | `POST /api/expedientes` |
| Componente | `ExpedienteModal` (`features/expedientes/expediente-modal.ts`) |
| Autorización | Administrador, Abogado |
| Ancho | 780px |

**Formulario** (1 fieldset, 2 columnas):

| Campo | Requerido | Tipo |
|---|---|---|
| No. Expediente | Sí | Texto (máx. 50) |
| Fecha de Ingreso | No | Date |
| Rama | Sí | Select (6 opciones) |
| Estado | Sí | Select (5 opciones) |
| Cliente ID | Sí | Number |
| Rol Procesal | Sí | Select (7 opciones) |
| Tipo de Proceso | No | Texto (máx. 50) |
| Juzgado | Sí | Select (6 opciones) |
| Descripción | No | Textarea (máx. 500) |
| Notas Internas | No | Textarea (máx. 1000) |

**Validaciones client-side**:
- No. Expediente不能为空
- Cliente ID > 0
- Rol Procesal seleccionado
- Rama seleccionada
- Juzgado seleccionado

### 3.4 Modal editar expediente

| Aspecto | Detalle |
|---|---|
| Endpoint editar | `PUT /api/expedientes/{id}` |
| Componente | `ExpedienteModal` (reutilizado en modo `editar`) |
| Autorización | Administrador, Abogado |

Mismo formulario que crear, pero:
- Título: "Editar Expediente"
- Botón: "Guardar cambios"
- Todos los campos opcionales (usa `ExpedienteActualizarDto`)
- Se precargan los datos actuales del expediente

### 3.5 Modal agregar nota

| Aspecto | Detalle |
|---|---|
| Endpoint | `POST /api/expedientes/{id}/notas` |
| Componente | `<app-modal>` (componente compartido) |

**Formulario**: Textarea para contenido de la nota.

### 3.6 Modal agregar parte procesal

| Aspecto | Detalle |
|---|---|
| Endpoint | `POST /api/expedientes/{id}/partes` |
| Componente | `<app-modal>` (componente compartido) |

**Formulario** (2 columnas):

| Campo | Requerido |
|---|---|
| Tipo | Sí (Demandante/Demandado/Tercero Interesado/Testigo/Perito) |
| Nombre completo | Sí |
| DPI | No |
| Teléfono | No |
| Abogado defensor | No |
| Rol | No |

### 3.7 Modal subir documento

| Aspecto | Detalle |
|---|---|
| Endpoint upload | `POST /api/documentos/upload` |
| Endpoint listar | `GET /api/expedientes/{id}/documentos` |
| Endpoint eliminar | `DELETE /api/documentos/{id}` |
| Componente | `<app-modal>` (componente compartido) |

**Formulario**: Input de archivo con tipos permitidos (PDF, Word, JPG, PNG, TXT). Máximo 50 MB.

### 3.8 Eliminar registros

| Entidad | Endpoint | Confirmación |
|---|---|---|
| Nota | `DELETE /api/expedientes/notas/{notaId}` | `confirm()` del navegador |
| Parte procesal | `DELETE /api/expedientes/partes/{parteId}` | `confirm()` del navegador |
| Documento | `DELETE /api/documentos/{id}` | `confirm()` del navegador |

---

## 4. Verificación en la base de datos

### 4.1 Tablas involucradas

#### `EXPEDIENTE`

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
    FechaCierre DATE NULL,
    Usuario_ID INT NOT NULL,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NULL,
    CONSTRAINT FK_EXPEDIENTE_CLIENTE FOREIGN KEY (Cliente_ID) REFERENCES CLIENTE(ID)
);
```

#### `PARTE_PROCESAL`

```sql
CREATE TABLE PARTE_PROCESAL (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Expediente_ID INT NOT NULL,
    Tipo NVARCHAR(20) NOT NULL,
    NombreCompleto NVARCHAR(100) NOT NULL,
    DPI NVARCHAR(20) NULL,
    Telefono NVARCHAR(20) NULL,
    AbogadoDefensor NVARCHAR(100) NULL,
    Rol NVARCHAR(50) NULL,
    Descripcion NVARCHAR(200) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PARTE_EXPEDIENTE FOREIGN KEY (Expediente_ID) REFERENCES EXPEDIENTE(ID)
);
```

#### `NOTA_EXPEDIENTE`

```sql
CREATE TABLE NOTA_EXPEDIENTE (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Expediente_ID INT NOT NULL,
    Contenido NVARCHAR(MAX) NOT NULL,
    Etiqueta_ID INT NULL,
    Fijado BIT NOT NULL DEFAULT 0,
    Prioritario BIT NOT NULL DEFAULT 0,
    Usuario_ID INT NOT NULL,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NULL,
    CONSTRAINT FK_NOTA_EXPEDIENTE FOREIGN KEY (Expediente_ID) REFERENCES EXPEDIENTE(ID)
);
```

#### `DOC_EXPEDIENTE`

```sql
CREATE TABLE DOC_EXPEDIENTE (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Expediente_ID INT NOT NULL,
    NombreArchivo NVARCHAR(200) NOT NULL,
    RutaArchivo NVARCHAR(500) NOT NULL,
    TipoArchivo NVARCHAR(20) NOT NULL,
    Tamano BIGINT NULL,
    Descripcion NVARCHAR(200) NULL,
    Usuario_ID INT NOT NULL,
    FechaSubida DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_DOC_EXPEDIENTE FOREIGN KEY (Expediente_ID) REFERENCES EXPEDIENTE(ID)
);
```

### 4.2 Procedimientos almacenados del módulo

#### SPs originales (`LexControlDB.sql`)

| SP | Parámetros | Return | Descripción |
|---|---|---|---|
| `SP_Expediente_Insertar` | `@Cliente_ID`, `@Rol_Procesal_ID`, `@NoExpediente`, `@Rama_ID`, `@TipoProceso`, `@Juzgado_ID`, `@FechaIngreso`, `@Estado_ID`, `@Descripcion`, `@NotasInternas`, `@Usuario_ID` | OUTPUT `@NuevoExpedienteID` | Crea expediente |
| `SP_Expediente_ObtenerPorID` | `@ID` | SELECT fila | Detalle con joins |
| `SP_Expediente_Actualizar` | `@ID`, campos opcionales | RETURN 0 / -1 | Actualización parcial (ISNULL) |
| `SP_Expediente_Eliminar` | `@ID` | RETURN 0 / -1 | Verifica dependencias y elimina |
| `SP_Expediente_CambiarEstado` | `@ID`, `@NuevoEstado_ID` | RETURN 0 / -1 | Cambio de estado |
| `SP_NotaExpediente_Insertar` | `@Expediente_ID`, `@Contenido`, `@Etiqueta_ID`, `@Fijado`, `@Prioritario`, `@Usuario_ID` | OUTPUT `@NuevaNotaID` | Crea nota |
| `SP_DocExpediente_Insertar` | `@Expediente_ID`, `@NombreArchivo`, `@RutaArchivo`, `@TipoArchivo`, `@Tamano`, `@Descripcion`, `@Usuario_ID` | OUTPUT `@NuevoDocID` | Registra documento |

#### SPs nuevos (`Expedientes_SP.sql`)

| SP | Parámetros | Return | Descripción |
|---|---|---|---|
| `SP_Expediente_ListarPaginado` | `@Rama_ID`, `@Estado_ID`, `@Cliente_ID`, `@Usuario_ID`, `@NoExpediente`, `@Pagina`, `@TamanioPagina` | SELECT filas + `@TotalRegistros OUTPUT` | Listado paginado con joins |
| `SP_ParteProcesal_Insertar` | `@Expediente_ID`, `@Tipo`, `@NombreCompleto`, `@DPI`, `@Telefono`, `@AbogadoDefensor`, `@Rol`, `@Descripcion` | OUTPUT `@NuevaParteID` | Crea parte procesal |
| `SP_ParteProcesal_ObtenerPorExpediente` | `@Expediente_ID` | SELECT lista | Partes activas del expediente |
| `SP_ParteProcesal_Actualizar` | `@ID`, campos opcionales | RETURN 0 / -1 | Actualización parcial |
| `SP_ParteProcesal_Eliminar` | `@ID` | RETURN 0 / -1 | Borrado lógico (Activo = 0) |
| `SP_NotaExpediente_ObtenerPorExpediente` | `@Expediente_ID` | SELECT lista | Notas con joins de etiqueta y usuario |
| `SP_NotaExpediente_Actualizar` | `@ID`, campos opcionales | RETURN 0 / -1 | Actualización parcial |
| `SP_NotaExpediente_Eliminar` | `@ID` | RETURN 0 / -1 | DELETE físico (cascade FK) |
| `SP_DocExpediente_ObtenerPorExpediente` | `@Expediente_ID` | SELECT lista | Documentos con joins |
| `SP_DocExpediente_Eliminar` | `@ID` | RETURN 0 / -1 | DELETE físico |

### 4.3 Verificación de datos

```sql
-- Contar expedientes
SELECT COUNT(*) FROM EXPEDIENTE;

-- Verificar SP de listado paginado
EXEC SP_Expediente_ListarPaginado @Pagina = 1, @TamanioPagina = 5;

-- Ver partes de un expediente
EXEC SP_ParteProcesal_ObtenerPorExpediente @Expediente_ID = 10;

-- Ver notas de un expediente
EXEC SP_NotaExpediente_ObtenerPorExpediente @Expediente_ID = 10;

-- Ver documentos de un expediente
EXEC SP_DocExpediente_ObtenerPorExpediente @Expediente_ID = 10;
```

---

## 5. Explicación técnica

### 5.1 Arquitectura del módulo

```
┌─────────────────────────────────────────────────────────┐
│           Frontend (Angular 20 Standalone)               │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ Expedientes  │  │  Expediente    │  │ Expediente  │  │
│  │    Page      │  │  Detalle Page  │  │   Modal     │  │
│  │  (listado)   │  │ (2 columnas)   │  │ (crear/edit)│  │
│  └──────┬───────┘  └───────┬────────┘  └──────┬──────┘  │
│         │                  │                   │          │
│  ┌──────▼──────────────────▼───────────────────▼──────┐  │
│  │  ExpedientesService + DocumentosService            │  │
│  │  (13 + 4 métodos HTTP)                             │  │
│  └────────────────────┬───────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│         Backend (.NET 10 / ASP.NET Core)                 │
│  ┌──────────────────────┐  ┌─────────────────────────┐   │
│  │ ExpedientesController│──│ ExpedienteService       │   │
│  │ (14 endpoints)       │  │ (13 métodos)            │   │
│  ├──────────────────────┤  ├─────────────────────────┤   │
│  │ DocumentosController │──│ FileStorageService      │   │
│  │ (3 endpoints)        │  │ (disco local)           │   │
│  └──────────┬───────────┘  └──────────┬──────────────┘   │
│             │                          │                  │
│  ┌──────────▼──────────────────────────▼──────────────┐  │
│  │           Data Layer (Dapper)                       │  │
│  │  IRepositorio → ConsultarLista, ConsultarPrimero    │  │
│  │                EjecutarRetorno, Insertar             │  │
│  └──────────────────────┬─────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │ Stored Procedures
┌─────────────────────────▼────────────────────────────────┐
│                 DBLexControl (SQL Server)                 │
│  EXPEDIENTE → CLIENTE (FK)                               │
│  PARTE_PROCESAL → EXPEDIENTE (FK, CASCADE)               │
│  NOTA_EXPEDIENTE → EXPEDIENTE (FK, CASCADE)              │
│  DOC_EXPEDIENTE → EXPEDIENTE (FK, CASCADE)               │
│  16 SPs de expedientes distribuidos en 2 archivos SQL     │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Backend — Controladores, servicios y DTOs

#### `ExpedientesController.cs` — `api/expedientes`

| Método | Endpoint | Autorización | Descripción |
|---|---|---|---|
| GET | `/` | Autenticado | Listado paginado con filtros |
| GET | `/{id}` | Autenticado | Detalle completo |
| POST | `/` | Admin, Abogado | Crear expediente |
| PUT | `/{id}` | Admin, Abogado | Actualizar expediente |
| PUT | `/{id}/estado` | Admin, Abogado | Cambiar estado |
| DELETE | `/{id}` | Solo Admin | Eliminar expediente |
| GET | `/{id}/partes` | Autenticado | Listar partes procesales |
| POST | `/{id}/partes` | Admin, Abogado, Secretaria | Crear parte procesal |
| PUT | `/partes/{parteId}` | Admin, Abogado, Secretaria | Actualizar parte |
| DELETE | `/partes/{parteId}` | Admin, Abogado | Eliminar parte |
| GET | `/{id}/notas` | Autenticado | Listar notas |
| POST | `/{id}/notas` | Admin, Abogado, Secretaria | Crear nota |
| PUT | `/notas/{notaId}` | Admin, Abogado, Secretaria | Actualizar nota |
| DELETE | `/notas/{notaId}` | Admin, Abogado | Eliminar nota |

#### `DocumentosController.cs` — `api/documentos`

| Método | Endpoint | Autorización | Descripción |
|---|---|---|---|
| POST | `/upload` | Admin, Abogado, Secretaria | Subir archivo (multipart) |
| GET | `/download/{ruta}` | Autenticado | Descargar archivo |
| DELETE | `/{id}` | Admin, Abogado | Eliminar archivo |

**Upload - Detalles**:
- Accepta `multipart/form-data` con campo `file` (IFormFile)
- Tipos permitidos: `.pdf, .doc, .docx, .jpg, .jpeg, .png, .txt`
- Límite: 50 MB
- **Validación por magic bytes**: lee los primeros 8 bytes del archivo y verifica que coincidan con la extensión declarada (clase `MagicBytes` en `FileStorageService.cs`)
- Almacena en `wwwroot/documentos/{expedienteId}/` con nombre único (fecha + extensión)

#### `ExpedienteService.cs` — Lógica de negocio

| Método | SP | Descripción |
|---|---|---|
| `ListarAsync` | `SP_Expediente_ListarPaginado` | Retorna (lista, total) con DynamicParameters |
| `ObtenerPorIdAsync` | `SP_Expediente_ObtenerPorID` | Detalle completo con joins |
| `CrearAsync` | `SP_Expediente_Insertar` | Retorna nuevo ID |
| `ActualizarAsync` | `SP_Expediente_Actualizar` | Actualización parcial |
| `CambiarEstadoAsync` | `SP_Expediente_CambiarEstado` | Cambio de estado |
| `EliminarAsync` | `SP_Expediente_Eliminar` | Verifica dependencias |
| `ListarPartesAsync` | `SP_ParteProcesal_ObtenerPorExpediente` | Lista de partes activas |
| `CrearParteAsync` | `SP_ParteProcesal_Insertar` | Nueva parte procesal |
| `EliminarParteAsync` | `SP_ParteProcesal_Eliminar` | Borrado lógico |
| `ListarNotasAsync` | `SP_NotaExpediente_ObtenerPorExpediente` | Lista de notas |
| `CrearNotaAsync` | `SP_NotaExpediente_Insertar` | Nueva nota |
| `ActualizarNotaAsync` | `SP_NotaExpediente_Actualizar` | Actualización parcial |
| `EliminarNotaAsync` | `SP_NotaExpediente_Eliminar` | DELETE físico |

#### DTOs de salida

**ExpedienteDto** (listado):
```csharp
{
  Id, NoExpediente, Cliente, ClienteId, RolProcesalId, RolProcesal,
  RamaId, Rama, RamaColor, TipoProceso, JuzgadoId, Juzgado,
  FechaIngreso, EstadoId, Estado, EstadoColor, Descripcion,
  NotasInternas, AbogadoId, Abogado, FechaCreacion, FechaModificacion
}
```

**ExpedienteDetalleDto** (detalle):
```csharp
{
  Id, NoExpediente, ClienteId, ClienteNombre, RolProcesalId, RolProcesal,
  RamaId, RamaNombre, RamaColor, TipoProceso, JuzgadoId, JuzgadoNombre,
  FechaIngreso, EstadoId, EstadoNombre, EstadoColor, Descripcion,
  NotasInternas, FechaCierre, AbogadoId, AbogadoNombre,
  FechaCreacion, FechaModificacion
}
```

**ParteProcesalDto**:
```csharp
{
  Id, ExpedienteId, Tipo, NombreCompleto, DPI, Telefono,
  AbogadoDefensor, Rol, Descripcion, FechaCreacion
}
```

**NotaExpedienteDto**:
```csharp
{
  Id, ExpedienteId, Contenido, EtiquetaId, EtiquetaNombre, EtiquetaColor,
  Fijado, Prioritario, UsuarioId, UsuarioNombre,
  FechaCreacion, FechaModificacion
}
```

**DocExpedienteDto**:
```csharp
{
  Id, ExpedienteId, NombreArchivo, RutaArchivo, TipoArchivo,
  Tamano, Descripcion, UsuarioId, UsuarioNombre, FechaSubida
}
```

**DocumentoUploadDto** (respuesta upload):
```csharp
{
  Id, NombreArchivo, RutaArchivo, TipoArchivo, Tamano, Descripcion, FechaSubida
}
```

#### DTOs de entrada

**ExpedienteCrearDto** (campos requeridos):
```csharp
{
  ClienteId: int       [Required]
  RolProcesalId: int   [Required]
  NoExpediente: string [Required, MaxLength(50)]
  RamaId: int          [Required]
  JuzgadoId: int       [Required]
  EstadoId: int        [Required]
  AbogadoId: int       [Required]
  TipoProceso: string? [MaxLength(50)]
  FechaIngreso: DateTime?
  Descripcion: string? [MaxLength(500)]
  NotasInternas: string? [MaxLength(1000)]
}
```

**ExpedienteActualizarDto** (todos opcionales):
```csharp
{
  ClienteId: int?
  RolProcesalId: int?
  RamaId: int?
  JuzgadoId: int?
  EstadoId: int?
  TipoProceso: string? [MaxLength(50)]
  Descripcion: string? [MaxLength(500)]
  NotasInternas: string? [MaxLength(1000)]
  FechaCierre: DateTime?
}
```

**ExpedienteEstadoDto**:
```csharp
{
  NuevoEstadoId: int  [Required]
  FechaCierre: DateTime?
}
```

**ParteProcesalCrearDto**:
```csharp
{
  Tipo: string          [Required, MaxLength(20)]
  NombreCompleto: string [Required, MaxLength(100)]
  DPI: string?          [MaxLength(20)]
  Telefono: string?     [MaxLength(20)]
  AbogadoDefensor: string? [MaxLength(100)]
  Rol: string?          [MaxLength(50)]
  Descripcion: string?  [MaxLength(200)]
}
```

**NotaExpedienteCrearDto**:
```csharp
{
  Contenido: string  [Required]
  EtiquetaId: int?
  Fijado: bool
  Prioritario: bool
}
```

### 5.3 Frontend — Modelos, servicios y componentes

#### Modelo TypeScript (`expediente.model.ts`)

```typescript
interface ExpedienteLista {
  id: number;
  noExpediente: string;
  cliente: string;
  clienteId: number;
  rolProcesalId: number;
  rolProcesal: string;
  ramaId: number;
  rama: string;
  ramaColor: string | null;
  tipoProceso: string | null;
  juzgadoId: number;
  juzgado: string;
  fechaIngreso: string | null;
  estadoId: number;
  estado: string;
  estadoColor: string | null;
  descripcion: string | null;
  notasInternas: string | null;
  abogadoId: number;
  abogado: string;
  fechaCreacion: string | null;
  fechaModificacion: string | null;
}

interface ExpedienteDetalle { /* campos con Nombre en lugar de IDs de catálogo */ }
interface ParteProcesal { id, expedienteId, tipo, nombreCompleto, dpi, telefono, abogadoDefensor, rol, descripcion }
interface NotaExpediente { id, expedienteId, contenido, etiquetaId, etiquetaNombre, etiquetaColor, fijado, prioritario }
interface DocExpediente { id, expedienteId, nombreArchivo, rutaArchivo, tipoArchivo, tamano, descripcion }
interface DocumentoUploadResponse { id, nombreArchivo, rutaArchivo, tipoArchivo, tamano, descripcion, fechaSubida }
interface ExpedienteCrearDto { /* campos requeridos */ }
interface ExpedienteActualizarDto { /* campos opcionales */ }
interface ExpedienteEstadoDto { nuevoEstadoId, fechaCierre }
interface ParteProcesalCrearDto { tipo, nombreCompleto, dpi, telefono, abogadoDefensor, rol, descripcion }
interface NotaExpedienteCrearDto { contenido, etiquetaId, fijado, prioritario }
interface NotaExpedienteActualizarDto { contenido, etiquetaId, fijado, prioritario }
interface ExpedienteFiltros { ramaId, estadoId, clienteId, abogadoId, noExpediente, pagina, tamanioPagina }
```

#### Servicio HTTP (`expedientes-service.ts`)

| Método | HTTP | Endpoint | Retorna |
|---|---|---|---|
| `listar(filtros)` | GET | `/api/expedientes?...` | `{ expedientes, total }` |
| `obtenerPorId(id)` | GET | `/api/expedientes/{id}` | `ExpedienteDetalle` |
| `crear(dto)` | POST | `/api/expedientes` | `ExpedienteDetalle` |
| `actualizar(id, dto)` | PUT | `/api/expedientes/{id}` | `void` |
| `cambiarEstado(id, dto)` | PUT | `/api/expedientes/{id}/estado` | `void` |
| `eliminar(id)` | DELETE | `/api/expedientes/{id}` | `void` |
| `listarPartes(expId)` | GET | `/api/expedientes/{id}/partes` | `ParteProcesal[]` |
| `crearParte(expId, dto)` | POST | `/api/expedientes/{id}/partes` | `ParteProcesal` |
| `eliminarParte(parteId)` | DELETE | `/api/expedientes/partes/{id}` | `void` |
| `listarNotas(expId)` | GET | `/api/expedientes/{id}/notas` | `NotaExpediente[]` |
| `crearNota(expId, dto)` | POST | `/api/expedientes/{id}/notas` | `NotaExpediente` |
| `actualizarNota(notaId, dto)` | PUT | `/api/expedientes/notas/{id}` | `void` |
| `eliminarNota(notaId)` | DELETE | `/api/expedientes/notas/{id}` | `void` |

#### Servicio HTTP (`documentos-service.ts`)

| Método | HTTP | Endpoint | Retorna |
|---|---|---|---|
| `listar(expId)` | GET | `/api/expedientes/{id}/documentos` | `DocExpediente[]` |
| `subir(expId, archivo, desc)` | POST | `/api/documentos/upload` | `DocumentoUploadResponse` |
| `descargar(ruta)` | — | URL directa | `string` (URL) |
| `eliminar(docId)` | DELETE | `/api/documentos/{id}` | `void` |

#### Router (`app.routes.ts`)

| Ruta | Componente | Guard |
|---|---|---|
| `/expedientes` | `ExpedientesPage` (lazy) | `moduloGuard('expedientes')` |
| `/expedientes/:id` | `ExpedienteDetallePage` (lazy) | `moduloGuard('expedientes')` |

#### Componentes del módulo

| Componente | Selector | Propósito |
|---|---|---|
| `ExpedientesPage` | `app-expedientes-page` | Listado con filtros, tabla, paginación |
| `ExpedienteDetallePage` | `app-expediente-detalle-page` | Detalle 2 columnas con sub-modales |
| `ExpedienteModal` | `app-expediente-modal` | Modal crear/editar expediente |

#### Componentes compartidos reutilizados

| Componente | Selector | Uso en el módulo |
|---|---|---|
| `PageHeader` | `<app-page-header>` | Encabezado del listado |
| `EmptyState` | `<app-empty-state>` | Tabla y listas vacías |
| `Paginacion` | `<app-paginacion>` | Controles de paginación |
| `Modal` | `<app-modal>` | Sub-modales (nota, parte, upload) |

### 5.4 Helpers de formato

| Función | Descripción | Ejemplo |
|---|---|---|
| `formatearFecha(iso)` | Fecha ISO a formato legible | "2026-08-12" → "12 Ago 2026" |
| `formatearTamano(bytes)` | Tamaño en bytes a texto legible | 1536 → "1.5 KB" |
| `tipoIcono(tipo)` | Tipo de archivo a clase CSS | "PDF" → "pdf", "DOCX" → "word" |

### 5.5 Almacenamiento de archivos

| Aspecto | Detalle |
|---|---|
| Servicio | `FileStorageService.cs` (implementa `IFileStorageService`) |
| Base path | `wwwroot/documentos/` (configurable en `appsettings.json` → `FileStorage:BasePath`) |
| Estructura | `{expedienteId}/{nombre}_{fecha}.{extension}` |
| Nombre único | GUID temporal antes de la extensión |
| Límite | 50 MB (configurado en `ConfigureKestrel`) |
| Tipos | `.pdf, .doc, .docx, .jpg, .jpeg, .png, .txt` |

---

## 6. DTOs resumen (contrato frontend ↔ backend)

### Listado de expedientes

```
GET /api/expedientes?ramaId=1&pagina=1&tamanioPagina=7

200 → {
  success: true,
  data: [
    {
      id: 10,
      noExpediente: "CIV-2026-0001",
      cliente: "Carlos Morales Ortiz",
      clienteId: 1,
      rama: "Civil",
      ramaColor: "#358292",
      estado: "Activo",
      estadoColor: "#358292",
      juzgado: "Juzgado de Primera Instancia Civil de Sololá",
      abogado: "Lic. Diego Matzar",
      fechaIngreso: "2026-01-15"
    },
    ...
  ]
}
Headers: X-Total-Count: 15
```

### Detalle del expediente

```
GET /api/expedientes/10

200 → {
  success: true,
  data: {
    id: 10,
    noExpediente: "CIV-2026-0001",
    clienteNombre: "Carlos Morales Ortiz",
    ramaNombre: "Civil",
    ramaColor: "#358292",
    rolProcesal: "Demandante",
    tipoProceso: "Incumplimiento Contractual",
    juzgadoNombre: "Juzgado de Primera Instancia Civil de Sololá",
    estadoNombre: "Activo",
    estadoColor: "#358292",
    abogadoNombre: "Lic. Diego Matzar",
    descripcion: "Demanda por incumplimiento de contrato.",
    fechaIngreso: "2026-01-15"
  }
}
```

### Crear expediente

```
POST /api/expedientes
{
  noExpediente: "CIV-2026-0046",
  clienteId: 1,
  rolProcesalId: 1,
  ramaId: 1,
  juzgadoId: 1,
  estadoId: 1,
  abogadoId: 1,
  tipoProceso: "Incumplimiento Contractual"
}

201 → { success: true, data: ExpedienteDetalleDto }
```

### Editar expediente

```
PUT /api/expedientes/10
{
  tipoProceso: "Incumplimiento Contractual - Ampliado",
  descripcion: "Descripcion actualizada del caso."
}

200 OK
```

### Subir documento

```
POST /api/documentos/upload
Content-Type: multipart/form-data
  file: (archivo)
  expedienteId: 10
  descripcion: "Demanda inicial"

201 → {
  id: 3,
  nombreArchivo: "Demanda_Inicial.pdf",
  rutaArchivo: "10/Demanda_Inicial_20260901.pdf",
  tipoArchivo: "PDF",
  tamano: 2457600
}
```

---

## 7. Consideraciones y limitaciones

### 7.1 Bug conocido — `@TotalRegistros OUTPUT`

`SP_Expediente_ListarPaginado` requiere `@TotalRegistros OUTPUT` pero el servicio usaba anonymous objects que no soportan parámetros OUTPUT. Solucionado usando `DynamicParameters` con `ParameterDirection.Output` en `ListarAsync` y `ObtenerExpedienteListadoAsync`.

### 7.2 Codificación SQL

`Expedientes_SP.sql` está en **UTF-8 con BOM** (diferente a `Proceso_almacenados.sql` que usa Windows-1252). Al editar, conservar la codificación para no corromper caracteres especiales.

### 7.3 Almacenamiento de archivos

Los archivos se guardan en `wwwroot/documentos/` que es un directorio dentro del proyecto backend. En producción, se recomienda usar un servicio de almacenamiento en la nube (Azure Blob, S3) y configurar `FileStorage:BasePath` en `appsettings.json`.

### 7.4 Hash de contraseña

El seed usa SHA256 sin salt. El backend replica esta funcionalidad para compatibilidad. Se recomienda migrar a BCrypt/PBKDF2 en el futuro.

### 7.5 Audiencias y trámites

Los SPs para audiencias (`SP_Audiencia_*`) y trámites (`SP_Tramite_*`) ya existen en la BD pero no están implementados en el frontend. El módulo de expedientes los tiene como "Próximamente".

### 7.6 Catálogos hardcodeados

Los selects de ramas, estados, roles procesales y juzgados están hardcodeados en `expediente-modal.ts`. Cuando se implemente `GET /api/catalogos`, se deberían cargar dinámicamente desde el backend.

---

## 8. Medidas de Seguridad — Validación de Archivos Subidos

### 8.1 Problema que resuelve

Un usuario malicioso o un error humano puede renombrar un archivo peligroso (ej. un `.exe` o un `.bat`) con una extensión legítima (`.pdf`, `.docx`) para subirlo al sistema. Si solo se valida la extensión del nombre del archivo, el archivo malicioso pasaría la validación y podría ser ejecutado o causar daño en el servidor.

### 8.2 Solución: Validación por Magic Bytes (File Signature Validation)

Cada tipo de archivo tiene una **firma hexadecimal** en sus primeros bytes (llamada "magic bytes" o "file signature"). El sistema verifica que los primeros bytes del archivo coincidan con la extensión declarada **antes** de escribirlo a disco.

### 8.3 Tipos de archivo permitidos

| Extensión | Tipo de archivo | Magic Bytes (hex) | Descripción |
|---|---|---|---|
| `.pdf` | PDF | `25 50 44 46` | Texto `%PDF` en ASCII |
| `.doc` | Word 97-2003 | `D0 CF 11 E0` | Formato OLE2 (Compound Binary) |
| `.docx` | Word OOXML | `50 4B 03 04` | Formato ZIP (PK header) |
| `.jpg` / `.jpeg` | JPEG | `FF D8 FF` | Imagen JPEG estándar |
| `.png` | PNG | `89 50 4E 47` | Texto `‰PNG` en ASCII |
| `.txt` | Texto plano | Sin magic bytes | Solo se valida por extensión |

**No se permiten**: `.xls`, `.xlsx`, `.exe`, `.bat`, `.sh`, `.js`, `.html`, `.php`, ni ningún otro tipo de archivo.

### 8.4 Validación en 3 capas

| Capa | Ubicación | Qué valida | Quién la controla |
|---|---|---|---|
| **HTML** | `expediente-detalle-page.html` | Atributo `accept` en `<input type="file">` | Navegador (UX, bypasseable) |
| **Frontend** | `expediente-detalle-page.ts` | Extensión + magic bytes antes del HTTP | JavaScript (error inmediato) |
| **Backend** | `FileStorageService.cs` | Extensión + magic bytes antes de escribir a disco | .NET (seguridad obligatoria) |

> **Regla de seguridad**: La validación frontend es UX (evita esperas innecesarias). La validación backend es la **seguridad obligatoria**. Nunca confiar solo en la capa de UI.

### 8.5 Flujo de validación en el backend

```
1. El usuario selecciona un archivo en el input del navegador
2. Frontend: valida extensión contra lista de permitidos
3. Frontend: lee primeros 8 bytes con FileReader y compara magic bytes
4. Si no coincide → muestra toast de error y NO envía al backend
5. Si coincide → envía el archivo al endpoint POST /api/documentos/upload
6. Backend: valida extensión contra tiposPermitidos[]
7. Backend: lee primeros 8 bytes del IFormFile vía OpenReadStream()
8. Backend: llama MagicBytes.Validar(buffer, bytesRead, extension)
9. Si no coincide → lanza ExcepcionNegocio con HTTP 400
10. Si coincide → escribe el archivo a disco y registra en la BD
```

### 8.6 Clase `MagicBytes` (Backend)

Ubicación: `Services/FileStorageService.cs`

```csharp
internal static class MagicBytes
{
    internal static bool Validar(byte[] buffer, int bytesRead, string extension)
    {
        if (bytesRead < 4) return false;
        return extension.ToLowerInvariant() switch
        {
            ".pdf"  => buffer[0] == 0x25 && buffer[1] == 0x50
                      && buffer[2] == 0x44 && buffer[3] == 0x46,
            ".doc"  => buffer[0] == 0xD0 && buffer[1] == 0xCF
                      && buffer[2] == 0x11 && buffer[3] == 0xE0,
            ".docx" => buffer[0] == 0x50 && buffer[1] == 0x4B
                       && buffer[2] == 0x03 && buffer[3] == 0x04,
            ".jpg" or ".jpeg" => bytesRead >= 3
                                 && buffer[0] == 0xFF && buffer[1] == 0xD8
                                 && buffer[2] == 0xFF,
            ".png"  => buffer[0] == 0x89 && buffer[1] == 0x50
                      && buffer[2] == 0x4E && buffer[3] == 0x47,
            ".txt"  => true,
            _       => false
        };
    }
}
```

### 8.7 Validación en el frontend

Ubicación: `features/expedientes/expediente-detalle-page.ts`

```typescript
private validarMagicBytes(buffer: Uint8Array, extension: string): boolean {
    if (buffer.length < 4) return false;
    switch (extension) {
        case '.pdf':
            return buffer[0] === 0x25 && buffer[1] === 0x50
                && buffer[2] === 0x44 && buffer[3] === 0x46;
        case '.doc':
            return buffer[0] === 0xD0 && buffer[1] === 0xCF
                && buffer[2] === 0x11 && buffer[3] === 0xE0;
        case '.docx':
            return buffer[0] === 0x50 && buffer[1] === 0x4B
                && buffer[2] === 0x03 && buffer[3] === 0x04;
        case '.jpg':
        case '.jpeg':
            return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        case '.png':
            return buffer[0] === 0x89 && buffer[1] === 0x50
                && buffer[2] === 0x4E && buffer[3] === 0x47;
        case '.txt':
            return true;
        default:
            return false;
    }
}
```

### 8.8 Mensajes de error

| Capa | Condición | Mensaje |
|---|---|---|
| Backend | Extensión no permitida | `Tipo de archivo no permitido: {ext}. Tipos permitidos: .pdf, .doc, .docx, .jpg, .jpeg, .png, .txt` |
| Backend | Magic bytes no coinciden | `El contenido del archivo no coincide con la extension {ext} indicada.` |
| Frontend | Extensión no permitida | `Tipo de archivo no permitido. Solo se aceptan PDF, Word, JPG, PNG y TXT.` |
| Frontend | Magic bytes no coinciden | `El contenido del archivo no coincide con la extension {ext} indicada.` |

### 8.9 Ejemplo de ataque mitigado

```
1. Usuario renombra virus.exe → virus.pdf
2. Frontend: extensión ".pdf" pasa la primera validación
3. Frontend: lee primeros bytes → 4D 5A 90 00 (MZ header de EXE)
4. Frontend: magic bytes NO coinciden con firma PDF (25 50 44 46)
5. Resultado: toast de error "El contenido del archivo no coincide..."
6. El archivo NUNCA llega al backend
```

### 8.10 Archivos involucrados

| Archivo | Capa | Cambios realizados |
|---|---|---|
| `DocumentosController.cs` | Backend | `tiposPermitidos` reducido a 7 tipos (sin Excel); `ObtenerContentType` limpiado |
| `FileStorageService.cs` | Backend | Clase `MagicBytes` agregada; `MimeToExtension` y `ObtenerTipoArchivo` limpiados; llamada a validación en `GuardarAsync()` |
| `expediente-detalle-page.html` | Frontend | `accept` actualizado; texto de ayuda actualizado |
| `expediente-detalle-page.ts` | Frontend | `ToastService` inyectado; `alSubirArchivo()` con validación; nuevo método `validarMagicBytes()` |
