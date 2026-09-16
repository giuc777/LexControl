# Módulo 07 — Reportes

> **Módulo completo:** Corrección de SPs + Backend + Frontend + Pruebas + Playwright
> **Estado:** ✅ Backend COMPLETADO (SPs + DTOs + Service + Controller). Frontend: model + service creados.
> **Ruta frontend:** `/reportes`

---

## 1. Descripción

Sistema de reportes con 11 consultas estadísticas. Devuelven resumen (agrupado) y detalle (filas individuales).

**Estado de SPs:**
- ✅ 6 SPs funcionan: ExpedientesPorEstado, ExpedientesPorRama, ExpedientesPorJuzgado, AntiguedadExpedientes, ActividadAudiencias, AlertasPendientes, PlazosVencimiento
- ✅ 3 SPs corregidos: NotificacionesOJ, Diligencias, EventosAgendaMes (fix en 10-Reportes-FixSubquery.sql)
- ✅ 1 SP corregido: GestionTramites (descomentado y corregido)

**Backend:**
- ✅ `Dtos/Reportes/ReporteDtos.cs` — 22 DTOs (11 resumen + 11 detalle)
- ✅ `Services/ReporteService.cs` — 11 métodos (uno por SP)
- ✅ `Controllers/ReportesController.cs` — 11 endpoints GET
- ✅ `Data/IRepositorio.cs` — Nuevo método `ConsultarMultiplesAsync` para multi-result sets

**Frontend:**
- ✅ `core/models/reporte.model.ts` — 22 interfaces
- ✅ `core/services/reportes-service.ts` — 11 métodos HTTP

---

## 2. Procedimientos Almacenados — Correcciones

### 2.1 SP_Reporte_GestionTramites (descomentar)

**Archivo:** `LexControlDB.sql:2408-2459`
**Acción:** Descomentar el código y verificar ejecución

### 2.2 SP_Reporte_NotificacionesOJ (corregir)

**Error:** Msg 130 — Cannot perform aggregate on subquery
**Solución:** Reemplazar subquery por CTE o JOIN

```sql
-- ANTES (con error):
SELECT COUNT(*) FROM (SELECT ...) AS subquery

-- DESPUÉS (corregido):
;WITH Base AS (
    SELECT N.*, ENO.Nombre AS Estado
    FROM NOTIFICACION_OJ N
    INNER JOIN ESTADO_NOTIFICACION_OJ ENO ON N.Estado_Notificacion_ID = ENO.ID
)
SELECT Estado, COUNT(*) AS Total
FROM Base
GROUP BY Estado;
```

### 2.3 SP_Reporte_Diligencias (corregir)

**Mismo patrón de corrección** — reemplazar aggregate sobre subquery por CTE.

### 2.4 SP_Reporte_EventosAgendaMes (corregir)

**Mismo patrón de corrección** — reemplazar aggregate sobre subquery por CTE.

---

## 3. Backend

### 3.1 DTOs — `Dtos/Reportes/ReporteDtos.cs`

```csharp
namespace LexControlApi.Dtos.Reportes;

public class ReporteRespuesta<T>
{
    public List<T> Resumen { get; set; } = new();
    public List<T> Detalle { get; set; } = new();
}

// DTOs genéricos para cada reporte
public class ExpedienteEstadoResumen
{
    public string Estado { get; set; } = "";
    public int Cantidad { get; set; }
    public decimal Porcentaje { get; set; }
}

public class ExpedienteRamaResumen
{
    public string Rama { get; set; } = "";
    public int Cantidad { get; set; }
    public string Color { get; set; } = "";
}

public class AlertaPendiente
{
    public string Tipo { get; set; } = "";
    public string Descripcion { get; set; } = "";
    public int Cantidad { get; set; }
    public string Prioridad { get; set; } = "";
}
```

### 3.2 Service — `Services/ReporteService.cs`

```csharp
using LexControlApi.Dtos.Reportes;

namespace LexControlApi.Services;

public interface IReporteService
{
    Task<ReporteRespuesta<ExpedienteEstadoResumen>> ExpedientesPorEstadoAsync();
    Task<ReporteRespuesta<ExpedienteRamaResumen>> ExpedientesPorRamaAsync();
    Task<ReporteRespuesta<dynamic>> ExpedientesPorJuzgadoAsync();
    Task<ReporteRespuesta<dynamic>> AntiguedadExpedientesAsync();
    Task<ReporteRespuesta<dynamic>> ActividadAudienciasAsync();
    Task<ReporteRespuesta<dynamic>> GestionTramitesAsync();
    Task<ReporteRespuesta<dynamic>> NotificacionesOJAsync();
    Task<ReporteRespuesta<dynamic>> DiligenciasAsync();
    Task<ReporteRespuesta<AlertaPendiente>> AlertasPendientesAsync();
    Task<ReporteRespuesta<dynamic>> EventosAgendaMesAsync();
    Task<ReporteRespuesta<dynamic>> PlazosVencimientoAsync();
}

public class ReporteService : IReporteService
{
    private readonly Data.IRepositorio _repositorio;
    public ReporteService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<ReporteRespuesta<ExpedienteEstadoResumen>> ExpedientesPorEstadoAsync()
    {
        var filas = await _repositorio.ConsultarAsync<ExpedienteEstadoResumen>(
            "SP_Reporte_ExpedientesPorEstado");
        return new ReporteRespuesta<ExpedienteEstadoResumen> { Resumen = filas, Detalle = new() };
    }

    public async Task<ReporteRespuesta<ExpedienteRamaResumen>> ExpedientesPorRamaAsync()
    {
        var filas = await _repositorio.ConsultarAsync<ExpedienteRamaResumen>(
            "SP_Reporte_ExpedientesPorRama");
        return new ReporteRespuesta<ExpedienteRamaResumen> { Resumen = filas, Detalle = new() };
    }

    // ... implementar cada método llamando a su SP correspondiente
    // Para los que usan QueryMultiple (resumen + detalle):
    // var multiplo = await _repositorio.ConsultarMultiploAsync(
    //     "SP_Reporte_X", new { });
    // var resumen = await multiplo.ReadAsync<...>();
    // var detalle = await multiplo.ReadAsync<...>();

    public async Task<ReporteRespuesta<AlertaPendiente>> AlertasPendientesAsync()
    {
        var filas = await _repositorio.ConsultarAsync<AlertaPendiente>(
            "SP_Reporte_AlertasPendientes");
        return new ReporteRespuesta<AlertaPendiente> { Resumen = filas, Detalle = new() };
    }
}
```

### 3.3 Controller — `Controllers/ReportesController.cs`

```csharp
using LexControlApi.Dtos.Reportes;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/reportes")]
[Authorize]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _service;
    public ReportesController(IReporteService service) => _service = service;

    [HttpGet("expedientes-por-estado")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<ExpedienteEstadoResumen>>>> ExpedientesPorEstado()
        => Ok(ApiResponse<ReporteRespuesta<ExpedienteEstadoResumen>>.Correcto(
            await _service.ExpedientesPorEstadoAsync()));

    [HttpGet("expedientes-por-rama")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<ExpedienteRamaResumen>>>> ExpedientesPorRama()
        => Ok(ApiResponse<ReporteRespuesta<ExpedienteRamaResumen>>.Correcto(
            await _service.ExpedientesPorRamaAsync()));

    [HttpGet("alertas-pendientes")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<AlertaPendiente>>>> AlertasPendientes()
        => Ok(ApiResponse<ReporteRespuesta<AlertaPendiente>>.Correcto(
            await _service.AlertasPendientesAsync()));

    // ... 8 endpoints más siguiendo el mismo patrón
}
```

### 3.4 Registro en Program.cs

```csharp
builder.Services.AddScoped<IReporteService, ReporteService>();
```

---

## 4. Pruebas de Endpoints

```http
### Expedientes por estado
GET http://localhost:5181/api/reportes/expedientes-por-estado
Authorization: Bearer <token>

### Expedientes por rama
GET http://localhost:5181/api/reportes/expedientes-por-rama
Authorization: Bearer <token>

### Alertas pendientes
GET http://localhost:5181/api/reportes/alertas-pendientes
Authorization: Bearer <token>

### Plazos vencimiento
GET http://localhost:5181/api/reportes/plazos-vencimiento
Authorization: Bearer <token>
```

---

## 5. Frontend

### 5.1 Service — `core/services/reportes-service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/reportes`;

  expedientesPorEstado() { return this.http.get<RespuestaApi<ReporteRespuesta<any>>>(`${this.base}/expedientes-por-estado`); }
  expedientesPorRama() { return this.http.get<RespuestaApi<ReporteRespuesta<any>>>(`${this.base}/expedientes-por-rama`); }
  // ... 9 métodos más
}
```

### 5.2 Sub-páginas nuevas (4)

| Archivo | Reporte |
|---------|---------|
| `reportes-agenda-page.ts` + `.html` | Eventos agenda del mes |
| `reportes-tramites-page.ts` + `.html` | Gestión de trámites |
| `reportes-notificaciones-page.ts` + `.html` | Notificaciones OJ |
| `reportes-rendimiento-page.ts` + `.html` | Rendimiento del bufete |

### 5.3 Actualizar reportes-page.ts

Importar los 4 nuevos componentes y agregar `@if` para cada reporte.

---

## 6. Tests Playwright

### Actualizar `06-reportes.spec.ts`

```typescript
test('reporte de expedientes por rama muestra datos', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/reportes');
  await page.click('[data-testid="reporte-expedientes-rama"]');
  await expect(page.locator('[data-testid="reporte-titulo"]')).toContainText('Expedientes por Rama');
  await expect(page.locator('[data-testid="grafica-barras"]')).toBeVisible();
});

test('reporte de agenda muestra datos', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/reportes');
  await page.click('[data-testid="reporte-agenda"]');
  await expect(page.locator('[data-testid="reporte-titulo"]')).toBeVisible();
});
```

---

## 7. Criterios de Aceptación

- [ ] Los 4 SPs corregidos ejecutan sin errores
- [ ] Los 11 endpoints retornan datos
- [ ] Las 6 sub-páginas de reportes están implementadas
- [ ] Gráficas SVG/CSS renderizan correctamente
- [ ] PDF export funciona en todas las sub-páginas
- [ ] `npx ng build` exitoso
- [ ] Tests Playwright pasan
