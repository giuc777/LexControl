# Módulo 06 — Eventos / Agenda

> **Estado:** SPs base existen. Faltan controller, service, frontend.
> **Ruta frontend:** Se integra en Dashboard y Agenda (sin páginas propias)
> **Orden de implementación:** FASE 1 (antes de Diligencias e Histórico Legal)

---

## 1. Descripción

Backend de eventos de calendario (audiencias, plazos, diligencias, citas). Alimenta el calendario de Agenda y la agenda semanal del Dashboard. **No tiene páginas propias** — se integra en los componentes existentes.

**Relación con Diligencias (Módulo 04):**
- Las diligencias son tareas del abogado (asesorías, visitas, etc.)
- Cuando una diligencia tiene fecha, se puede mostrar en el calendario de Agenda
- Opción recomendada: consultar DILIGENCIA directamente desde la Agenda (sin crear EVENTO_BASE duplicado)

**Fases de implementación:**

| # | Fase | Descripción |
|---|------|-------------|
| 1 | **Eventos Backend** | Crear Controller + Service con los 3 SPs existentes |
| 2 | **Agenda Mejorada** | Mostrar audiencias + eventos + diligencias en el calendario |
| 3 | **Diligencias CRUD** | Módulo `/diligencias` completo |
| 4 | **Histórico Legal** | Módulo `/historico` (expedientes Cerrados/Archivados) |
| 5 | **Dashboard** | Conectar Dashboard a datos reales |

**SPs existentes:**
- ✅ `SP_EventoBase_Insertar` (LexControlDB.sql)
- ✅ `SP_EventoAudiencia_Insertar` (LexControlDB.sql)
- ✅ `SP_Evento_ObtenerDelDia` (LexControlDB.sql)

---

## 2. Procedimientos Almacenados

**No se necesitan SPs nuevos.** Los 3 existentes son suficientes para el alcance actual.

> **Nota:** `SP_Evento_ObtenerDelDia` retorna eventos del día para un usuario específico. Para el calendario de agenda con rango de fechas, se puede reutilizar o crear un SP futuro.

---

## 3. Backend

### 3.1 DTOs — `Dtos/Eventos/EventoDtos.cs`

```csharp
namespace LexControlApi.Dtos.Eventos;

public class EventoFila
{
    public int ID { get; set; }
    public string Titulo { get; set; } = "";
    public string? Descripcion { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string TipoEvento { get; set; } = "";
    public int? Expediente_ID { get; set; }
    public string? NoExpediente { get; set; }
    public string EstadoEvento { get; set; } = "";
}

public class EventoDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = "";
    public string? Descripcion { get; set; }
    public string FechaInicio { get; set; } = "";
    public string? FechaFin { get; set; }
    public string TipoEvento { get; set; } = "";
    public int? ExpedienteId { get; set; }
    public string? NoExpediente { get; set; }
    public string EstadoEvento { get; set; } = "";
}

public class EventoCrearDto
{
    public string Titulo { get; set; } = "";
    public string? Descripcion { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public int UsuarioId { get; set; }
}

public class EventoAudienciaCrearDto
{
    public int AudienciaId { get; set; }
    public int UsuarioId { get; set; }
}
```

### 3.2 Service — `Services/EventoService.cs`

```csharp
using LexControlApi.Dtos.Eventos;

namespace LexControlApi.Services;

public interface IEventoService
{
    Task<List<EventoDto>> ObtenerDelDiaAsync(DateTime fecha, int usuarioId);
    Task<int> CrearAsync(EventoCrearDto dto);
    Task<int> CrearAudienciaAsync(EventoAudienciaCrearDto dto);
}

public class EventoService : IEventoService
{
    private readonly Data.IRepositorio _repositorio;
    public EventoService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<EventoDto>> ObtenerDelDiaAsync(DateTime fecha, int usuarioId)
    {
        var filas = await _repositorio.ConsultarAsync<EventoFila>(
            "SP_Evento_ObtenerDelDia",
            new { Fecha = fecha, Usuario_ID = usuarioId });
        return filas.Select(Mapear).ToList();
    }

    public async Task<int> CrearAsync(EventoCrearDto dto)
    {
        return await _repositorio.EjecutarRetornoAsync<int>(
            "SP_EventoBase_Insertar",
            new { Titulo = dto.Titulo, Descripcion = dto.Descripcion,
                  FechaInicio = dto.FechaInicio, FechaFin = dto.FechaFin,
                  Usuario_ID = dto.UsuarioId });
    }

    public async Task<int> CrearAudienciaAsync(EventoAudienciaCrearDto dto)
    {
        return await _repositorio.EjecutarRetornoAsync<int>(
            "SP_EventoAudiencia_Insertar",
            new { Audiencia_ID = dto.AudienciaId, Usuario_ID = dto.UsuarioId });
    }

    private static EventoDto Mapear(EventoFila f) => new()
    {
        Id = f.ID, Titulo = f.Titulo, Descripcion = f.Descripcion,
        FechaInicio = f.FechaInicio.ToString("yyyy-MM-ddTHH:mm"),
        FechaFin = f.FechaFin?.ToString("yyyy-MM-ddTHH:mm"),
        TipoEvento = f.TipoEvento, ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente, EstadoEvento = f.EstadoEvento
    };
}
```

### 3.3 Controller — `Controllers/EventosController.cs`

```csharp
using LexControlApi.Dtos.Eventos;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/eventos")]
[Authorize]
public class EventosController : ControllerBase
{
    private readonly IEventoService _service;
    public EventosController(IEventoService service) => _service = service;

    [HttpGet("dia")]
    public async Task<ActionResult<ApiResponse<List<EventoDto>>>> ObtenerDelDia(
        [FromQuery] DateTime? fecha)
    {
        var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var f = fecha ?? DateTime.Today;
        var r = await _service.ObtenerDelDiaAsync(f, usuarioId);
        return Ok(ApiResponse<List<EventoDto>>.Correcto(r));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(EventoCrearDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPost("audiencia")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> CrearAudiencia(EventoAudienciaCrearDto dto)
    {
        var id = await _service.CrearAudienciaAsync(dto);
        return Ok(ApiResponse<int>.Correcto(id));
    }
}
```

### 3.4 Registro en Program.cs

```csharp
builder.Services.AddScoped<IEventoService, EventoService>();
```

---

## 4. Pruebas de Endpoints

```http
### Eventos del día
GET http://localhost:5181/api/eventos/dia?fecha=2026-09-13
Authorization: Bearer <token>

### Crear evento base
POST http://localhost:5181/api/eventos
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Reunión de prueba",
  "descripcion": "Reunión de prueba",
  "fechaInicio": "2026-09-15T14:00:00",
  "fechaFin": "2026-09-15T15:00:00",
  "usuarioId": 1
}

### Crear evento audiencia
POST http://localhost:5181/api/eventos/audiencia
Authorization: Bearer <token>
Content-Type: application/json

{
  "audienciaId": 1,
  "usuarioId": 1
}
```

---

## 5. Frontend

- **Modelo:** `core/models/evento.model.ts`
- **Service:** `core/services/eventos-service.ts` (obtenerDelDia, crear, crearAudiencia)
- **Integración:** Conectar `DashboardPage` y `AgendaPage` con el service
- **Sin páginas propias** — se integra en Dashboard y Agenda existentes

---

## 6. Tests Playwright

### Actualizar `02-dashboard.spec.ts`

```typescript
test('muestra eventos reales del API', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="stat-expedientes"]')).toBeVisible();
  const eventos = page.locator('[data-testid="evento-agenda"]');
  const empty = page.locator('[data-testid="empty-agenda"]');
  await expect(eventos.or(empty)).toBeVisible();
});
```

---

## 7. Criterios de Aceptación

- [ ] Los 3 SPs existentes funcionan correctamente
- [ ] Controller compila con 3 endpoints
- [ ] `GET /api/eventos/dia` retorna eventos del usuario autenticado
- [ ] Dashboard muestra eventos reales (no seed)
- [ ] `npx ng build` exitoso
