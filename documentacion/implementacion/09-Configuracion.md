# Módulo 09 — Configuración del Bufete

> **Módulo:** SPs + Backend + Frontend (reemplazar mocks de BufeteCard y PreferenciasCard)
> **Estado:** BufeteCard y PreferenciasCard usan localStorage como placeholder.
> **Ruta frontend:** `/ajustes` (sección Bufete y Preferencias)

---

## 1. Descripción

Configuración general del bufete: nombre, dirección, teléfono, email, logo, y preferencias de notificación. Actualmente ambas cards usan localStorage. Deben conectarse al API.

**Estado:**
- ✅ `PerfilCard` — Conectado a `GET/PUT /api/perfil`
- ✅ `UsuariosCard` — Conectado a `GET/POST/PUT /api/usuarios`
- ✅ `PermisosCard` — Conectado a `GET/PUT /api/permisos`
- ✅ `SeguridadCard` — Conectado a `PUT /api/perfil/contrasena`
- ❌ `BufeteCard` — Usa localStorage (MOCK)
- ❌ `PreferenciasCard` — Usa localStorage (MOCK)

---

## 2. Procedimientos Almacenados

### 2.1 SP_Configuracion_Obtener

```sql
CREATE OR ALTER PROCEDURE SP_Configuracion_Obtener
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT Clave, Valor
        FROM CONFIGURACION
        WHERE Activo = 1;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.2 SP_Configuracion_Actualizar

```sql
CREATE OR ALTER PROCEDURE SP_Configuracion_Actualizar
    @Clave NVARCHAR(100),
    @Valor NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM CONFIGURACION WHERE Clave = @Clave)
        BEGIN
            UPDATE CONFIGURACION
            SET Valor = @Valor, FechaModificacion = GETDATE()
            WHERE Clave = @Clave;
        END
        ELSE
        BEGIN
            INSERT INTO CONFIGURACION (Clave, Valor, Activo, FechaCreacion)
            VALUES (@Clave, @Valor, 1, GETDATE());
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

> **Nota:** Verificar que la tabla `CONFIGURACION` exista en la BD. Si no, crearla:
> ```sql
> IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CONFIGURACION')
> BEGIN
>     CREATE TABLE CONFIGURACION (
>         Clave NVARCHAR(100) PRIMARY KEY,
>         Valor NVARCHAR(500) NULL,
>         Activo BIT NOT NULL DEFAULT 1,
>         FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
>         FechaModificacion DATETIME NULL
>     );
> END
> GO
> ```

---

## 3. Backend

### 3.1 DTOs — `Dtos/Configuracion/ConfiguracionDtos.cs`

```csharp
namespace LexControlApi.Dtos.Configuracion;

public class ConfiguracionDto
{
    public string NombreBufete { get; set; } = "";
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? LogoUrl { get; set; }
}

public class ConfiguracionActualizarDto
{
    public string? NombreBufete { get; set; }
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? LogoUrl { get; set; }
}
```

### 3.2 Service — `Services/ConfiguracionService.cs`

```csharp
using LexControlApi.Dtos.Configuracion;

namespace LexControlApi.Services;

public interface IConfiguracionService
{
    Task<ConfiguracionDto> ObtenerAsync();
    Task ActualizarAsync(ConfiguracionActualizarDto dto);
}

public class ConfiguracionService : IConfiguracionService
{
    private readonly Data.IRepositorio _repositorio;
    public ConfiguracionService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<ConfiguracionDto> ObtenerAsync()
    {
        var filas = await _repositorio.ConsultarAsync<dynamic>(
            "SP_Configuracion_Obtener");

        var config = new ConfiguracionDto();
        foreach (var fila in filas)
        {
            string clave = fila.Clave;
            string valor = fila.Valor;
            switch (clave)
            {
                case "NombreBufete": config.NombreBufete = valor; break;
                case "Direccion": config.Direccion = valor; break;
                case "Telefono": config.Telefono = valor; break;
                case "Email": config.Email = valor; break;
                case "LogoUrl": config.LogoUrl = valor; break;
            }
        }
        return config;
    }

    public async Task ActualizarAsync(ConfiguracionActualizarDto dto)
    {
        var campos = new Dictionary<string, string?>
        {
            ["NombreBufete"] = dto.NombreBufete,
            ["Direccion"] = dto.Direccion,
            ["Telefono"] = dto.Telefono,
            ["Email"] = dto.Email,
            ["LogoUrl"] = dto.LogoUrl
        };

        foreach (var par in campos.Where(p => p.Value is not null))
        {
            await _repositorio.EjecutarRetornoAsync(
                "SP_Configuracion_Actualizar",
                new { Clave = par.Key, Valor = par.Value });
        }
    }
}
```

### 3.3 Controller — `Controllers/ConfiguracionController.cs`

```csharp
using LexControlApi.Dtos.Configuracion;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/configuracion")]
[Authorize]
public class ConfiguracionController : ControllerBase
{
    private readonly IConfiguracionService _service;
    public ConfiguracionController(IConfiguracionService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<ConfiguracionDto>>> Obtener()
    {
        var r = await _service.ObtenerAsync();
        return Ok(ApiResponse<ConfiguracionDto>.Correcto(r));
    }

    [HttpPut]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar(ConfiguracionActualizarDto dto)
    {
        await _service.ActualizarAsync(dto);
        return NoContent();
    }
}
```

### 3.4 Registro en Program.cs

```csharp
builder.Services.AddScoped<IConfiguracionService, ConfiguracionService>();
```

---

## 4. Pruebas de Endpoints

```http
### Obtener configuración
GET http://localhost:5181/api/configuracion
Authorization: Bearer <token>

### Actualizar configuración
PUT http://localhost:5181/api/configuracion
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombreBufete": "Bufete Legal LexControl",
  "direccion": "Zona 10, Guatemala",
  "telefono": "+502 2345-6789",
  "email": "info@lexcontrol.com"
}
```

---

## 5. Frontend

### 5.1 Service — `core/services/configuracion-service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/configuracion`;

  obtener(): Observable<RespuestaApi<Configuracion>> {
    return this.http.get<RespuestaApi<Configuracion>>(this.base);
  }

  actualizar(dto: ConfiguracionActualizar): Observable<RespuestaApi<void>> {
    return this.http.put<RespuestaApi<void>>(this.base, dto);
  }
}
```

### 5.2 Modelo — `core/models/configuracion.model.ts`

```typescript
export interface Configuracion {
  nombreBufete: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logoUrl: string | null;
}
```

### 5.3 Cambios en `BufeteCard`

Reemplazar `localStorage` por llamadas al API:
```typescript
// ANTES:
const nombre = localStorage.getItem('bufete_nombre') || '';

// DESPUÉS:
private configuracionService = inject(ConfiguracionService);
readonly configuracion = signal<Configuracion | null>(null);

constructor() {
  this.configuracionService.obtener().subscribe({
    next: r => { if (r.success) this.configuracion.set(r.data); }
  });
}
```

### 5.4 Cambios en `PreferenciasCard`

Si las preferencias de notificación se almacenan en CONFIGURACION, aplicar el mismo patrón. Si se mantienen en localStorage (son preferencias locales del usuario), no cambiar.

---

## 6. Tests Playwright

### Actualizar `05-ajustes.spec.ts`

```typescript
test('BufeteCard muestra datos del API', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/ajustes');
  await page.click('[data-testid="card-bufete"]');
  await expect(page.locator('[data-testid="input-nombre-bufete"]')).not.toBeEmpty();
});

test('BufeteCard guarda cambios en el API', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/ajustes');
  await page.click('[data-testid="card-bufete"]');
  await page.fill('[data-testid="input-nombre-bufete"]', 'Bufete Actualizado E2E');
  await page.click('[data-testid="btn-guardar-bufete"]');
  // Verificar que persiste recargando
  await page.reload();
  await expect(page.locator('[data-testid="input-nombre-bufete"]')).toHaveValue('Bufete Actualizado E2E');
});
```

---

## 7. Criterios de Aceptación

- [ ] Tabla CONFIGURACION creada en la BD
- [ ] Los 2 SPs ejecutan sin errores
- [ ] Controller compila con 2 endpoints
- [ ] BufeteCard carga datos del API
- [ ] BufeteCard guarda cambios en el API
- [ ] Solo administradores pueden editar configuración
- [ ] `npx ng build` exitoso
- [ ] Tests Playwright pasan
