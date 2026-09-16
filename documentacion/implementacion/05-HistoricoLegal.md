# Módulo 05 — Histórico Legal (Expedientes Archivados)

> **Estado:** ✅ COMPLETADO
> **Ruta frontend:** `/historico` (lista), `/historico/:id` (detalle)

---

## 1. Descripción

Módulo de consulta de expedientes con estado **Cerrado** o **Archivado**. Permite revisar el historial legal sin modificar datos. Solo lectura (sin CRUD de creación/edición).

**Estados que se muestran:**
- **Cerrado** (CER) — Expediente finalizado
- **Archivado** (ARC) — Expediente archivado

**Funcionalidades:**
- Listado con filtros (expediente, cliente, rama, abogado, fechas)
- Detalle completo del expediente (resumen, partes, notas, documentos)
- Sin opción de crear o editar (solo consulta)

---

## 2. Procedimientos Almacenados

### 2.1 SP_Historico_Listar

Filtra expedientes con estado Cerrado o Archivado.

```sql
CREATE OR ALTER PROCEDURE SP_Historico_Listar
    @Cliente_ID INT = NULL,
    @Rama_ID INT = NULL,
    @Abogado_ID INT = NULL,
    @Busqueda NVARCHAR(100) = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        E.ID, E.NoExpediente,
        P.NombreCompleto AS Cliente,
        R.Nombre AS Rama,
        E.TipoProceso,
        J.Nombre AS Juzgado,
        E.FechaIngreso,
        EE.Nombre AS Estado, EE.Color AS EstadoColor,
        U.NombreCompleto AS Abogado,
        E.FechaCierre
    FROM EXPEDIENTE E
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN RAMA R ON E.Rama_ID = R.ID
    INNER JOIN ESTADO_EXPEDIENTE EE ON E.Estado_ID = EE.ID
    LEFT JOIN JUZGADO J ON E.Juzgado_ID = J.ID
    LEFT JOIN USUARIO U ON E.Abogado_ID = U.ID
    WHERE EE.Nombre IN ('Cerrado', 'Archivado')
      AND (@Cliente_ID IS NULL OR E.Cliente_ID = @Cliente_ID)
      AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
      AND (@Abogado_ID IS NULL OR E.Abogado_ID = @Abogado_ID)
      AND (@Busqueda IS NULL OR E.NoExpediente LIKE '%' + @Busqueda + '%'
           OR P.NombreCompleto LIKE '%' + @Busqueda + '%')
      AND (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
      AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
    ORDER BY E.FechaCierre DESC, E.FechaIngreso DESC;
END
GO
```

### 2.2 SP_Historico_ObtenerPorID

Reutiliza `SP_Expediente_ObtenerPorID` existente (ya retorna todos los campos del expediente incluyendo estado, cliente, rama, juzgado, abogado, partes, notas, documentos).

No se necesita un SP nuevo. El frontend puede llamar al endpoint existente `GET /api/expedientes/{id}`.

---

## 3. Backend

### 3.1 DTOs — `Dtos/Historico/HistoricoDtos.cs`

```csharp
namespace LexControlApi.Dtos.Historico;

/// <summary>Fila devuelta por SP_Historico_Listar.</summary>
public class HistoricoFila
{
    public int ID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public string Rama { get; set; } = string.Empty;
    public string? TipoProceso { get; set; }
    public string? Juzgado { get; set; }
    public DateTime FechaIngreso { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Abogado { get; set; }
    public DateTime? FechaCierre { get; set; }
}

/// <summary>DTO de respuesta para el listado del histórico.</summary>
public class HistoricoDto
{
    public int Id { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public string Rama { get; set; } = string.Empty;
    public string? TipoProceso { get; set; }
    public string? Juzgado { get; set; }
    public string FechaIngreso { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Abogado { get; set; }
    public string? FechaCierre { get; set; }

    public static HistoricoDto Desde(HistoricoFila f) => new()
    {
        Id = f.ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        Rama = f.Rama,
        TipoProceso = f.TipoProceso,
        Juzgado = f.Juzgado,
        FechaIngreso = f.FechaIngreso.ToString("yyyy-MM-dd"),
        Estado = f.Estado,
        EstadoColor = f.EstadoColor,
        Abogado = f.Abogado,
        FechaCierre = f.FechaCierre?.ToString("yyyy-MM-dd")
    };
}
```

### 3.2 Service — `Services/HistoricoService.cs`

```csharp
using LexControlApi.Data;
using LexControlApi.Dtos.Historico;

namespace LexControlApi.Services;

public interface IHistoricoService
{
    Task<List<HistoricoDto>> ListarAsync(int? clienteId, int? ramaId, int? abogadoId,
        string? busqueda, DateTime? fechaInicio, DateTime? fechaFin);
}

public class HistoricoService : IHistoricoService
{
    private readonly IRepositorio _repositorio;
    public HistoricoService(IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<HistoricoDto>> ListarAsync(int? clienteId, int? ramaId,
        int? abogadoId, string? busqueda, DateTime? fechaInicio, DateTime? fechaFin)
    {
        var filas = await _repositorio.ConsultarListaAsync<HistoricoFila>(
            "SP_Historico_Listar",
            new
            {
                Cliente_ID = clienteId,
                Rama_ID = ramaId,
                Abogado_ID = abogadoId,
                Busqueda = busqueda,
                FechaInicio = fechaInicio,
                FechaFin = fechaFin
            });

        return filas.Select(HistoricoDto.Desde).ToList();
    }
}
```

### 3.3 Controller — `Controllers/HistoricoController.cs`

```csharp
using LexControlApi.Dtos.Historico;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/historico")]
[Authorize]
public class HistoricoController : ControllerBase
{
    private readonly IHistoricoService _service;
    public HistoricoController(IHistoricoService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<HistoricoDto>>>> Listar(
        [FromQuery] int? clienteId, [FromQuery] int? ramaId,
        [FromQuery] int? abogadoId, [FromQuery] string? busqueda,
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
    {
        var resultado = await _service.ListarAsync(clienteId, ramaId, abogadoId,
            busqueda, fechaInicio, fechaFin);
        return Ok(ApiResponse<List<HistoricoDto>>.Correcto(resultado));
    }
}
```

### 3.4 DI Registration

```csharp
builder.Services.AddScoped<IHistoricoService, HistoricoService>();
```

---

## 4. Frontend

### 4.1 Modelo — `core/models/historico.model.ts`

```typescript
export interface HistoricoExpediente {
    id: number;
    noExpediente: string;
    cliente: string | null;
    rama: string;
    tipoProceso: string | null;
    juzgado: string | null;
    fechaIngreso: string;
    estado: string;
    estadoColor: string | null;
    abogado: string | null;
    fechaCierre: string | null;
}
```

### 4.2 Service — `core/services/historico-service.ts`

```typescript
listar(filtros) → Observable<HistoricoExpediente[]>
// GET /api/historico?clienteId=&ramaId=&abogadoId=&busqueda=&fechaInicio=&fechaFin=
```

### 4.3 Páginas

| Archivo | Descripción |
|---------|-------------|
| `features/historico/historico-page.ts/html` | Lista con filtros, tabla navegable, pills de estado |
| `features/historico/historico-detalle-page.ts/html` | Detalle del expediente (reutiliza diseño de expediente-detalle-page) |

### 4.4 Rutas

```typescript
{
    path: 'historico',
    canActivate: [moduloGuard('historico')],
    loadComponent: () => import('./features/historico/historico-page').then(m => m.HistoricoPage)
},
{
    path: 'historico/:id',
    canActivate: [moduloGuard('historico')],
    loadComponent: () => import('./features/historico/historico-detalle-page').then(m => m.HistoricoDetallePage)
}
```

---

## 5. Criterios de Aceptación

- [ ] SP_Historico_Listar retorna solo expedientes Cerrados/Archivados
- [ ] Controller compila con 1 endpoint (GET list)
- [ ] Detalle reutiliza expediente existente (solo lectura)
- [ ] Frontend muestra lista con filtros y pills de estado
- [ ] `dotnet build` exitoso (0 errores)
- [ ] `npx ng build` exitoso (0 errores)
