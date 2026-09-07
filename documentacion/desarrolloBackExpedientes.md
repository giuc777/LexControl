# Desarrollo Backend - Modulo de Expedientes

> Documentacion del desarrollo del modulo **Expedientes** en el backend (`LexControlApi`, .NET 10). Cubre SPs, DTOs, servicio, controlador y pruebas realizadas.
>
> **Fecha de implementacion**: 01 de septiembre de 2026

---

## 1. Archivos creados/modificados

| Archivo | Accion | Descripcion |
|---|---|---|
| `Expedientes_SP.sql` | **Nuevo** | 9 procedimientos almacenados nuevos (listado paginado + partes, notas, documentos) |
| `Dtos/Expedientes/ExpedienteDtos.cs` | **Nuevo** | 10 clases DTO + 4 filas Dapper para el contrato frontend-backend |
| `Services/ExpedienteService.cs` | **Nuevo** | Interface + implementacion con 13 metodos |
| `Controllers/ExpedientesController.cs` | **Nuevo** | 14 endpoints REST |
| `Program.cs` | **Modificado** | Registro de `IExpedienteService` en DI (linea 105) |

---

## 2. Procedimientos almacenados

### 2.1 SPs nuevos (Expedientes_SP.sql)

| SP | Operacion | Parametros | Retorna |
|---|---|---|---|
| `SP_Expediente_ListarPaginado` | SELECT paginado con filtros + COUNT | `@Cliente_ID`, `@Estado_ID`, `@Rama_ID`, `@Usuario_ID`, `@FechaInicio`, `@FechaFin`, `@NoExpediente`, `@Pagina`, `@TamanioPagina`, `@TotalRegistros OUTPUT` | Filas + Total |
| `SP_ParteProcesal_Insertar` | INSERT | `@Expediente_ID`, `@Tipo`, `@NombreCompleto`, `@DPI`, `@Telefono`, `@AbogadoDefensor`, `@Rol`, `@Descripcion`, `@NuevoID OUTPUT` | RETURN 0 / ID |
| `SP_ParteProcesal_ObtenerPorExpediente` | SELECT por expediente | `@Expediente_ID` | Filas de partes activas |
| `SP_ParteProcesal_Actualizar` | UPDATE (ISNULL para parametros NULL) | `@ID`, campos opcionales | RETURN 0 / -1 |
| `SP_ParteProcesal_Eliminar` | Borrado logico (Activo=0) | `@ID` | RETURN 0 / -1 |
| `SP_NotaExpediente_Actualizar` | UPDATE contenido, etiqueta, fijado, prioridad | `@ID`, campos opcionales | RETURN 0 / -1 |
| `SP_NotaExpediente_Eliminar` | DELETE fisico (cascade FK) | `@ID` | RETURN 0 / -1 |
| `SP_DocExpediente_ObtenerPorExpediente` | SELECT con join de usuario | `@Expediente_ID` | Filas de documentos |
| `SP_DocExpediente_Eliminar` | DELETE fisico (cascade FK) | `@ID` | RETURN 0 / -1 |

### 2.2 SPs existentes utilizados (LexControlDB.sql)

| SP | Operacion |
|---|---|
| `SP_Expediente_Insertar` | CREATE (con transaccion implicita) |
| `SP_Expediente_ObtenerPorID` | READ by ID (con joins de catalogos) |
| `SP_Expediente_Actualizar` | UPDATE (ISNULL para preservar valores actuales) |
| `SP_Expediente_CambiarEstado` | Cambio de estado con FechaCierre |
| `SP_Expediente_Eliminar` | Verifica dependencias (audiencias, tramites, diligencias) |
| `SP_NotaExpediente_Insertar` | CREATE nota de expediente |
| `SP_DocExpediente_Insertar` | CREATE documento de expediente |

### 2.3 Nota sobre `@TotalRegistros OUTPUT`

El SP `SP_Expediente_ListarPaginado` usa `@TotalRegistros INT OUTPUT` para devolver el total de registros que cumplen los filtros. Esto es necesario para la paginacion del frontend (`X-Total-Count`). El servicio usa `DynamicParameters` de Dapper para declarar este parametro como OUTPUT antes de ejecutar el SP.

---

## 3. DTOs (Dtos/Expedientes/ExpedienteDtos.cs)

### 3.1 Filas de mapeo Dapper

```csharp
public class ExpedienteFila          // Mapeo de SP_Expediente_ListarPaginado
public class ExpedienteDetalleFila   // Mapeo de SP_Expediente_ObtenerPorID
public class ParteProcesalFila       // Mapeo de SP_ParteProcesal_ObtenerPorExpediente
public class NotaExpedienteFila      // Mapeo de SP_NotaExpediente_ObtenerPorExpediente
public class DocExpedienteFila       // Mapeo de SP_DocExpediente_ObtenerPorExpediente
```

### 3.2 DTOs de respuesta

```csharp
public class ExpedienteDto           // Listado (con TotalRegistros)
public class ExpedienteDetalleDto    // Detalle (sin paginacion)
public class ParteProcesalDto        // Parte procesal
public class NotaExpedienteDto       // Nota de expediente
public class DocExpedienteDto        // Documento de expediente
```

### 3.3 DTOs de entrada

```csharp
public class ExpedienteCrearDto      // POST (ClienteId, RolProcesalId, NoExpediente, etc.)
public class ExpedienteActualizarDto // PUT (todos opcionales)
public class ExpedienteEstadoDto     // PUT /estado (NuevoEstadoId, FechaCierre)
public class ParteProcesalCrearDto   // POST /partes
public class ParteProcesalActualizarDto // PUT /partes/{id}
public class NotaExpedienteCrearDto  // POST /notas
public class NotaExpedienteActualizarDto // PUT /notas/{id}
public class DocExpedienteCrearDto   // POST /documentos
```

### 3.4 Mapeo de fechas

Las fechas se envian como strings ISO:
- `FechaIngreso`: `"yyyy-MM-dd"` o null
- `FechaCierre`: `"yyyy-MM-dd"` o null
- `FechaCreacion`: `"yyyy-MM-ddTHH:mm:ss"`

---

## 4. Servicio (Services/ExpedienteService.cs)

### 4.1 Interface

```csharp
public interface IExpedienteService
{
    // Expediente
    Task<(List<ExpedienteDto> Expedientes, int Total)> ListarAsync(...);
    Task<ExpedienteDetalleDto> ObtenerPorIdAsync(int id);
    Task<ExpedienteDto> CrearAsync(ExpedienteCrearDto datos, int usuarioId);
    Task<ExpedienteDto> ActualizarAsync(int id, ExpedienteActualizarDto datos);
    Task CambiarEstadoAsync(int id, ExpedienteEstadoDto datos);
    Task EliminarAsync(int id, int usuarioId);

    // Partes procesales
    Task<List<ParteProcesalDto>> ObtenerPartesAsync(int expedienteId);
    Task<ParteProcesalDto> CrearParteAsync(int expedienteId, ParteProcesalCrearDto datos);
    Task ActualizarParteAsync(int parteId, ParteProcesalActualizarDto datos);
    Task EliminarParteAsync(int parteId);

    // Notas
    Task<List<NotaExpedienteDto>> ObtenerNotasAsync(int expedienteId);
    Task<NotaExpedienteDto> CrearNotaAsync(int expedienteId, NotaExpedienteCrearDto datos, int usuarioId);
    Task ActualizarNotaAsync(int notaId, NotaExpedienteActualizarDto datos);
    Task EliminarNotaAsync(int notaId);

    // Documentos
    Task<List<DocExpedienteDto>> ObtenerDocumentosAsync(int expedienteId);
    Task<DocExpedienteDto> CrearDocumentoAsync(int expedienteId, DocExpedienteCrearDto datos, int usuarioId);
    Task EliminarDocumentoAsync(int documentoId);
}
```

### 4.2 Metodos implementados

| Metodo | SP utilizado | Logica |
|---|---|---|
| `ListarAsync` | `SP_Expediente_ListarPaginado` | DynamicParameters con @TotalRegistros OUTPUT |
| `ObtenerPorIdAsync` | `SP_Expediente_ObtenerPorID` | Excepcion 404 si no existe |
| `CrearAsync` | `SP_Expediente_Insertar` | InsertarAsync + ObtenerExpedienteListadoAsync |
| `ActualizarAsync` | `SP_Expediente_Actualizar` | EjecutarRetornoAsync + ObtenerExpedienteListadoAsync |
| `CambiarEstadoAsync` | `SP_Expediente_CambiarEstado` | EjecutarRetornoAsync |
| `EliminarAsync` | `SP_Expediente_Eliminar` | Verifica retorno -1 (dependencias pendientes) |
| `CrearParteAsync` | `SP_ParteProcesal_Insertar` | InsertarAsync + ObtenerPartesAsync |
| `CrearNotaAsync` | `SP_NotaExpediente_Insertar` | InsertarAsync + ObtenerNotasAsync |
| `CrearDocumentoAsync` | `SP_DocExpediente_Insertar` | InsertarAsync + ObtenerDocumentosAsync |

### 4.3 Manejo de errores

| Retorno SP | Excepcion | Codigo HTTP |
|---|---|---|
| 0 | Ninguno (exito) | 200/204 |
| -1 | `ExcepcionNegocio` "no encontrado" o "dependencias pendientes" | 404 / 409 |
| 2601 / 2627 | `ExcepcionNegocio` "Ya existe un registro" | 409 |
| Otro | `ExcepcionNegocio` "No se pudo completar la operacion" | 500 |

---

## 5. Controlador (Controllers/ExpedientesController.cs)

### 5.1 Endpoints

| Metodo | Ruta | Auth | Body | Retorna |
|---|---|---|---|---|
| GET | `/api/expedientes` | Token | — | 200 + `X-Total-Count` |
| GET | `/api/expedientes/{id}` | Token | — | 200 / 404 |
| POST | `/api/expedientes` | Admin, Abogado | `ExpedienteCrearDto` | 201 |
| PUT | `/api/expedientes/{id}` | Admin, Abogado | `ExpedienteActualizarDto` | 200 / 404 |
| PUT | `/api/expedientes/{id}/estado` | Admin, Abogado | `ExpedienteEstadoDto` | 204 / 404 |
| DELETE | `/api/expedientes/{id}` | Admin | — | 204 / 409 |
| GET | `/api/expedientes/{id}/partes` | Token | — | 200 |
| POST | `/api/expedientes/{id}/partes` | Admin, Abogado | `ParteProcesalCrearDto` | 201 |
| PUT | `/api/expedientes/partes/{parteId}` | Admin, Abogado | `ParteProcesalActualizarDto` | 204 / 404 |
| DELETE | `/api/expedientes/partes/{parteId}` | Admin, Abogado | — | 204 |
| GET | `/api/expedientes/{id}/notas` | Token | — | 200 |
| POST | `/api/expedientes/{id}/notas` | Admin, Abogado, Secretaria | `NotaExpedienteCrearDto` | 201 |
| PUT | `/api/expedientes/notas/{notaId}` | Admin, Abogado, Secretaria | `NotaExpedienteActualizarDto` | 204 / 404 |
| DELETE | `/api/expedientes/notas/{notaId}` | Admin, Abogado | — | 204 |
| GET | `/api/expedientes/{id}/documentos` | Token | — | 200 |
| POST | `/api/expedientes/{id}/documentos` | Admin, Abogado, Secretaria | `DocExpedienteCrearDto` | 201 |
| DELETE | `/api/expedientes/documentos/{documentoId}` | Admin, Abogado | — | 204 |

### 5.2 Controlador de Documentos (Controllers/DocumentosController.cs)

| Metodo | Ruta | Auth | Body | Retorna |
|---|---|---|---|---|
| POST | `/api/documentos/upload` | Admin, Abogado, Secretaria | multipart/form-data: file, expedienteId, descripcion | 201 |
| GET | `/api/documentos/download/{ruta}` | Admin, Abogado, Secretaria | — | Archivo binario |
| DELETE | `/api/documentos/{id}` | Admin, Abogado | — | 204 |

**Upload - Detalles:**
- Accepta `multipart/form-data` con campo `file` (IFormFile)
- Tipos permitidos: `.pdf, .doc, .docx, .jpg, .jpeg, .png, .txt`
- Limite: 50 MB
- **Validacion por magic bytes**: lee los primeros 8 bytes del archivo y verifica que coincidan con la extension declarada (clase `MagicBytes` en `FileStorageService.cs`)
- Almacena en `wwwroot/documentos/{expedienteId}/` con nombre unico (fecha + extension)
- Registra metadata en `DOC_EXPEDIENTE` via `ExpedienteService.CrearDocumentoAsync`
- Retorna `DocumentoUploadDto` con ID, nombre, ruta, tipo y tamano

**Almacenamiento de archivos:**
- Servicio: `Services/FileStorageService.cs` (implementa `IFileStorageService`)
- Base path configurable en `appsettings.json` → `FileStorage:BasePath`
- Default: `wwwroot/documentos/`
- Estructura: `{expedienteId}/{nombre}_{fecha}.{extension}`

**Magic Bytes validados:**

| Extension | Firma | Bytes |
|---|---|---|
| `.pdf` | %PDF | `25 50 44 46` |
| `.doc` | OLE2 | `D0 CF 11 E0` |
| `.docx` | ZIP/PK | `50 4B 03 04` |
| `.jpg` / `.jpeg` | JPEG | `FF D8 FF` |
| `.png` | PNG | `89 50 4E 47` |
| `.txt` | Sin firma | Solo validacion por extension |

### 5.3 Autorizacion

- **Lectura** (GET): cualquier usuario autenticado
- **Escritura** expedientes (POST, PUT, DELETE): rol `Administrador` o `Abogado`
- **Escritura** notas/documentos: `Administrador`, `Abogado` o `Secretaria`
- **Solo Admin**: DELETE de expedientes
- `[Authorize]` a nivel de controller, `[Authorize(Roles = "...")]` en metodos de escritura

### 5.4 Obtencion del usuario autenticado

Se usa la extension `User.ObtenerUsuarioId()` de `Helpers/ClaimsExtension.cs` que lee el claim `ClaimTypes.NameIdentifier` del JWT.

---

## 6. Registro en Program.cs

```csharp
// Agregado en la seccion de Inyeccion de dependencias (linea 105)
builder.Services.AddScoped<IExpedienteService, ExpedienteService>();
```

---

## 7. Bugs encontrados y corregidos

| # | Bug | Causa | Solucion |
|---|---|---|---|
| 1 | GET/POST retornaban 500 | `SP_Expediente_ListarPaginado` requiere `@TotalRegistros OUTPUT` pero el servicio pasaba un anonymous object sin declararlo como OUTPUT | Cambiar `ListarAsync` y `ObtenerExpedienteListadoAsync` para usar `DynamicParameters` con el parametro OUTPUT |
| 2 | POST crear retornaba 500 | Los nombres de parametros no coincidian con el SP (`RolProcesalId` vs `Rol_Procesal_ID`, `JuzgadoId` vs `Juzgado_ID`) | Renombrar propiedades del anonymous object para coincidir con los nombres exactos del SP |
| 3 | POST crear retornaba "Error de conexion con la base de datos" | `ObtenerUsuarioId()` buscaba claim `"Usuario_ID"` que no existe en el JWT (el claim real es `ClaimTypes.NameIdentifier`) | Reemplazar metodo privado por la extension `User.ObtenerUsuarioId()` de `ClaimsExtension.cs` |

---

## 8. Pruebas realizadas

Todas las pruebas se ejecutaron con PowerShell contra `http://localhost:5181`.

### 8.1 Resultados

| # | Endpoint | Metodo | Resultado |
|---|---|---|---|
| 1 | `POST /api/auth/login` | Login admin | OK Token JWT |
| 2 | `GET /api/expedientes` | Listar (vacio) | OK Array vacio, Total: 0 |
| 3 | `POST /api/expedientes` | Crear "CIV-2026-0001" | OK ID 10, 201 Created |
| 4 | `GET /api/expedientes` | Listar (1 expediente) | OK Total: 1 |
| 5 | `GET /api/expedientes/10` | Obtener por ID | OK Detalle completo |
| 6 | `PUT /api/expedientes/10` | Actualizar datos | OK TipoProceso modificado |
| 7 | `PUT /api/expedientes/10/estado` | Cambiar a En Espera | OK 204 No Content |
| 8 | `POST /api/expedientes/10/notas` | Crear nota | OK ID 2, 201 Created |
| 9 | `GET /api/expedientes/10/notas` | Listar notas | OK Count: 1 |
| 10 | `POST /api/expedientes/10/partes` | Crear parte procesal | OK ID 1, 201 Created |
| 11 | `GET /api/expedientes/10/partes` | Listar partes | OK Count: 1 |
| 12 | `GET /api/expedientes?estadoId=2` | Filtrar por estado | OK 1 expediente |
| 13 | `GET /api/expedientes/999` | Obtener inexistente | OK 404 Not Found |
| 14 | `PUT /api/expedientes/notas/2` | Actualizar nota | OK 204, contenido modificado |
| 15 | `POST /api/expedientes/10/documentos` | Crear documento | OK ID 1, 201 Created |
| 16 | `GET /api/expedientes/10/documentos` | Listar documentos | OK Count: 1 |
| 17 | `DELETE /api/expedientes/notas/2` | Eliminar nota | OK 204, count: 0 |
| 18 | `POST /api/expedientes` | Crear segundo expediente | OK ID 11, 201 Created |
| 19 | `GET /api/expedientes?pagina=1&tamanioPagina=1` | Paginacion | OK Total: 2 |
| 20 | `GET /api/expedientes?ramaId=1` | Filtrar por rama | OK 1 expediente |
| 21 | `GET /api/expedientes?noExpediente=PEN` | Filtrar por numero | OK 1 expediente |
| 22 | `DELETE /api/expedientes/11` | Eliminar expediente | OK 204, Total: 1 |
| 23 | `POST /api/expedientes/10/notas` | Crear nota temporal | OK ID 3 |
| 24 | `DELETE /api/expedientes/notas/3` | Eliminar nota temporal | OK 204 |

### 8.2 Scripts SQL ejecutados

1. `Expedientes_SP.sql` — 9 SPs nuevos (ListarPaginado, ParteProcesal CRUD, NotaExpediente Act/Elim, DocExpediente Listar/Elim)
2. `LexControlDB.sql` — 7 SPs existentes (Expediente CRUD, NotaExpediente Insertar, DocExpediente Insertar)

### 8.3 Issues encontrados y resueltos

| Issue | Causa | Solucion |
|---|---|---|
| GET/POST retornaban 500 | SP requiere @TotalRegistros OUTPUT | Usar DynamicParameters con parametro OUTPUT |
| POST crear retornaba 500 | Nombres de parametros no coincidian | Renombrar para coincidir con el SP |
| POST crear retornaba 500 (FK violation) | ObtenerUsuarioId() buscaba claim inexistente | Usar ClaimsExtension.ObtenerUsuarioId() |
| PUT /estado retornaba 204 pero GET no reflejaba cambio | El SP usa IDs de estado diferentes a los esperados | Verificar IDs de catalogo antes de usar |

---

## 9. Proximos pasos

1. **Frontend**: Crear `expediente.model.ts`, `expedientes.service.ts` y componentes `features/expedientes/`
2. **Seed de datos**: Insertar expedientes de prueba para desarrollo
3. **Audiencias del expediente**: Crear endpoints anidados `GET/POST /api/expedientes/{id}/audiencias`
4. **Tramites del expediente**: Crear endpoints anidados `GET/POST /api/expedientes/{id}/tramites`
5. **Paginacion**: El frontend debe leer el header `X-Total-Count` para renderizar la paginacion
6. **SPs faltantes**: `SP_Permiso_Listar` y `SP_Permiso_GuardarRol` llamados por el backend pero no definidos en la BD
