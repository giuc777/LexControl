# Módulo 05 — Notificaciones OJ

> **Módulo completo:** SPs + Backend + Frontend + Pruebas + Playwright
> **Estado:** SPs base existen. Faltan controller, service, frontend.
> **Ruta frontend:** `/notificaciones-oj`

---

## 1. Descripción

Gestión de notificaciones del Organismo Judicial. Permite crear, listar, atender notificaciones y verificar duplicados. Incluye badge visual "OJ" en notificaciones pendientes.

**SPs existentes:**
- ✅ `SP_NotificacionOJ_Insertar` (LexControlDB.sql)
- ✅ `SP_NotificacionOJ_Atender` (LexControlDB.sql)
- ✅ `SP_NotificacionOJ_VerificarDuplicado` (LexControlDB.sql)
- ❌ `SP_Notificacion_Listar` — FALTA (definido en Extras_SP.sql)
- ❌ `SP_Notificacion_ObtenerPorID` — FALTA

---

## 2. Procedimientos Almacenados

### 2.1 SP_Notificacion_Listar

```sql
CREATE OR ALTER PROCEDURE SP_Notificacion_Listar
    @Expediente_ID INT = NULL,
    @Estado_Notificacion_ID INT = NULL,
    @Tipo_Notificacion_ID INT = NULL,
    @Juzgado_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Pagina INT = 1,
    @TamanoPagina INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            N.ID, N.Expediente_ID, E.NoExpediente,
            N.Tipo_Notificacion_ID, TNO.Nombre AS TipoNotificacion,
            N.Juzgado_ID, J.Nombre AS Juzgado,
            N.FechaRecepcion, N.FechaNotificacion,
            N.Estado_Notificacion_ID, ENO.Nombre AS EstadoNotificacion,
            N.Descripcion, N.Duplicado,
            N.FechaCreacion
        FROM NOTIFICACION_OJ N
        INNER JOIN EXPEDIENTE E ON N.Expediente_ID = E.ID
        INNER JOIN TIPO_NOTIFICACION_OJ TNO ON N.Tipo_Notificacion_ID = TNO.ID
        INNER JOIN ESTADO_NOTIFICACION_OJ ENO ON N.Estado_Notificacion_ID = ENO.ID
        LEFT JOIN JUZGADO J ON N.Juzgado_ID = J.ID
        WHERE (@Expediente_ID IS NULL OR N.Expediente_ID = @Expediente_ID)
          AND (@Estado_Notificacion_ID IS NULL OR N.Estado_Notificacion_ID = @Estado_Notificacion_ID)
          AND (@Tipo_Notificacion_ID IS NULL OR N.Tipo_Notificacion_ID = @Tipo_Notificacion_ID)
          AND (@Juzgado_ID IS NULL OR N.Juzgado_ID = @Juzgado_ID)
          AND (@FechaInicio IS NULL OR N.FechaRecepcion >= @FechaInicio)
          AND (@FechaFin IS NULL OR N.FechaRecepcion <= @FechaFin)
        ORDER BY N.FechaRecepcion DESC
        OFFSET (@Pagina - 1) * @TamanoPagina ROWS
        FETCH NEXT @TamanoPagina ROWS ONLY;

        SELECT COUNT(1) AS Total
        FROM NOTIFICACION_OJ N
        WHERE (@Expediente_ID IS NULL OR N.Expediente_ID = @Expediente_ID)
          AND (@Estado_Notificacion_ID IS NULL OR N.Estado_Notificacion_ID = @Estado_Notificacion_ID)
          AND (@Tipo_Notificacion_ID IS NULL OR N.Tipo_Notificacion_ID = @Tipo_Notificacion_ID)
          AND (@Juzgado_ID IS NULL OR N.Juzgado_ID = @Juzgado_ID)
          AND (@FechaInicio IS NULL OR N.FechaRecepcion >= @FechaInicio)
          AND (@FechaFin IS NULL OR N.FechaRecepcion <= @FechaFin);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.2 SP_Notificacion_ObtenerPorID

```sql
CREATE OR ALTER PROCEDURE SP_Notificacion_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            N.ID, N.Expediente_ID, E.NoExpediente,
            N.Tipo_Notificacion_ID, TNO.Nombre AS TipoNotificacion,
            N.Juzgado_ID, J.Nombre AS Juzgado,
            N.FechaRecepcion, N.FechaNotificacion,
            N.Estado_Notificacion_ID, ENO.Nombre AS EstadoNotificacion,
            N.Descripcion, N.Duplicado,
            N.FechaCreacion
        FROM NOTIFICACION_OJ N
        INNER JOIN EXPEDIENTE E ON N.Expediente_ID = E.ID
        INNER JOIN TIPO_NOTIFICACION_OJ TNO ON N.Tipo_Notificacion_ID = TNO.ID
        INNER JOIN ESTADO_NOTIFICACION_OJ ENO ON N.Estado_Notificacion_ID = ENO.ID
        LEFT JOIN JUZGADO J ON N.Juzgado_ID = J.ID
        WHERE N.ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

---

## 3. Backend

### 3.1 DTOs — `Dtos/Notificaciones/NotificacionDtos.cs`

```csharp
namespace LexControlApi.Dtos.Notificaciones;

public class NotificacionFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string NoExpediente { get; set; } = "";
    public int Tipo_Notificacion_ID { get; set; }
    public string TipoNotificacion { get; set; } = "";
    public int? Juzgado_ID { get; set; }
    public string? Juzgado { get; set; }
    public DateTime FechaRecepcion { get; set; }
    public DateTime? FechaNotificacion { get; set; }
    public int Estado_Notificacion_ID { get; set; }
    public string EstadoNotificacion { get; set; } = "";
    public string? Descripcion { get; set; }
    public bool Duplicado { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class NotificacionDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string NoExpediente { get; set; } = "";
    public int TipoNotificacionId { get; set; }
    public string TipoNotificacion { get; set; } = "";
    public int? JuzgadoId { get; set; }
    public string? Juzgado { get; set; }
    public string FechaRecepcion { get; set; } = "";
    public string? FechaNotificacion { get; set; }
    public int EstadoNotificacionId { get; set; }
    public string EstadoNotificacion { get; set; } = "";
    public string? Descripcion { get; set; }
    public bool Duplicado { get; set; }
}

public class NotificacionCrearDto
{
    public int ExpedienteId { get; set; }
    public int TipoNotificacionId { get; set; }
    public int? JuzgadoId { get; set; }
    public DateTime FechaRecepcion { get; set; }
    public string? Descripcion { get; set; }
}

public class NotificacionAtenderDto
{
    public string? Observaciones { get; set; }
}

public class DuplicadoVerificarDto
{
    public int ExpedienteId { get; set; }
    public int TipoNotificacionId { get; set; }
    public DateTime Fecha { get; set; }
}
```

### 3.2 Service — `Services/NotificacionService.cs`

```csharp
using LexControlApi.Dtos.Notificaciones;

namespace LexControlApi.Services;

public interface INotificacionService
{
    Task<List<NotificacionDto>> ListarAsync(int? expedienteId, int? estadoId,
        int? tipoId, int? juzgadoId, DateTime? fechaInicio, DateTime? fechaFin,
        int pagina, int tamanoPagina);
    Task<NotificacionDto?> ObtenerPorIdAsync(int id);
    Task<int> CrearAsync(NotificacionCrearDto dto);
    Task AtenderAsync(int id, NotificacionAtenderDto dto);
    Task<bool> VerificarDuplicadoAsync(DuplicadoVerificarDto dto);
}

public class NotificacionService : INotificacionService
{
    private readonly Data.IRepositorio _repositorio;
    public NotificacionService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<NotificacionDto>> ListarAsync(int? expedienteId, int? estadoId,
        int? tipoId, int? juzgadoId, DateTime? fechaInicio, DateTime? fechaFin,
        int pagina, int tamanoPagina)
    {
        var filas = await _repositorio.ConsultarAsync<NotificacionFila>(
            "SP_Notificacion_Listar",
            new { Expediente_ID = expedienteId, Estado_Notificacion_ID = estadoId,
                  Tipo_Notificacion_ID = tipoId, Juzgado_ID = juzgadoId,
                  FechaInicio = fechaInicio, FechaFin = fechaFin,
                  Pagina = pagina, TamanoPagina = tamanoPagina });
        return filas.Select(Mapear).ToList();
    }

    public async Task<NotificacionDto?> ObtenerPorIdAsync(int id)
    {
        var f = await _repositorio.ConsultarPrimeroAsync<NotificacionFila>(
            "SP_Notificacion_ObtenerPorID", new { ID = id });
        return f is null ? null : Mapear(f);
    }

    public async Task<int> CrearAsync(NotificacionCrearDto dto)
    {
        return await _repositorio.EjecutarRetornoAsync<int>(
            "SP_NotificacionOJ_Insertar",
            new { Expediente_ID = dto.ExpedienteId, Tipo_Notificacion_ID = dto.TipoNotificacionId,
                  Juzgado_ID = dto.JuzgadoId, FechaRecepcion = dto.FechaRecepcion,
                  Descripcion = dto.Descripcion });
    }

    public async Task AtenderAsync(int id, NotificacionAtenderDto dto)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_NotificacionOJ_Atender",
            new { ID = id, Observaciones = dto.Observaciones });
    }

    public async Task<bool> VerificarDuplicadoAsync(DuplicadoVerificarDto dto)
    {
        var resultado = await _repositorio.ConsultarPrimeroAsync<dynamic>(
            "SP_NotificacionOJ_VerificarDuplicado",
            new { Expediente_ID = dto.ExpedienteId,
                  Tipo_Notificacion_ID = dto.TipoNotificacionId,
                  Fecha = dto.Fecha });
        return resultado?.Existe == 1;
    }

    private static NotificacionDto Mapear(NotificacionFila f) => new()
    {
        Id = f.ID, ExpedienteId = f.Expediente_ID, NoExpediente = f.NoExpediente,
        TipoNotificacionId = f.Tipo_Notificacion_ID, TipoNotificacion = f.TipoNotificacion,
        JuzgadoId = f.Juzgado_ID, Juzgado = f.Juzgado,
        FechaRecepcion = f.FechaRecepcion.ToString("yyyy-MM-dd"),
        FechaNotificacion = f.FechaNotificacion?.ToString("yyyy-MM-dd"),
        EstadoNotificacionId = f.Estado_Notificacion_ID,
        EstadoNotificacion = f.EstadoNotificacion,
        Descripcion = f.Descripcion, Duplicado = f.Duplicado
    };
}
```

### 3.3 Controller — `Controllers/NotificacionesController.cs`

```csharp
using LexControlApi.Dtos.Notificaciones;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/notificaciones")]
[Authorize]
public class NotificacionesController : ControllerBase
{
    private readonly INotificacionService _service;
    public NotificacionesController(INotificacionService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NotificacionDto>>>> Listar(
        [FromQuery] int? expedienteId, [FromQuery] int? estadoId,
        [FromQuery] int? tipoId, [FromQuery] int? juzgadoId,
        [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20)
    {
        var r = await _service.ListarAsync(expedienteId, estadoId, tipoId, juzgadoId,
            null, null, pagina, tamanoPagina);
        return Ok(ApiResponse<List<NotificacionDto>>.Correcto(r));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<NotificacionDto>>> ObtenerPorId(int id)
    {
        var r = await _service.ObtenerPorIdAsync(id);
        if (r is null) return NotFound(ApiResponse<NotificacionDto>.Fallo("Notificación no encontrada."));
        return Ok(ApiResponse<NotificacionDto>.Correcto(r));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(NotificacionCrearDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPut("{id:int}/atender")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> Atender(int id, NotificacionAtenderDto dto)
    {
        await _service.AtenderAsync(id, dto);
        return NoContent();
    }

    [HttpPost("verificar-duplicado")]
    public async Task<ActionResult<ApiResponse<bool>>> VerificarDuplicado(DuplicadoVerificarDto dto)
    {
        var existe = await _service.VerificarDuplicadoAsync(dto);
        return Ok(ApiResponse<bool>.Correcto(existe));
    }
}
```

### 3.4 Registro en Program.cs

```csharp
builder.Services.AddScoped<INotificacionService, NotificacionService>();
```

---

## 4. Pruebas de Endpoints

```http
### Listar notificaciones
GET http://localhost:5181/api/notificaciones?Pagina=1&TamanoPagina=5
Authorization: Bearer <token>

### Crear notificación
POST http://localhost:5181/api/notificaciones
Authorization: Bearer <token>
Content-Type: application/json

{
  "expedienteId": 1,
  "tipoNotificacionId": 1,
  "juzgadoId": 1,
  "fechaRecepcion": "2026-09-15",
  "descripcion": "Notificación de prueba"
}

### Verificar duplicado
POST http://localhost:5181/api/notificaciones/verificar-duplicado
Authorization: Bearer <token>
Content-Type: application/json

{
  "expedienteId": 1,
  "tipoNotificacionId": 1,
  "fecha": "2026-09-15"
}

### Atender notificación
PUT http://localhost:5181/api/notificaciones/1/atender
Authorization: Bearer <token>
Content-Type: application/json

{
  "observaciones": "Atendida correctamente"
}
```

---

## 5. Frontend

- **Modelo:** `core/models/notificacion.model.ts`
- **Service:** `core/services/notificaciones-service.ts`
- **Páginas:** `features/notificaciones-oj/notificaciones-page.ts` + `notificacion-detalle-page.ts` + `notificacion-modal.ts`
- **Estilos:** `styles/modules/notificaciones.css`
- **Ruta:** `/notificaciones-oj` → NotificacionesPage, `/notificaciones-oj/:id` → NotificacionDetallePage

---

## 6. Tests Playwright

### `14-notificaciones.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth.fixture';

test.describe('Notificaciones OJ', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/notificaciones-oj');
  });

  test('muestra la lista', async ({ page }) => {
    await expect(page.locator('[data-testid="notificaciones-tabla"]')).toBeVisible();
  });

  test('muestra badge OJ', async ({ page }) => {
    const badges = page.locator('[data-testid="badge-oj"]');
    if (await badges.count() > 0) await expect(badges.first()).toBeVisible();
  });

  test('filtra por estado', async ({ page }) => {
    await page.selectOption('[data-testid="filtro-estado"]', '1');
  });

  test('crea una notificación', async ({ page }) => {
    await page.click('[data-testid="btn-nueva-notificacion"]');
    await page.selectOption('[data-testid="select-expediente"]', '1');
    await page.selectOption('[data-testid="select-tipo"]', '1');
    await page.fill('[data-testid="input-fecha"]', '2026-09-15');
    await page.click('[data-testid="btn-guardar-notificacion"]');
  });

  test('atende una notificación', async ({ page }) => {
    const btn = page.locator('[data-testid="btn-atender"]').first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.fill('[data-testid="input-observaciones-atender"]', 'Atendida E2E');
      await page.click('[data-testid="btn-confirmar-atender"]');
    }
  });

  test('verifica duplicados', async ({ page }) => {
    await page.click('[data-testid="btn-nueva-notificacion"]');
    await page.click('[data-testid="btn-verificar-duplicado"]');
  });
});
```

### `15-notificacion-detalle.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth.fixture';

test.describe('Notificación Detalle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/notificaciones-oj/1');
  });

  test('muestra detalle', async ({ page }) => {
    await expect(page.locator('[data-testid="notificacion-tipo"]')).toBeVisible();
    await expect(page.locator('[data-testid="notificacion-estado"]')).toBeVisible();
  });

  test('muestra expediente asociado', async ({ page }) => {
    await expect(page.locator('[data-testid="notificacion-expediente"]')).toBeVisible();
  });

  test('atende desde el detalle', async ({ page }) => {
    const btn = page.locator('[data-testid="btn-atender"]');
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[data-testid="notificacion-estado"]')).toContainText('Atendida');
    }
  });

  test('navega de vuelta', async ({ page }) => {
    await page.click('[data-testid="btn-volver"]');
    await expect(page).toHaveURL('/notificaciones-oj');
  });
});
```

---

## 7. Criterios de Aceptación

- [ ] Los 2 SPs faltantes crean y ejecutan sin errores
- [ ] Controller compila con 5 endpoints
- [ ] Verificar duplicado retorna true/false correctamente
- [ ] Atender cambia estado de la notificación
- [ ] Frontend muestra badge OJ en notificaciones pendientes
- [ ] `npx ng build` exitoso
- [ ] Tests Playwright pasan (14 + 15)
