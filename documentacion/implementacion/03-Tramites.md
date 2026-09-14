# Módulo 03 — Trámites

> **Módulo completo:** SPs + Backend + Frontend + Pruebas + Playwright
> **Estado:** SPs base existen. Faltan service, controller, frontend.
> **Ruta frontend:** `/tramites`

---

## 1. Descripción

Gestión de trámites judiciales asociados a expedientes. Permite crear, listar, cambiar estado y registrar resolución.

**SPs existentes:**
- ✅ `SP_Tramite_Insertar` (LexControlDB.sql)
- ✅ `SP_Tramite_ActualizarEstado` (LexControlDB.sql)
- ❌ `SP_Tramite_Listar` — FALTA (definido en Extras_SP.sql pero no ejecutado)
- ❌ `SP_Tramite_ObtenerPorID` — FALTA

---

## 2. Procedimientos Almacenados

### 2.1 SP_Tramite_Listar

```sql
CREATE OR ALTER PROCEDURE SP_Tramite_Listar
    @Expediente_ID INT = NULL,
    @Estado_Tramite_ID INT = NULL,
    @Tipo_Tramite_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Pagina INT = 1,
    @TamanoPagina INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            T.ID, T.Expediente_ID, E.NoExpediente,
            T.Tipo_Tramite_ID, TT.Nombre AS TipoTramite,
            T.Institucion, T.Descripcion,
            T.Estado_Tramite_ID, ET.Nombre AS EstadoTramite,
            T.FechaIngreso, T.FechaResolucion, T.Resolucion,
            U.NombreCompleto AS Abogado,
            T.FechaCreacion
        FROM TRAMITE T
        INNER JOIN EXPEDIENTE E ON T.Expediente_ID = E.ID
        INNER JOIN TIPO_TRAMITE TT ON T.Tipo_Tramite_ID = TT.ID
        INNER JOIN ESTADO_TRAMITE ET ON T.Estado_Tramite_ID = ET.ID
        LEFT JOIN USUARIO U ON T.Abogado_ID = U.ID
        WHERE (@Expediente_ID IS NULL OR T.Expediente_ID = @Expediente_ID)
          AND (@Estado_Tramite_ID IS NULL OR T.Estado_Tramite_ID = @Estado_Tramite_ID)
          AND (@Tipo_Tramite_ID IS NULL OR T.Tipo_Tramite_ID = @Tipo_Tramite_ID)
          AND (@FechaInicio IS NULL OR T.FechaIngreso >= @FechaInicio)
          AND (@FechaFin IS NULL OR T.FechaIngreso <= @FechaFin)
        ORDER BY T.FechaIngreso DESC
        OFFSET (@Pagina - 1) * @TamanoPagina ROWS
        FETCH NEXT @TamanoPagina ROWS ONLY;

        SELECT COUNT(1) AS Total
        FROM TRAMITE T
        WHERE (@Expediente_ID IS NULL OR T.Expediente_ID = @Expediente_ID)
          AND (@Estado_Tramite_ID IS NULL OR T.Estado_Tramite_ID = @Estado_Tramite_ID)
          AND (@Tipo_Tramite_ID IS NULL OR T.Tipo_Tramite_ID = @Tipo_Tramite_ID)
          AND (@FechaInicio IS NULL OR T.FechaIngreso >= @FechaInicio)
          AND (@FechaFin IS NULL OR T.FechaIngreso <= @FechaFin);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.2 SP_Tramite_ObtenerPorID

```sql
CREATE OR ALTER PROCEDURE SP_Tramite_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            T.ID, T.Expediente_ID, E.NoExpediente,
            T.Tipo_Tramite_ID, TT.Nombre AS TipoTramite,
            T.Institucion, T.Descripcion,
            T.Estado_Tramite_ID, ET.Nombre AS EstadoTramite,
            T.FechaIngreso, T.FechaResolucion, T.Resolucion,
            U.NombreCompleto AS Abogado,
            T.Activo, T.FechaCreacion
        FROM TRAMITE T
        INNER JOIN EXPEDIENTE E ON T.Expediente_ID = E.ID
        INNER JOIN TIPO_TRAMITE TT ON T.Tipo_Tramite_ID = TT.ID
        INNER JOIN ESTADO_TRAMITE ET ON T.Estado_Tramite_ID = ET.ID
        LEFT JOIN USUARIO U ON T.Abogado_ID = U.ID
        WHERE T.ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

---

## 3. Backend

### 3.1 DTOs — `Dtos/Tramites/TramiteDtos.cs`

```csharp
namespace LexControlApi.Dtos.Tramites;

public class TramiteFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string NoExpediente { get; set; } = "";
    public int Tipo_Tramite_ID { get; set; }
    public string TipoTramite { get; set; } = "";
    public string Institucion { get; set; } = "";
    public string? Descripcion { get; set; }
    public int Estado_Tramite_ID { get; set; }
    public string EstadoTramite { get; set; } = "";
    public DateTime FechaIngreso { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public string? Resolucion { get; set; }
    public string? Abogado { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class TramiteDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string NoExpediente { get; set; } = "";
    public int TipoTramiteId { get; set; }
    public string TipoTramite { get; set; } = "";
    public string Institucion { get; set; } = "";
    public string? Descripcion { get; set; }
    public int EstadoTramiteId { get; set; }
    public string EstadoTramite { get; set; } = "";
    public string FechaIngreso { get; set; } = "";
    public string? FechaResolucion { get; set; }
    public string? Resolucion { get; set; }
    public string? Abogado { get; set; }
}

public class TramiteCrearDto
{
    public int ExpedienteId { get; set; }
    public int TipoTramiteId { get; set; }
    public string Institucion { get; set; } = "";
    public string? Descripcion { get; set; }
    public int? AbogadoId { get; set; }
}

public class TramiteEstadoDto
{
    public int EstadoTramiteId { get; set; }
    public string? Resolucion { get; set; }
}
```

### 3.2 Service — `Services/TramiteService.cs`

```csharp
using LexControlApi.Dtos.Tramites;

namespace LexControlApi.Services;

public interface ITramiteService
{
    Task<List<TramiteDto>> ListarAsync(int? expedienteId, int? estadoId, int? tipoId,
        DateTime? fechaInicio, DateTime? fechaFin, int pagina, int tamanoPagina);
    Task<TramiteDto?> ObtenerPorIdAsync(int id);
    Task<int> CrearAsync(TramiteCrearDto dto);
    Task ActualizarEstadoAsync(int id, TramiteEstadoDto dto);
}

public class TramiteService : ITramiteService
{
    private readonly Data.IRepositorio _repositorio;

    public TramiteService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<TramiteDto>> ListarAsync(int? expedienteId, int? estadoId, int? tipoId,
        DateTime? fechaInicio, DateTime? fechaFin, int pagina, int tamanoPagina)
    {
        var filas = await _repositorio.ConsultarAsync<TramiteFila>(
            "SP_Tramite_Listar",
            new { Expediente_ID = expedienteId, Estado_Tramite_ID = estadoId,
                  Tipo_Tramite_ID = tipoId, FechaInicio = fechaInicio, FechaFin = fechaFin,
                  Pagina = pagina, TamanoPagina = tamanoPagina });
        return filas.Select(Mapear).ToList();
    }

    public async Task<TramiteDto?> ObtenerPorIdAsync(int id)
    {
        var f = await _repositorio.ConsultarPrimeroAsync<TramiteFila>(
            "SP_Tramite_ObtenerPorID", new { ID = id });
        return f is null ? null : Mapear(f);
    }

    public async Task<int> CrearAsync(TramiteCrearDto dto)
    {
        return await _repositorio.EjecutarRetornoAsync<int>(
            "SP_Tramite_Insertar",
            new { Expediente_ID = dto.ExpedienteId, Tipo_Tramite_ID = dto.TipoTramiteId,
                  Institucion = dto.Institucion, Descripcion = dto.Descripcion,
                  Abogado_ID = dto.AbogadoId });
    }

    public async Task ActualizarEstadoAsync(int id, TramiteEstadoDto dto)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_Tramite_ActualizarEstado",
            new { ID = id, Estado_Tramite_ID = dto.EstadoTramiteId,
                  Resolucion = dto.Resolucion });
    }

    private static TramiteDto Mapear(TramiteFila f) => new()
    {
        Id = f.ID, ExpedienteId = f.Expediente_ID, NoExpediente = f.NoExpediente,
        TipoTramiteId = f.Tipo_Tramite_ID, TipoTramite = f.TipoTramite,
        Institucion = f.Institucion, Descripcion = f.Descripcion,
        EstadoTramiteId = f.Estado_Tramite_ID, EstadoTramite = f.EstadoTramite,
        FechaIngreso = f.FechaIngreso.ToString("yyyy-MM-dd"),
        FechaResolucion = f.FechaResolucion?.ToString("yyyy-MM-dd"),
        Resolucion = f.Resolucion, Abogado = f.Abogado
    };
}
```

### 3.3 Controller — `Controllers/TramitesController.cs`

```csharp
using LexControlApi.Dtos.Tramites;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/tramites")]
[Authorize]
public class TramitesController : ControllerBase
{
    private readonly ITramiteService _service;
    public TramitesController(ITramiteService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TramiteDto>>>> Listar(
        [FromQuery] int? expedienteId, [FromQuery] int? estadoId,
        [FromQuery] int? tipoId, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20)
    {
        var r = await _service.ListarAsync(expedienteId, estadoId, tipoId, null, null, pagina, tamanoPagina);
        return Ok(ApiResponse<List<TramiteDto>>.Correcto(r));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<TramiteDto>>> ObtenerPorId(int id)
    {
        var r = await _service.ObtenerPorIdAsync(id);
        if (r is null) return NotFound(ApiResponse<TramiteDto>.Fallo("Trámite no encontrado."));
        return Ok(ApiResponse<TramiteDto>.Correcto(r));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(TramiteCrearDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPut("{id:int}/estado")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> CambiarEstado(int id, TramiteEstadoDto dto)
    {
        await _service.ActualizarEstadoAsync(id, dto);
        return NoContent();
    }
}
```

### 3.4 Registro en Program.cs

```csharp
builder.Services.AddScoped<ITramiteService, TramiteService>();
```

---

## 4. Pruebas de Endpoints

```http
### Listar trámites
GET http://localhost:5181/api/tramites?Pagina=1&TamanoPagina=5
Authorization: Bearer <token>

### Crear trámite
POST http://localhost:5181/api/tramites
Authorization: Bearer <token>
Content-Type: application/json

{
  "expedienteId": 1,
  "tipoTramiteId": 1,
  "institucion": "Juzgado de Prueba",
  "descripcion": "Trámite de prueba"
}

### Cambiar estado
PUT http://localhost:5181/api/tramites/1/estado
Authorization: Bearer <token>
Content-Type: application/json

{
  "estadoTramiteId": 2,
  "resolucion": "En proceso de revisión"
}
```

---

## 5. Frontend

- **Modelo:** `core/models/tramite.model.ts`
- **Service:** `core/services/tramites-service.ts` (listar, obtenerPorId, crear, cambiarEstado)
- **Páginas:** `features/tramites/tramites-page.ts` + `tramite-detalle-page.ts` + `tramite-modal.ts`
- **Estilos:** `styles/modules/tramites.css`
- **Ruta:** `/tramites` → TramitesPage, `/tramites/:id` → TramiteDetallePage

---

## 6. Tests Playwright

### `12-tramites.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth.fixture';

test.describe('Trámites', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/tramites');
  });

  test('muestra la lista', async ({ page }) => {
    await expect(page.locator('[data-testid="tramites-tabla"]')).toBeVisible();
  });

  test('filtra por estado', async ({ page }) => {
    await page.selectOption('[data-testid="filtro-estado"]', '1');
  });

  test('crea un trámite', async ({ page }) => {
    await page.click('[data-testid="btn-nuevo-tramite"]');
    await page.selectOption('[data-testid="select-expediente"]', '1');
    await page.selectOption('[data-testid="select-tipo"]', '1');
    await page.fill('[data-testid="input-institucion"]', 'Juzgado E2E');
    await page.fill('[data-testid="input-descripcion"]', 'Trámite E2E');
    await page.click('[data-testid="btn-guardar-tramite"]');
    await expect(page.locator('[data-testid="tramites-tabla"]')).toContainText('Trámite E2E');
  });

  test('navega al detalle', async ({ page }) => {
    await page.locator('tr').first().click();
    await expect(page).toHaveURL(/\/tramites\/\d+/);
  });
});
```

### `13-tramite-detalle.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth.fixture';

test.describe('Trámite Detalle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/tramites/1');
  });

  test('muestra detalle', async ({ page }) => {
    await expect(page.locator('[data-testid="tramite-tipo"]')).toBeVisible();
    await expect(page.locator('[data-testid="tramite-estado"]')).toBeVisible();
  });

  test('cambia estado', async ({ page }) => {
    await page.click('[data-testid="btn-cambiar-estado"]');
    await page.selectOption('[data-testid="select-estado"]', '2');
    await page.fill('[data-testid="input-resolucion"]', 'En proceso');
    await page.click('[data-testid="btn-guardar-estado"]');
  });

  test('navega de vuelta', async ({ page }) => {
    await page.click('[data-testid="btn-volver"]');
    await expect(page).toHaveURL('/tramites');
  });
});
```

---

## 7. Criterios de Aceptación

- [ ] SPs crean y ejecutan sin errores
- [ ] Controller compila con 4 endpoints
- [ ] Frontend muestra lista con filtros y paginación
- [ ] Crear trámite funciona desde el modal
- [ ] Cambiar estado funciona desde el detalle
- [ ] `npx ng build` exitoso
- [ ] Tests Playwright pasan (12 + 13)
