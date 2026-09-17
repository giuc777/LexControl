# Módulo 07 — Reportes

> **Estado:** ✅ COMPLETADO
> **Ruta frontend:** `/reportes`
> **Backend:** 13 endpoints · **Frontend:** 8 categorías con exportación PDF

---

## 1. Descripción

Sistema de reportes con consultas estadísticas. Cada reporte devuelve un **resumen**
(agrupado) y un **detalle** (filas individuales). Los reportes que ya existían en el
backend se expusieron en la UI, se corrigió el SP de trámites y se agregaron dos reportes
nuevos derivados de otros módulos (Clientes y Rendimiento).

## 2. Categorías en la UI

| Categoría | Reportes incluidos |
|---|---|
| Reporte de Usuarios | Actividad, roles y estado de usuarios (calculado desde `/api/usuarios`) |
| Clientes por Tipo | Clientes por tipo/estado (nuevo) |
| Expedientes | Por estado · por juzgado · por rama · antigüedad |
| Agenda y Audiencias | Actividad de audiencias · eventos del mes · plazos por vencer |
| Trámites en Curso | Gestión de trámites |
| Notificaciones OJ | Notificaciones por tipo/estado |
| Diligencias y Alertas | Diligencias · alertas pendientes |
| Rendimiento del Bufete | Carga de trabajo por responsable (nuevo) |

---

## 3. Procedimientos almacenados

### Existían

`SP_Reporte_ExpedientesPorEstado`, `SP_Reporte_PlazosVencimiento`,
`SP_Reporte_ExpedientesPorRama`, `SP_Reporte_ExpedientesPorJuzgado`,
`SP_Reporte_AntiguedadExpedientes`, `SP_Reporte_ActividadAudiencias`,
`SP_Reporte_NotificacionesOJ`, `SP_Reporte_Diligencias`,
`SP_Reporte_AlertasPendientes`, `SP_Reporte_EventosAgendaMes`.

### Nuevos — `ScriptsDB/14-Reportes-Completar.sql`

| SP | Descripción |
|---|---|
| `SP_Reporte_GestionTramites` | **Corregido**: estaba comentado y ausente en la BD (causaba 500). Usa variables `@Resuelto`/`@Rechazado` para evitar agregado sobre subquery. |
| `SP_Reporte_ClientesPorTipo` | Resumen por tipo (total/activos/inactivos/%) + detalle. |
| `SP_Reporte_CargaPorAbogado` | Carga por usuario asignado (activos/en espera/urgentes/cerrados) + detalle. |

> Ejecutar el script contra `DBLexControl` con `sqlcmd`. Incluye bloque de verificación.

---

## 4. Backend

### DTOs — `Dtos/Reportes/ReporteDtos.cs`

`ReporteRespuesta<TResumen, TDetalle>` + 13 pares resumen/detalle. Nuevos:
`ClientesPorTipoResumen/Detalle`, `CargaPorAbogadoResumen/Detalle`.

### Service — `Services/ReporteService.cs`

13 métodos; los multi-resultset usan `IRepositorio.ConsultarMultiplesAsync`.

### Controller — `Controllers/ReportesController.cs`

| Método | Endpoint |
|---|---|
| GET | `/api/reportes/expedientes-por-estado` |
| GET | `/api/reportes/plazos-vencimiento` |
| GET | `/api/reportes/expedientes-por-rama` |
| GET | `/api/reportes/expedientes-por-juzgado` |
| GET | `/api/reportes/antiguedad-expedientes` |
| GET | `/api/reportes/actividad-audiencias` |
| GET | `/api/reportes/gestion-tramites` |
| GET | `/api/reportes/notificaciones-oj` |
| GET | `/api/reportes/diligencias` |
| GET | `/api/reportes/alertas-pendientes` |
| GET | `/api/reportes/eventos-agenda-mes` |
| GET | `/api/reportes/clientes-por-tipo` |
| GET | `/api/reportes/carga-por-abogado` |

---

## 5. Frontend

| Archivo | Rol |
|---|---|
| `core/models/reporte.model.ts` | Interfaces de los 13 reportes |
| `core/services/reportes-service.ts` | 13 métodos HTTP |
| `features/reportes/reportes-page.*` | Grid de 8 categorías |
| `features/reportes/reportes-utils.ts` | Utilidades de formato de fechas/iniciales |
| `features/reportes/reportes-clientes-page.*` | Clientes por tipo (nuevo) |
| `features/reportes/reportes-expedientes-page.*` | Expedientes (estado/juzgado/rama/antigüedad) |
| `features/reportes/reportes-agenda-page.*` | Agenda y audiencias |
| `features/reportes/reportes-tramites-page.*` | Trámites |
| `features/reportes/reportes-notificaciones-page.*` | Notificaciones OJ |
| `features/reportes/reportes-diligencias-page.*` | Diligencias y alertas |
| `features/reportes/reportes-rendimiento-page.*` | Carga por responsable (nuevo) |
| `styles/modules/reportes.css` | Estilos reutilizables (stats, progress, barras, tablas) |

Cada página incluye stat cards, paneles de progreso/barras, tabla de detalle y botón
**Exportar PDF** (`jspdf` + `jspdf-autotable`).

---

## 6. Pruebas

- **Integración (xUnit)** — `ReportesControllerTests.cs`: 17 tests (13 endpoints + auth +
  filtros + disponibilidad masiva).
- **E2E (Playwright)** — `e2e/tests/06-reportes.spec.ts`: TC-REP-001..011 (una por categoría + volver).

---

## 7. Criterios de aceptación

- [x] `SP_Reporte_GestionTramites` existe y `gestion-tramites` responde 200.
- [x] Reportes nuevos `clientes-por-tipo` y `carga-por-abogado` operativos.
- [x] Las 8 categorías abren su página y muestran datos.
- [x] Exportación PDF en cada reporte.
- [x] `npm run build` exitoso y `dotnet test` en verde.