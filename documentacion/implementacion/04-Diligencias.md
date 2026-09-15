# Módulo 04 — Diligencias (Tareas del Abogado)

> **Estado:** Implementado. SPs, Backend, Frontend completos + integración con Agenda.
> **Ruta frontend:** `/diligencias` (lista) + `/diligencias/:id` (detalle)
> **Guard:** Usa `moduloGuard('audiencias')` — las diligencias son sub-módulo de Agenda.

---

## 1. Descripción

Gestión de tareas unitarias del abogado: asesorías, redacciones, revisiones, llamadas, visitas a instituciones, correos. Cada diligencia está asociada a un expediente o cliente, y puede mostrarse en el calendario de la Agenda.

**Tipos de diligencia:**
- Asesoría con cliente
- Redacción de documentos
- Revisión de expediente
- Llamada de seguimiento
- Visita a institución
- Correo electrónico

**Estados:** Pendiente → En Progreso → Completada / Cancelada

---

## 2. Tabla DILIGENCIA (columnas reales)

```
ID, Expediente_ID (nullable), Cliente_ID (nullable), Tipo_ID, Titulo,
Descripcion, Fecha, HoraInicio, DiaCompleto, Ubicacion, Oficina,
Estado_ID, Notas, TiempoDedicado, RecordatorioMinutos, Usuario_ID,
FechaCreacion
```

**Constraint:** `CHK_DILIGENCIA_ENTIDAD` — al menos `Expediente_ID` o `Cliente_ID` debe ser NOT NULL.
**Nota:** No existe columna `Activo`. La "eliminación" se hace cambiando estado a `Cancelada`.

---

## 3. Procedimientos Almacenados

**Script:** `ScriptsDB/11-Diligencias-CRUD.sql`

| SP | Descripción | Parámetros principales |
|---|---|---|
| `SP_Diligencia_Listar` | Lista con filtros | Expediente_ID, Cliente_ID, Tipo_ID, Estado_ID, Usuario_ID, FechaInicio, FechaFin |
| `SP_Diligencia_ObtenerPorID` | Detalle completo | @ID |
| `SP_Diligencia_Insertar` | Crear nueva | Todos los campos + @NuevoID OUTPUT |
| `SP_Diligencia_Actualizar` | Actualizar parcial | @ID + campos opcionales (NULL = sin cambio) |
| `SP_Diligencia_Eliminar` | Cancelar (cambia estado) | @ID → Estado_ID = Cancelada |

**Patrón:**
- `CREATE OR ALTER` para idempotencia
- `SET NOCOUNT ON` al inicio
- `BEGIN TRY / BEGIN CATCH` con `RETURN 0` (éxito) o `RETURN ERROR_NUMBER()` (fallo)
- `@NuevoID = SCOPE_IDENTITY()` en INSERT
- `@NuevoID = -1` en error de INSERT
- Filtros opcionales: `(@Param IS NULL OR Column = @Param)`
- `ORDER BY` siempre presente
- Eliminación lógica: UPDATE Estado_ID = Cancelada (no DELETE físico)

---

## 4. Backend

| Archivo | Contenido |
|---------|-----------|
| `Dtos/Diligencias/DiligenciaDtos.cs` | DiligenciaFila, DiligenciaDetalleFila, DiligenciaDto, DiligenciaDetalleDto, DiligenciaCrearDto, DiligenciaActualizarDto |
| `Services/DiligenciaService.cs` | IDiligenciaService + DiligenciaService: ListarAsync, ObtenerPorIdAsync, CrearAsync, ActualizarAsync, EliminarAsync |
| `Controllers/DiligenciasController.cs` | 5 endpoints REST |
| `Program.cs` | +1 línea DI: `builder.Services.AddScoped<IDiligenciaService, DiligenciaService>()` |

### Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/diligencias` | Authenticated | Lista con filtros |
| GET | `/api/diligencias/{id}` | Authenticated | Detalle completo |
| POST | `/api/diligencias` | Admin, Abogado | Crear (Usuario_ID del JWT) |
| PUT | `/api/diligencias/{id}` | Admin, Abogado | Actualizar parcial |
| DELETE | `/api/diligencias/{id}` | Admin, Abogado | Cancelar (cambia estado) |

---

## 5. Frontend

| Archivo | Contenido |
|---------|-----------|
| `core/models/diligencia.model.ts` | Diligencia, DiligenciaDetalle, DiligenciaCrear, DiligenciaActualizar |
| `core/services/diligencias-service.ts` | listar, obtenerPorId, crear, actualizar, eliminar |
| `features/diligencias/diligencias-page.ts/html` | Lista con filtros (tipo, estado, expediente, fechas) |
| `features/diligencias/diligencia-detalle-page.ts/html` | Detalle + cambio de estado + cancelar |
| `features/diligencias/diligencia-modal.ts/html` | Modal de creación |
| `styles/modules/diligencias.css` | Estilos (~300 líneas) |
| `styles.css` | +1 línea import |
| `app.routes.ts` | Rutas `/diligencias` y `/diligencias/:id` |

### Rutas

```ts
{
    path: 'diligencias',
    canActivate: [moduloGuard('audiencias')],
    loadComponent: () => import('./features/diligencias/diligencias-page').then(m => m.DiligenciasPage)
},
{
    path: 'diligencias/:id',
    canActivate: [moduloGuard('audiencias')],
    loadComponent: () => import('./features/diligencias/diligencia-detalle-page').then(m => m.DiligenciaDetallePage)
}
```

---

## 6. Integración con Agenda

Las diligencias con fecha se muestran en el calendario de Agenda junto con audiencias y eventos.

### Archivos modificados para la integración:

| Archivo | Cambio |
|---------|--------|
| `features/agenda/agenda-page.ts` | +import DiligenciasService/DiligenciaModal, +signal diligencias, +cargar diligencias del mes, +eventosDelDia incluye diligencias, navegación diferenciada |
| `features/agenda/agenda-page.html` | +botón "Nueva Diligencia" (btn-secondary), +render diligencias con pill morado, +modal diligencia con fecha pre-llenada |
| `features/diligencias/diligencia-modal.ts` | +@Input() fechaInicial para pre-llenar date picker desde Agenda |

### Comportamiento:
- Header de Agenda: "Nueva Diligencia" (btn-secondary) + "Nueva Audiencia" (btn-primary)
- Cada evento en la lista muestra pill de tipo con color (audiencia=azul, diligencia=morado)
- Al crear diligencia desde Agenda, la fecha se pre-llenla con el día seleccionado
- Navegación: audiencias → `/agenda/:id`, diligencias → `/diligencias/:id`
- Bug fix: audiencias se filtraban por `fechaStr` correctamente (faltaba `.filter()` en el computed)

---

## 7. Criterios de Aceptación

- [x] Los 5 SPs crean y ejecutan sin errores
- [x] Controller compila con 5 endpoints
- [x] Frontend muestra lista, detalle y modal CRUD
- [x] Diligencias aparecen en el calendario de Agenda
- [x] Botón "Nueva Diligencia" en Agenda crea diligencia con fecha pre-llenada
- [x] Al seleccionar un día en el calendario, se filtran audiencias, eventos y diligencias correctamente
- [x] `dotnet build` exitoso (0 errores)
- [x] `ng build` exitoso (0 errores)

---

## 8. Archivos creados/modificados

| Archivo | Acción |
|---------|--------|
| `ScriptsDB/11-Diligencias-CRUD.sql` | CREADO — 5 SPs |
| `Back-end/.../Dtos/Diligencias/DiligenciaDtos.cs` | CREADO — 6 clases DTO |
| `Back-end/.../Services/DiligenciaService.cs` | CREADO — CRUD service |
| `Back-end/.../Controllers/DiligenciasController.cs` | CREADO — 5 endpoints |
| `Back-end/.../Program.cs` | MODIFICADO — +1 línea DI |
| `Front-end/.../core/models/diligencia.model.ts` | CREADO — 4 interfaces |
| `Front-end/.../core/services/diligencias-service.ts` | CREADO — HTTP service |
| `Front-end/.../features/diligencias/diligencias-page.ts` | CREADO — lista |
| `Front-end/.../features/diligencias/diligencias-page.html` | CREADO — template lista |
| `Front-end/.../features/diligencias/diligencia-detalle-page.ts` | CREADO — detalle |
| `Front-end/.../features/diligencias/diligencia-detalle-page.html` | CREADO — template detalle |
| `Front-end/.../features/diligencias/diligencia-modal.ts` | CREADO — modal creación |
| `Front-end/.../features/diligencias/diligencia-modal.html` | CREADO — template modal |
| `Front-end/.../styles/modules/diligencias.css` | CREADO — ~300 líneas |
| `Front-end/.../styles.css` | MODIFICADO — +1 línea import |
| `Front-end/.../app.routes.ts` | MODIFICADO — +2 rutas |

### Archivos modificados para integración con Agenda:

| Archivo | Acción |
|---------|--------|
| `Front-end/.../features/agenda/agenda-page.ts` | MODIFICADO — +DiligenciasService, +signal diligencias, +eventosDelDia filtra audiencias/feas, +navegación diferenciada |
| `Front-end/.../features/agenda/agenda-page.html` | MODIFICADO — +botón Nueva Diligencia, +render diligencias, +modal diligencia |
| `Front-end/.../features/diligencias/diligencia-modal.ts` | MODIFICADO — +@Input() fechaInicial |
