# Módulo 03 — Trámites

> **Estado:** ✅ COMPLETADO — SPs + Backend + Frontend
> **Ruta frontend:** `/tramites` (lista), `/tramites/:id` (detalle)
> **Fecha implementación:** 15 Sep 2026

---

## 1. Descripción

Gestión de trámites judiciales asociados a expedientes. Lista con filtros, creación vía modal, cambio de estado y resolución.

---

## 2. Procedimientos Almacenados

**Estado:** Los 4 SPs ya existían en la BD.

| SP | Archivo | Parámetros |
|---|---|---|
| `SP_Tramite_Listar` | 05-Complementarios.sql | @Expediente_ID, @Estado_ID, @Tipo_ID, @FechaInicio, @FechaFin |
| `SP_Tramite_ObtenerPorID` | 05-Complementarios.sql | @ID |
| `SP_Tramite_Insertar` | 00-LexControlDB.sql | @Expediente_ID, @Tipo_ID, @Institucion, @FechaIngreso, @Estado_ID, @Descripcion, @OficioReferencia, @NotasInternas, @DocumentosAdjuntos, @NuevoID OUTPUT |
| `SP_Tramite_ActualizarEstado` | 00-LexControlDB.sql | @ID, @Estado_ID, @FechaResolucion, @ResumenResolucion |

**Estructura de la tabla TRAMITE:**
```
ID, Expediente_ID, Tipo_ID, Institucion, FechaIngreso, Estado_ID,
Descripcion, OficioReferencia, NotasInternas, DocumentosAdjuntos,
FechaResolucion, ResumenResolucion, FechaCreacion, FechaUltimaActualizacion
```

**Catálogos relacionados:**
- `TIPO_TRAMITE` (5 registros): Memorial, Recurso, Solicitud, Notificación, Oficio
- `ESTADO_TRAMITE` (4 registros): Ingresado, En Proceso, Resuelto, Rechazado

---

## 3. Backend

### 3.1 DTOs

**Archivo:** `Back-end/LexControlApi/Dtos/Tramites/TramiteDtos.cs`

| Clase | Uso |
|---|---|
| `TramiteFila` | Mapeo Dapper de SP_Tramite_Listar |
| `TramiteDetalleFila` | Mapeo Dapper de SP_Tramite_ObtenerPorID |
| `TramiteDto` | DTO de respuesta (listado) |
| `TramiteDetalleDto` | DTO de respuesta (detalle completo) |
| `TramiteCrearDto` | DTO de entrada para crear |
| `TramiteActualizarEstadoDto` | DTO de entrada para cambiar estado |

### 3.2 Service

**Archivo:** `Back-end/LexControlApi/Services/TramiteService.cs`

| Método | SP | Descripción |
|---|---|---|
| `ListarAsync()` | SP_Tramite_Listar | Lista con filtros (expediente, estado, tipo, fechas) |
| `ObtenerPorIdAsync()` | SP_Tramite_ObtenerPorID | Detalle completo con joins |
| `CrearAsync()` | SP_Tramite_Insertar | Crea nuevo trámite (con OUTPUT @NuevoID) |
| `ActualizarEstadoAsync()` | SP_Tramite_ActualizarEstado | Cambia estado y registra resolución |

### 3.3 Controller

**Archivo:** `Back-end/LexControlApi/Controllers/TramitesController.cs`

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/api/tramites` | [Authorize] | Listar con filtros query string |
| GET | `/api/tramites/{id}` | [Authorize] | Obtener detalle por ID |
| POST | `/api/tramites` | [Authorize(Roles="Administrador,Abogado")] | Crear trámite |
| PUT | `/api/tramites/{id}/estado` | [Authorize(Roles="Administrador,Abogado")] | Cambiar estado |

### 3.4 DI Registration

**Archivo:** `Back-end/LexControlApi/Program.cs`
```csharp
builder.Services.AddScoped<ITramiteService, TramiteService>();
```

---

## 4. Frontend

### 4.1 Modelo

**Archivo:** `Front-end/LexControlFornt/src/app/core/models/tramite.model.ts`

| Interfaz | Uso |
|---|---|
| `Tramite` | Listado |
| `TramiteDetalle` | Detalle completo |
| `TramiteCrear` | DTO de creación |
| `TramiteActualizarEstado` | DTO de cambio de estado |

### 4.2 Service

**Archivo:** `Front-end/LexControlFornt/src/app/core/services/tramites-service.ts`

| Método | Endpoint | Retorna |
|---|---|---|
| `listar()` | GET `/api/tramites` | `Observable<Tramite[]>` |
| `obtenerPorId()` | GET `/api/tramites/{id}` | `Observable<TramiteDetalle>` |
| `crear()` | POST `/api/tramites` | `Observable<number>` |
| `actualizarEstado()` | PUT `/api/tramites/{id}/estado` | `Observable<void>` |

### 4.3 Componentes

| Archivo | Descripción |
|---|---|
| `features/tramites/tramites-page.ts` + `.html` | Lista con filtros (estado, tipo, fechas), tabla navegable |
| `features/tramites/tramite-detalle-page.ts` + `.html` | Detalle completo con panel de resolución y cambio de estado |
| `features/tramites/tramite-modal.ts` + `.html` | Modal de creación con catálogos dinámicos |

### 4.4 Estilos

**Archivo:** `Front-end/LexControlFornt/src/styles/modules/tramites.css`

- Toolbar de filtros con grid responsive
- Tabla de datos con hover y pills de estado
- Detalle con grid de campos, secciones y panel de resolución
- Modal de creación con fieldsets (info general + detalles)
- Modal de cambio de estado
- Loading spinner animado
- Responsive mobile (≤768px, ≤640px)

### 4.5 Rutas

**Archivo:** `Front-end/LexControlFornt/src/app/app.routes.ts`

```typescript
{
    path: 'tramites',
    canActivate: [moduloGuard('tramites')],
    loadComponent: () => import('./features/tramites/tramites-page').then(m => m.TramitesPage)
},
{
    path: 'tramites/:id',
    canActivate: [moduloGuard('tramites')],
    loadComponent: () => import('./features/tramites/tramite-detalle-page').then(m => m.TramiteDetallePage)
}
```

---

## 5. Pruebas de Endpoints

```http
### Listar trámites
GET http://localhost:5181/api/tramites
Authorization: Bearer <token>

### Listar con filtros
GET http://localhost:5181/api/tramites?estadoId=1&tipoId=1
Authorization: Bearer <token>

### Obtener por ID
GET http://localhost:5181/api/tramites/1
Authorization: Bearer <token>

### Crear trámite
POST http://localhost:5181/api/tramites
Authorization: Bearer <token>
Content-Type: application/json

{
  "expedienteId": 1,
  "tipoId": 1,
  "institucion": "Juzgado de Primera Instancia",
  "estadoId": 1,
  "descripcion": "Trámite de prueba"
}

### Cambiar estado
PUT http://localhost:5181/api/tramites/1/estado
Authorization: Bearer <token>
Content-Type: application/json

{
  "estadoId": 2,
  "fechaResolucion": "2026-09-15",
  "resumenResolucion": "En proceso de revisión"
}
```

---

## 6. Criterios de Aceptación

- [x] Los 4 SPs existen y ejecutan sin errores
- [x] El controller compila con los 4 endpoints
- [x] Frontend muestra lista con filtros reales
- [x] Modal de crear trámite funciona con catálogos dinámicos
- [x] Cambiar estado funciona desde el detalle
- [x] `dotnet build` exitoso (0 errores)
- [x] `npx ng build` exitoso (0 errores)
