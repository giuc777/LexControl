# Módulo 04 — Diligencias (Histórico Legal)

> **Módulo completo:** SPs + Backend + Frontend + Pruebas + Playwright
> **Estado:** No existe ningún SP. Tabla DILIGENCIA definida en BD.
> **Ruta frontend:** `/historico`

---

## 1. Descripción

Gestión de diligencias judiciales (tareas/actuaciones procesales). Permite CRUD completo: crear, listar, obtener, actualizar y eliminar diligencias asociadas a expedientes.

**Estado:** Módulo desde cero. La tabla `DILIGENCIA` existe pero no tiene SPs.

---

## 2. Procedimientos Almacenados

### 2.1 SP_Diligencia_Insertar

```sql
CREATE OR ALTER PROCEDURE SP_Diligencia_Insertar
    @Expediente_ID INT,
    @Tipo_Diligencia_ID INT,
    @Descripcion NVARCHAR(1000),
    @FechaProgramada DATETIME = NULL,
    @Abogado_ID INT = NULL,
    @NotasInternas NVARCHAR(2000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO DILIGENCIA (
            Expediente_ID, Tipo_Diligencia_ID, Descripcion,
            FechaProgramada, Abogado_ID, NotasInternas,
            Estado_Diligencia_ID, Activo, FechaCreacion
        )
        VALUES (
            @Expediente_ID, @Tipo_Diligencia_ID, @Descripcion,
            @FechaProgramada, @Abogado_ID, @NotasInternas,
            1, 1, GETDATE()
        );
        SELECT SCOPE_IDENTITY() AS ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.2 SP_Diligencia_Listar

```sql
CREATE OR ALTER PROCEDURE SP_Diligencia_Listar
    @Expediente_ID INT = NULL,
    @Tipo_Diligencia_ID INT = NULL,
    @Estado_Diligencia_ID INT = NULL,
    @Abogado_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Pagina INT = 1,
    @TamanoPagina INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            D.ID, D.Expediente_ID, E.NoExpediente,
            D.Tipo_Diligencia_ID, TD.Nombre AS TipoDiligencia,
            D.Descripcion, D.FechaProgramada, D.FechaCompletada,
            D.Estado_Diligencia_ID, ED.Nombre AS EstadoDiligencia,
            D.Abogado_ID, P.NombreCompleto AS Abogado,
            D.NotasInternas, D.FechaCreacion
        FROM DILIGENCIA D
        INNER JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
        INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_Diligencia_ID = TD.ID
        INNER JOIN ESTADO_DILIGENCIA ED ON D.Estado_Diligencia_ID = ED.ID
        LEFT JOIN USUARIO U ON D.Abogado_ID = U.ID
        LEFT JOIN PERSONA P ON U.Persona_ID = P.ID
        WHERE D.Activo = 1
          AND (@Expediente_ID IS NULL OR D.Expediente_ID = @Expediente_ID)
          AND (@Tipo_Diligencia_ID IS NULL OR D.Tipo_Diligencia_ID = @Tipo_Diligencia_ID)
          AND (@Estado_Diligencia_ID IS NULL OR D.Estado_Diligencia_ID = @Estado_Diligencia_ID)
          AND (@Abogado_ID IS NULL OR D.Abogado_ID = @Abogado_ID)
          AND (@FechaInicio IS NULL OR D.FechaProgramada >= @FechaInicio)
          AND (@FechaFin IS NULL OR D.FechaProgramada <= @FechaFin)
        ORDER BY D.FechaProgramada DESC
        OFFSET (@Pagina - 1) * @TamanoPagina ROWS
        FETCH NEXT @TamanoPagina ROWS ONLY;

        SELECT COUNT(1) AS Total
        FROM DILIGENCIA D
        WHERE D.Activo = 1
          AND (@Expediente_ID IS NULL OR D.Expediente_ID = @Expediente_ID)
          AND (@Tipo_Diligencia_ID IS NULL OR D.Tipo_Diligencia_ID = @Tipo_Diligencia_ID)
          AND (@Estado_Diligencia_ID IS NULL OR D.Estado_Diligencia_ID = @Estado_Diligencia_ID)
          AND (@Abogado_ID IS NULL OR D.Abogado_ID = @Abogado_ID)
          AND (@FechaInicio IS NULL OR D.FechaProgramada >= @FechaInicio)
          AND (@FechaFin IS NULL OR D.FechaProgramada <= @FechaFin);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.3 SP_Diligencia_ObtenerPorID

```sql
CREATE OR ALTER PROCEDURE SP_Diligencia_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            D.ID, D.Expediente_ID, E.NoExpediente,
            D.Tipo_Diligencia_ID, TD.Nombre AS TipoDiligencia,
            D.Descripcion, D.FechaProgramada, D.FechaCompletada,
            D.Estado_Diligencia_ID, ED.Nombre AS EstadoDiligencia,
            D.Abogado_ID, P.NombreCompleto AS Abogado,
            D.NotasInternas, D.Activo, D.FechaCreacion
        FROM DILIGENCIA D
        INNER JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
        INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_Diligencia_ID = TD.ID
        INNER JOIN ESTADO_DILIGENCIA ED ON D.Estado_Diligencia_ID = ED.ID
        LEFT JOIN USUARIO U ON D.Abogado_ID = U.ID
        LEFT JOIN PERSONA P ON U.Persona_ID = P.ID
        WHERE D.ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.4 SP_Diligencia_Actualizar

```sql
CREATE OR ALTER PROCEDURE SP_Diligencia_Actualizar
    @ID INT,
    @Tipo_Diligencia_ID INT = NULL,
    @Descripcion NVARCHAR(1000) = NULL,
    @FechaProgramada DATETIME = NULL,
    @Abogado_ID INT = NULL,
    @Estado_Diligencia_ID INT = NULL,
    @NotasInternas NVARCHAR(2000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM DILIGENCIA WHERE ID = @ID AND Activo = 1)
        BEGIN
            RAISERROR('Diligencia no encontrada.', 16, 1);
            RETURN;
        END

        UPDATE DILIGENCIA
        SET Tipo_Diligencia_ID = ISNULL(@Tipo_Diligencia_ID, Tipo_Diligencia_ID),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            FechaProgramada = ISNULL(@FechaProgramada, FechaProgramada),
            Abogado_ID = ISNULL(@Abogado_ID, Abogado_ID),
            Estado_Diligencia_ID = ISNULL(@Estado_Diligencia_ID, Estado_Diligencia_ID),
            NotasInternas = ISNULL(@NotasInternas, NotasInternas),
            FechaCompletada = CASE WHEN @Estado_Diligencia_ID = 3 THEN GETDATE() ELSE FechaCompletada END
        WHERE ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.5 SP_Diligencia_Eliminar

```sql
CREATE OR ALTER PROCEDURE SP_Diligencia_Eliminar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM DILIGENCIA WHERE ID = @ID AND Activo = 1)
        BEGIN
            RAISERROR('Diligencia no encontrada.', 16, 1);
            RETURN;
        END
        UPDATE DILIGENCIA SET Activo = 0 WHERE ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

---

## 3. Backend

### 3.1 DTOs — `Dtos/Diligencias/DiligenciaDtos.cs`

```csharp
namespace LexControlApi.Dtos.Diligencias;

public class DiligenciaFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string NoExpediente { get; set; } = "";
    public int Tipo_Diligencia_ID { get; set; }
    public string TipoDiligencia { get; set; } = "";
    public string Descripcion { get; set; } = "";
    public DateTime? FechaProgramada { get; set; }
    public DateTime? FechaCompletada { get; set; }
    public int Estado_Diligencia_ID { get; set; }
    public string EstadoDiligencia { get; set; } = "";
    public int? Abogado_ID { get; set; }
    public string? Abogado { get; set; }
    public string? NotasInternas { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class DiligenciaDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string NoExpediente { get; set; } = "";
    public int TipoDiligenciaId { get; set; }
    public string TipoDiligencia { get; set; } = "";
    public string Descripcion { get; set; } = "";
    public string? FechaProgramada { get; set; }
    public string? FechaCompletada { get; set; }
    public int EstadoDiligenciaId { get; set; }
    public string EstadoDiligencia { get; set; } = "";
    public string? Abogado { get; set; }
    public string? NotasInternas { get; set; }
}

public class DiligenciaCrearDto
{
    public int ExpedienteId { get; set; }
    public int TipoDiligenciaId { get; set; }
    public string Descripcion { get; set; } = "";
    public DateTime? FechaProgramada { get; set; }
    public int? AbogadoId { get; set; }
    public string? NotasInternas { get; set; }
}

public class DiligenciaActualizarDto
{
    public int? TipoDiligenciaId { get; set; }
    public string? Descripcion { get; set; }
    public DateTime? FechaProgramada { get; set; }
    public int? AbogadoId { get; set; }
    public int? EstadoDiligenciaId { get; set; }
    public string? NotasInternas { get; set; }
}
```

### 3.2 Service — `Services/DiligenciaService.cs`

```csharp
using LexControlApi.Dtos.Diligencias;

namespace LexControlApi.Services;

public interface IDiligenciaService
{
    Task<List<DiligenciaDto>> ListarAsync(int? expedienteId, int? tipoId, int? estadoId,
        int? abogadoId, DateTime? fechaInicio, DateTime? fechaFin, int pagina, int tamanoPagina);
    Task<DiligenciaDto?> ObtenerPorIdAsync(int id);
    Task<int> CrearAsync(DiligenciaCrearDto dto);
    Task ActualizarAsync(int id, DiligenciaActualizarDto dto);
    Task EliminarAsync(int id);
}

public class DiligenciaService : IDiligenciaService
{
    private readonly Data.IRepositorio _repositorio;
    public DiligenciaService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<DiligenciaDto>> ListarAsync(int? expedienteId, int? tipoId,
        int? estadoId, int? abogadoId, DateTime? fechaInicio, DateTime? fechaFin,
        int pagina, int tamanoPagina)
    {
        var filas = await _repositorio.ConsultarAsync<DiligenciaFila>(
            "SP_Diligencia_Listar",
            new { Expediente_ID = expedienteId, Tipo_Diligencia_ID = tipoId,
                  Estado_Diligencia_ID = estadoId, Abogado_ID = abogadoId,
                  FechaInicio = fechaInicio, FechaFin = fechaFin,
                  Pagina = pagina, TamanoPagina = tamanoPagina });
        return filas.Select(Mapear).ToList();
    }

    public async Task<DiligenciaDto?> ObtenerPorIdAsync(int id)
    {
        var f = await _repositorio.ConsultarPrimeroAsync<DiligenciaFila>(
            "SP_Diligencia_ObtenerPorID", new { ID = id });
        return f is null ? null : Mapear(f);
    }

    public async Task<int> CrearAsync(DiligenciaCrearDto dto)
    {
        return await _repositorio.EjecutarRetornoAsync<int>(
            "SP_Diligencia_Insertar",
            new { Expediente_ID = dto.ExpedienteId, Tipo_Diligencia_ID = dto.TipoDiligenciaId,
                  Descripcion = dto.Descripcion, FechaProgramada = dto.FechaProgramada,
                  Abogado_ID = dto.AbogadoId, NotasInternas = dto.NotasInternas });
    }

    public async Task ActualizarAsync(int id, DiligenciaActualizarDto dto)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_Diligencia_Actualizar",
            new { ID = id, Tipo_Diligencia_ID = dto.TipoDiligenciaId,
                  Descripcion = dto.Descripcion, FechaProgramada = dto.FechaProgramada,
                  Abogado_ID = dto.AbogadoId, Estado_Diligencia_ID = dto.EstadoDiligenciaId,
                  NotasInternas = dto.NotasInternas });
    }

    public async Task EliminarAsync(int id)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_Diligencia_Eliminar", new { ID = id });
    }

    private static DiligenciaDto Mapear(DiligenciaFila f) => new()
    {
        Id = f.ID, ExpedienteId = f.Expediente_ID, NoExpediente = f.NoExpediente,
        TipoDiligenciaId = f.Tipo_Diligencia_ID, TipoDiligencia = f.TipoDiligencia,
        Descripcion = f.Descripcion,
        FechaProgramada = f.FechaProgramada?.ToString("yyyy-MM-ddTHH:mm"),
        FechaCompletada = f.FechaCompletada?.ToString("yyyy-MM-ddTHH:mm"),
        EstadoDiligenciaId = f.Estado_Diligencia_ID, EstadoDiligencia = f.EstadoDiligencia,
        Abogado = f.Abogado, NotasInternas = f.NotasInternas
    };
}
```

### 3.3 Controller — `Controllers/DiligenciasController.cs`

```csharp
using LexControlApi.Dtos.Diligencias;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/diligencias")]
[Authorize]
public class DiligenciasController : ControllerBase
{
    private readonly IDiligenciaService _service;
    public DiligenciasController(IDiligenciaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<DiligenciaDto>>>> Listar(
        [FromQuery] int? expedienteId, [FromQuery] int? tipoId,
        [FromQuery] int? estadoId, [FromQuery] int? abogadoId,
        [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20)
    {
        var r = await _service.ListarAsync(expedienteId, tipoId, estadoId, abogadoId,
            null, null, pagina, tamanoPagina);
        return Ok(ApiResponse<List<DiligenciaDto>>.Correcto(r));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<DiligenciaDto>>> ObtenerPorId(int id)
    {
        var r = await _service.ObtenerPorIdAsync(id);
        if (r is null) return NotFound(ApiResponse<DiligenciaDto>.Fallo("Diligencia no encontrada."));
        return Ok(ApiResponse<DiligenciaDto>.Correcto(r));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(DiligenciaCrearDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> Actualizar(int id, DiligenciaActualizarDto dto)
    {
        await _service.ActualizarAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);
        return NoContent();
    }
}
```

### 3.4 Registro en Program.cs

```csharp
builder.Services.AddScoped<IDiligenciaService, DiligenciaService>();
```

---

## 4. Pruebas de Endpoints

```http
### Listar diligencias
GET http://localhost:5181/api/diligencias?Pagina=1&TamanoPagina=5
Authorization: Bearer <token>

### Crear diligencia
POST http://localhost:5181/api/diligencias
Authorization: Bearer <token>
Content-Type: application/json

{
  "expedienteId": 1,
  "tipoDiligenciaId": 1,
  "descripcion": "Diligencia de prueba",
  "fechaProgramada": "2026-09-20T09:00:00"
}

### Actualizar diligencia
PUT http://localhost:5181/api/diligencias/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "estadoDiligenciaId": 2,
  "notasInternas": "Actualizada desde prueba"
}

### Eliminar diligencia
DELETE http://localhost:5181/api/diligencias/1
Authorization: Bearer <token>
```

---

## 5. Frontend

- **Modelo:** `core/models/diligencia.model.ts`
- **Service:** `core/services/diligencias-service.ts` (listar, obtenerPorId, crear, actualizar, eliminar)
- **Páginas:** `features/historico/historico-page.ts` + `historico-detalle-page.ts` + `diligencia-modal.ts`
- **Estilos:** `styles/modules/historico.css`
- **Ruta:** `/historico` → HistoricoPage, `/historico/:id` → HistoricoDetallePage

---

## 6. Tests Playwright

### `16-historico.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth.fixture';

test.describe('Histórico Legal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/historico');
  });

  test('muestra la lista', async ({ page }) => {
    await expect(page.locator('[data-testid="historico-tabla"]')).toBeVisible();
  });

  test('filtra por tipo', async ({ page }) => {
    await page.selectOption('[data-testid="filtro-tipo"]', '1');
  });

  test('filtra por estado', async ({ page }) => {
    await page.selectOption('[data-testid="filtro-estado"]', '1');
  });

  test('abre modal de crear', async ({ page }) => {
    await page.click('[data-testid="btn-nueva-diligencia"]');
    await expect(page.locator('[data-testid="modal-diligencia"]')).toBeVisible();
  });

  test('crea una diligencia', async ({ page }) => {
    await page.click('[data-testid="btn-nueva-diligencia"]');
    await page.selectOption('[data-testid="select-expediente"]', '1');
    await page.selectOption('[data-testid="select-tipo"]', '1');
    await page.fill('[data-testid="input-descripcion"]', 'Diligencia E2E');
    await page.click('[data-testid="btn-guardar-diligencia"]');
    await expect(page.locator('[data-testid="historico-tabla"]')).toContainText('Diligencia E2E');
  });

  test('navega al detalle', async ({ page }) => {
    await page.locator('tr').first().click();
    await expect(page).toHaveURL(/\/historico\/\d+/);
  });
});
```

### `17-historico-detalle.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth.fixture';

test.describe('Histórico Detalle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/historico/1');
  });

  test('muestra detalle', async ({ page }) => {
    await expect(page.locator('[data-testid="diligencia-tipo"]')).toBeVisible();
    await expect(page.locator('[data-testid="diligencia-estado"]')).toBeVisible();
  });

  test('edita la diligencia', async ({ page }) => {
    await page.click('[data-testid="btn-editar"]');
    await page.fill('[data-testid="input-notas"]', 'Notas E2E');
    await page.click('[data-testid="btn-guardar"]');
  });

  test('elimina la diligencia', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="btn-eliminar"]');
  });

  test('navega de vuelta', async ({ page }) => {
    await page.click('[data-testid="btn-volver"]');
    await expect(page).toHaveURL('/historico');
  });
});
```

---

## 7. Criterios de Aceptación

- [ ] Los 5 SPs crean y ejecutan sin errores
- [ ] Controller compila con 5 endpoints
- [ ] Frontend muestra lista, detalle, modal CRUD
- [ ] Eliminación lógica funciona (soft delete)
- [ ] `npx ng build` exitoso
- [ ] Tests Playwright pasan (16 + 17)
