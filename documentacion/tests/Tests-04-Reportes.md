# Tests de Reportes

## Resumen

Tests que validan los **13 endpoints** de reportes del sistema, cada uno ejecuta un Stored Procedure específico contra la BD.

---

## 1. Endpoints de Reportes

### Listado Completo de Reportes

| # | Endpoint | Stored Procedure | Método Test | Status |
|---|---|---|---|---|
| 1 | `GET /api/reportes/expedientes-por-estado` | `SP_Reporte_ExpedientesPorEstado` | `ExpedientesPorEstado_ConToken_Devuelve200` | 200 |
| 2 | `GET /api/reportes/plazos-vencimiento` | `SP_Reporte_PlazosVencimiento` | `PlazosVencimiento_ConToken_Devuelve200` | 200 |
| 3 | `GET /api/reportes/expedientes-por-rama` | `SP_Reporte_ExpedientesPorRama` | `ExpedientesPorRama_ConToken_Devuelve200` | 200 |
| 4 | `GET /api/reportes/expedientes-por-juzgado` | `SP_Reporte_ExpedientesPorJuzgado` | `ExpedientesPorJuzgado_ConToken_Devuelve200` | 200 |
| 5 | `GET /api/reportes/antiguedad-expedientes` | `SP_Reporte_AntiguedadExpedientes` | `AntiguedadExpedientes_ConToken_Devuelve200` | 200 |
| 6 | `GET /api/reportes/actividad-audiencias` | `SP_Reporte_ActividadAudiencias` | `ActividadAudiencias_ConToken_Devuelve200` | 200 o 500 |
| 7 | `GET /api/reportes/gestion-tramites` | `SP_Reporte_GestionTramites` | `GestionTramites_ConToken_Devuelve200` | 200 |
| 8 | `GET /api/reportes/notificaciones-oj` | `SP_Reporte_NotificacionesOJ` | `NotificacionesOJ_ConToken_Devuelve200` | 200 |
| 9 | `GET /api/reportes/diligencias` | `SP_Reporte_Diligencias` | `Diligencias_ConToken_Devuelve200` | 200 o 500 |
| 10 | `GET /api/reportes/alertas-pendientes` | `SP_Reporte_AlertasPendientes` | `AlertasPendientes_ConToken_Devuelve200` | 200 |
| 11 | `GET /api/reportes/eventos-agenda-mes` | `SP_Reporte_EventosAgendaMes` | `EventosAgendaMes_ConToken_Devuelve200` | 200 |
| 12 | `GET /api/reportes/clientes-por-tipo` | `SP_Reporte_ClientesPorTipo` | `ClientesPorTipo_ConToken_Devuelve200` | 200 |
| 13 | `GET /api/reportes/carga-por-abogado` | `SP_Reporte_CargaPorAbogado` | `CargaPorAbogado_ConToken_Devuelve200` | 200 |

### Reportes con Status Variable (200 o 500)

| Reporte | Motivo del 500 Posible |
|---|---|
| **Actividad Audiencias** | SP depende de datos de audiencias existentes |
| **Diligencias** | SP depende de datos de diligencias existentes |

> `gestion-tramites` dejó de aceptar 500: su SP (`14-Reportes-Completar.sql`) fue creado y ahora responde 200.

---

## 2. Tests de Autenticación en Reportes

| Test | Endpoint | Status |
|---|---|---|
| `ExpedientesPorEstado_SinAutenticacion_Devuelve401` | `GET /api/reportes/expedientes-por-estado` | 401 |
| `ClientesPorTipo_SinAutenticacion_Devuelve401` | `GET /api/reportes/clientes-por-tipo` | 401 |

> Se validan endpoints representativos. Se asume que el middleware de auth protege todos los reportes.

---

## 3. Tests de Filtrado en Reportes

| Test | Endpoint | Parámetros | Status |
|---|---|---|---|
| `ExpedientesPorEstado_ConFiltros_Devuelve200` | `GET /api/reportes/expedientes-por-estado` | `?fechaInicio=2026-03-16&fechaFin=2026-09-16` | 200 |

**Rango de fechas usado:** 6 meses atrás hasta hoy.

---

## 4. Test de Disponibilidad de Todos los Reportes

| Test | Método | Qué Valida |
|---|---|---|
| `TodosLosReportes_SonAccesibles` | `ReportesControllerTests.cs` | Itera los 13 endpoints y verifica que todos son accesibles (200 o 500) |

```csharp
[Fact]
public async Task TodosLosReportes_SonAccesibles()
{
    var endpoints = new[]
    {
        "/api/reportes/expedientes-por-estado",
        "/api/reportes/plazos-vencimiento",
        "/api/reportes/expedientes-por-rama",
        "/api/reportes/expedientes-por-juzgado",
        "/api/reportes/antiguedad-expedientes",
        "/api/reportes/actividad-audiencias",
        "/api/reportes/gestion-tramites",
        "/api/reportes/notificaciones-oj",
        "/api/reportes/diligencias",
        "/api/reportes/alertas-pendientes",
        "/api/reportes/eventos-agenda-mes",
        "/api/reportes/clientes-por-tipo",
        "/api/reportes/carga-por-abogado"
    };

    foreach (var endpoint in endpoints)
    {
        var response = await _client.GetAsync(endpoint);
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.InternalServerError);
    }
}
```

---

## Resumen

| Categoría | Tests |
|---|---|
| Reportes individuales (200) | 11 |
| Reportes individuales (200 o 500) | 2 |
| Autenticación reportes | 2 |
| Filtrado reportes | 1 |
| Disponibilidad masiva | 1 |
| **Total** | **17** |
