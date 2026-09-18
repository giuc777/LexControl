# Módulo 05 — Notificaciones OJ

> **Estado:** ✅ COMPLETADO (incluye Actualizar, Verificar duplicado y Adjuntar PDF)
> **Ruta frontend:** `/notificaciones-oj` · `/notificaciones-oj/:id`

---

## 1. Descripción

Gestión de notificaciones del Organismo Judicial. Permite listar, crear, editar, atender
notificaciones, verificar duplicados y adjuntar un documento. Muestra un badge visual "OJ"
en las notificaciones pendientes.

## 2. Base de datos

### Tablas

| Tabla | Descripción |
|---|---|
| `NOTIFICACION_OJ` | Notificación (Expediente_ID, Juzgado_ID, Tipo_ID, Estado_ID, PDF_Ruta, etc.) |
| `TIPO_NOTIFICACION_OJ` | Catálogo de tipos (Resolución, Citación, Emplazamiento) |
| `ESTADO_NOTIFICACION_OJ` | Catálogo de estados (Recibida, Atendida, Pendiente) |
| `DOC_NOTIFICACION` | Documentos asociados (no usado aún; el PDF se guarda en `NOTIFICACION_OJ.PDF_Ruta`) |

### Procedimientos almacenados

| SP | Script | Descripción |
|---|---|---|
| `SP_Notificacion_Listar` | `05-Complementarios.sql` | Listado con filtros |
| `SP_Notificacion_ObtenerPorID` | `05-Complementarios.sql` | Detalle |
| `SP_NotificacionOJ_Insertar` | `00-LexControlDB.sql` | Crear |
| `SP_NotificacionOJ_Actualizar` | `13-NotificacionesOJ-Completar.sql` | Editar |
| `SP_NotificacionOJ_Atender` | `00-LexControlDB.sql` | Marcar como atendida |
| `SP_NotificacionOJ_AdjuntarPDF` | `13-NotificacionesOJ-Completar.sql` | Guardar ruta del PDF |
| `SP_NotificacionOJ_VerificarDuplicado` | `00-LexControlDB.sql` | Duplicados no atendidos del expediente |
| `SP_Reporte_NotificacionesOJ` | `10-Reportes-FixSubquery.sql` | Reporte |

> `SP_NotificacionOJ_VerificarDuplicado @Expediente_ID, @NumeroResolucion, @NumeroExpedienteOJ`
> devuelve un resultset (`ID`, `Resumen`, `FechaRecepcion`), **no** un booleano.

---

## 3. Backend

### DTOs — `Dtos/Notificaciones/NotificacionDtos.cs`

- `NotificacionFila` / `NotificacionDetalleFila` (mapeo Dapper)
- `NotificacionDto` / `NotificacionDetalleDto` (respuesta)
- `NotificacionCrearDto` / `NotificacionActualizarDto` / `NotificacionAtenderDto`
- `DuplicadoVerificarDto` / `DuplicadoFila` / `DuplicadoDto`

### Service — `Services/NotificacionService.cs`

| Método | SP |
|---|---|
| `ListarAsync` | `SP_Notificacion_Listar` |
| `ObtenerPorIdAsync` | `SP_Notificacion_ObtenerPorID` |
| `CrearAsync` | `SP_NotificacionOJ_Insertar` |
| `ActualizarAsync` | `SP_NotificacionOJ_Actualizar` |
| `AtenderAsync` | `SP_NotificacionOJ_Atender` |
| `VerificarDuplicadoAsync` | `SP_NotificacionOJ_VerificarDuplicado` |
| `AdjuntarPdfAsync` | `SP_NotificacionOJ_AdjuntarPDF` |

### Controller — `Controllers/NotificacionesController.cs`

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | `/api/notificaciones` | Autenticado | Listar con filtros |
| GET | `/api/notificaciones/{id}` | Autenticado | Detalle |
| POST | `/api/notificaciones` | Admin, Abogado | Crear |
| PUT | `/api/notificaciones/{id}` | Admin, Abogado | Actualizar |
| PUT | `/api/notificaciones/{id}/atender` | Admin, Abogado | Atender |
| POST | `/api/notificaciones/verificar-duplicado` | Admin, Abogado, Secretaria | Verificar duplicados |
| POST | `/api/notificaciones/{id}/pdf` | Admin, Abogado, Secretaria | Adjuntar archivo (multipart) |

Registro DI en `Program.cs`: `AddScoped<INotificacionService, NotificacionService>()`.

### Adjunto PDF

El endpoint reutiliza `IFileStorageService.GuardarAsync` (validación por extensión y magic
bytes) usando la carpeta del expediente de la notificación. La ruta se persiste con
`SP_NotificacionOJ_AdjuntarPDF`. La vista previa y descarga usan endpoints por ID que
resuelven la ruta en el servidor:
`GET /api/notificaciones/{id}/pdf/preview` y `GET /api/notificaciones/{id}/pdf/download`.

---

## 4. Frontend

| Archivo | Rol |
|---|---|
| `core/models/notificacion.model.ts` | Interfaces (`NotificacionLista`, `NotificacionDetalle`, `NotificacionDuplicado`, `NotificacionPdfResponse`, ...) |
| `core/services/notificaciones-service.ts` | `listar`, `obtenerPorId`, `crear`, `actualizar`, `atender`, `verificarDuplicado`, `subirPdf`, `descargar` |
| `features/notificaciones-oj/notificaciones-page.*` | Listado con filtros + badge OJ + botón "Nueva Notificación" |
| `features/notificaciones-oj/notificacion-detalle-page.*` | Detalle + atender + editar + ver PDF |
| `features/notificaciones-oj/notificacion-modal.*` | Alta/edición, adjunto y verificación de duplicados |
| `styles/modules/notificaciones.css` | Estilos (incluye `.badge-oj`, adjunto y duplicados) |

### Comportamiento de duplicados

Al **crear** (no al editar), al pulsar Guardar se consulta automáticamente
`verificar-duplicado`. Si hay coincidencias, se muestran y se pide confirmar con un segundo
clic en Guardar. También existe un botón manual "Verificar duplicado".

### `data-testid` de UI

`notificaciones-tabla`, `badge-oj`, `filtro-tipo`, `filtro-estado`, `btn-nueva-notificacion`,
`select-expediente`, `select-tipo`, `input-fecha`, `input-pdf`, `btn-verificar-duplicado`,
`btn-guardar-notificacion`, `notificacion-expediente`, `notificacion-tipo`,
`notificacion-estado`, `btn-atender`, `btn-editar-notificacion`, `btn-volver`, `btn-ver-pdf`.

---

## 5. Pruebas

### Integración (xUnit) — `NotificacionesControllerTests.cs` (12 tests)

Listar (auth/no-auth/filtros), detalle (404/no-auth), crear (válida/sin rol), actualizar,
atender, verificar-duplicado (auth/no-auth), subir PDF inexistente.

### E2E (Playwright)

- `e2e/tests/14-notificaciones.spec.ts` (TC-NOT-001..008)
- `e2e/tests/15-notificacion-detalle.spec.ts` (TC-NDE-001..005)

---

## 6. Criterios de aceptación

- [x] Los SPs de crear, actualizar, atender, verificar duplicado y adjuntar PDF existen y ejecutan.
- [x] Controller con 7 endpoints.
- [x] Verificar duplicado retorna el listado de coincidencias.
- [x] Atender cambia el estado a "Atendida".
- [x] Edición persiste los cambios.
- [x] Adjunto PDF se sube y se puede descargar.
- [x] Badge OJ en notificaciones pendientes.
- [x] `npm run build` exitoso y `dotnet test` en verde.