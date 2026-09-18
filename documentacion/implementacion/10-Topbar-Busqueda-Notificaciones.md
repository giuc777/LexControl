# Módulo 10 — Topbar: Búsqueda Global y Campana de Notificaciones

> **Estado:** 🔴 PENDIENTE — Componente existe pero funcionalidad decorativa
> **Ruta frontend:** Componente `app-topbar` (layout, no tiene ruta propia)
> **Dependencias:** Módulo 05 (Notificaciones OJ), Módulo 03 (Expedientes), Módulo 01 (Clientes)

---

## 1. Descripción

El topbar (`app-topbar`) es el componente fijo superior de la aplicación. Contiene:

- **Input de búsqueda global** — Busca expedientes, clientes, audiencias, etc. en una sola query
- **Campana de notificaciones** — Muestra conteo de notificaciones OJ pendientes (sin atender)
- **Chip "OJ ONLINE"** — Acceso rápido al portal OJ (solo si el rol tiene permiso `notificaciones`)
- **Chip de usuario** — Avatar con iniciales, nombre y rol

Actualmente la búsqueda y la campana son **puras decoraciones** — no tienen lógica real conectada.

### Piezas faltantes

| # | Pieza | Capa | Descripción |
|---|-------|------|-------------|
| 1 | `SP_Notificacion_ContarPendientes` | BD | SP que cuenta notificaciones con `FechaAtencion IS NULL` |
| 2 | `GET /api/notificaciones/pendientes/count` | Backend | Endpoint que retorna `{ count: number }` |
| 3 | `GET /api/buscar?q=` | Backend | Endpoint de búsqueda global cross-entidad |
| 4 | `BuscarService` | Frontend | Servicio HTTP de búsqueda global |
| 5 | `BusquedaResultado` interface | Frontend | Modelo de resultado de búsqueda |
| 6 | `NotificacionesService.contarPendientes()` | Frontend | Método nuevo en servicio existente |
| 7 | Topbar TS reescrito | Frontend | Signal de búsqueda + debounce + signal de conteo |
| 8 | Topbar HTML reescrito | Frontend | Dropdown de resultados + badge dinámico |
| 9 | CSS de dropdown de búsqueda | Frontend | Estilos del panel de resultados |

---

## 2. Procedimientos Almacenados

### 2.1 Nuevo: `SP_Notificacion_ContarPendientes`

```sql
CREATE OR ALTER PROCEDURE SP_Notificacion_ContarPendientes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS Total
    FROM NOTIFICACION_OJ
    WHERE FechaAtencion IS NULL;
END
```

> **Nota:** El SP no filtra por usuario porque las notificaciones son globales en LexControl (no están asignadas a un usuario específico). Si en el futuro se asignan, agregar `@Usuario_ID`.

### 2.1.1 Migración

Crear `ScriptsDB/17-Topbar-Busqueda-Notificaciones.sql` con:
- `SP_Notificacion_ContarPendientes`

---

## 3. Backend

### 3.1 Nuevo endpoint: Conteo de pendientes

**`NotificacionesController.cs`** — agregar:

```csharp
[HttpGet("pendientes/count")]
public async Task<ActionResult<ApiResponse<int>>> ContarPendientes()
{
    var count = await _service.ContarPendientesAsync();
    return Ok(ApiResponse<int>.Correcto(count));
}
```

**`INotificacionService` / `NotificacionService`** — agregar:

```csharp
Task<int> ContarPendientesAsync();
```

Implementación:
```csharp
public async Task<int> ContarPendientesAsync()
{
    var resultado = await _repositorio.ConsultarUnicoAsync<ConteoDto>(
        "SP_Notificacion_ContarPendientes");
    return resultado?.Total ?? 0;
}
```

**`NotificacionDtos.cs`** — agregar DTO:
```csharp
public class ConteoDto
{
    public int Total { get; set; }
}
```

### 3.2 Nuevo endpoint: Búsqueda global

**Nuevo controller: `BuscarController.cs`**

```csharp
[ApiController]
[Route("api/buscar")]
[Authorize]
public class BuscarController : ControllerBase
{
    private readonly IBuscarService _service;
    // ...
}
```

**Nuevo servicio: `IBuscarService` / `BuscarService.cs`**

| Entidad | SP/Método | Filtros de búsqueda |
|---------|-----------|---------------------|
| Expedientes | `SP_Expediente_Listar` | `NoExpediente`, nombre de cliente |
| Clientes | `SP_Cliente_Buscar` | `NombreCompleto`, `DPI` |
| Audiencias | `SP_Audiencia_Listar` | Título, expediente |
| Trámites | `SP_Tramite_Listar` | Descripción, expediente |
| Notificaciones | `SP_Notificacion_Listar` | Resolución, expediente |
| Diligencias | `SP_Diligencia_Listar` | Título, ubicación |

**Endpoint:** `GET /api/buscar?q={texto}`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "expedientes": [
      { "id": 1, "titulo": "CIV-2026-0045", "subtitulo": "Carlos Morales Ortiz", "ruta": "/expedientes/1" }
    ],
    "clientes": [
      { "id": 1, "titulo": "Carlos Morales Ortiz", "subtitulo": "DPI: 2983123450101", "ruta": "/clientes/1" }
    ],
    "audiencias": [],
    "tramites": [],
    "notificaciones": [],
    "diligencias": []
  }
}
```

### 3.3 DTOs de búsqueda

```csharp
// Dtos/Buscar/BusquedaResultadoDto.cs
public class BusquedaResultadoDto
{
    public List<BusquedaItemDto> Expedientes { get; set; } = new();
    public List<BusquedaItemDto> Clientes { get; set; } = new();
    public List<BusquedaItemDto> Audiencias { get; set; } = new();
    public List<BusquedaItemDto> Tramites { get; set; } = new();
    public List<BusquedaItemDto> Notificaciones { get; set; } = new();
    public List<BusquedaItemDto> Diligencias { get; set; } = new();
}

// Dtos/Buscar/BusquedaItemDto.cs
public class BusquedaItemDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = "";
    public string? Subtitulo { get; set; }
    public string Ruta { get; set; } = "";
}
```

### 3.4 Registro en Program.cs

```csharp
builder.Services.AddScoped<IBuscarService, BuscarService>();
```

---

## 4. Frontend — Modelo

### 4.1 Nuevo: `core/models/busqueda.model.ts`

```typescript
export interface BusquedaItem {
    id: number;
    titulo: string;
    subtitulo: string | null;
    ruta: string;
}

export interface BusquedaResultado {
    expedientes: BusquedaItem[];
    clientes: BusquedaItem[];
    audiencias: BusquedaItem[];
    tramites: BusquedaItem[];
    notificaciones: BusquedaItem[];
    diligencias: BusquedaItem[];
}
```

---

## 5. Frontend — Servicios

### 5.1 Nuevo: `core/services/buscar-service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class BuscarService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/buscar`;

    buscar(query: string): Observable<BusquedaResultado> {
        const params = new HttpParams().set('q', query);
        return this.http
            .get<RespuestaApi<BusquedaResultado>>(this.base, { params })
            .pipe(
                map(r => r.data),
                catchError(() => of({
                    expedientes: [], clientes: [], audiencias: [],
                    tramites: [], notificaciones: [], diligencias: []
                }))
            );
    }
}
```

### 5.2 Actualizar: `core/services/notificaciones-service.ts`

Agregar método:

```typescript
contarPendientes(): Observable<number> {
    return this.http
        .get<RespuestaApi<number>>(`${this.base}/pendientes/count`)
        .pipe(
            map(r => r.data),
            catchError(() => of(0))
        );
}
```

---

## 6. Frontend — Topbar Componente

### 6.1 `topbar.ts` — Reescritura

```typescript
@Component({
    selector: 'app-topbar',
    imports: [IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'app-topbar' },
    templateUrl: './topbar.html'
})
export class Topbar implements OnInit, OnDestroy {
    private readonly toast = inject(ToastService);
    private readonly permisos = inject(PermisosService);
    private readonly router = inject(Router);
    private readonly buscarSvc = inject(BuscarService);
    private readonly notificacionesSvc = inject(NotificacionesService);

    readonly auth = inject(AuthService);
    readonly menuToggle = output<void>();

    /* --- Búsqueda --- */
    readonly busquedaQuery = signal('');
    readonly resultadosBusqueda = signal<BusquedaResultado | null>(null);
    readonly mostrarResultados = signal(false);
    private busquedaTimeout: ReturnType<typeof setTimeout> | null = null;

    /* --- Notificaciones --- */
    readonly pendientes = signal(0);

    /* --- Iconos --- */
    readonly iconoSearch = ICONO_SEARCH;
    readonly iconoBell = ICONO_BELL;
    readonly iconoMenu = ICONO_MENU;

    /* --- Permisos --- */
    readonly mostrarOj = computed(() => this.permisos.tiene('notificaciones'));
    readonly iniciales = computed(() => obtenerIniciales(this.auth.nombre() || 'Administrador del Sistema'));

    ngOnInit(): void {
        this.cargarPendientes();
    }

    ngOnDestroy(): void {
        if (this.busquedaTimeout) clearTimeout(this.busquedaTimeout);
    }

    onBusquedaInput(valor: string): void {
        this.busquedaQuery.set(valor);
        this.mostrarResultados.set(valor.length >= 2);

        if (this.busquedaTimeout) clearTimeout(this.busquedaTimeout);
        if (valor.length < 2) {
            this.resultadosBusqueda.set(null);
            return;
        }
        this.busquedaTimeout = setTimeout(() => {
            this.buscarSvc.buscar(valor).subscribe(r => this.resultadosBusqueda.set(r));
        }, 300);
    }

    cerrarResultados(): void {
        setTimeout(() => this.mostrarResultados.set(false), 200);
    }

    navegarResultado(ruta: string): void {
        this.mostrarResultados.set(false);
        this.busquedaQuery.set('');
        this.router.navigateByUrl(ruta);
    }

    cargarPendientes(): void {
        this.notificacionesSvc.contarPendientes().subscribe({
            next: count => this.pendientes.set(count),
            error: () => this.pendientes.set(0)
        });
    }

    verNotificaciones(): void {
        this.router.navigateByUrl('/notificaciones-oj');
    }

    verPortalOj(evento: Event): void {
        evento.preventDefault();
        this.router.navigateByUrl('/notificaciones-oj');
    }
}
```

### 6.2 `topbar.html` — Reescritura

```html
<div class="topbar-left">
    <button type="button" class="btn-menu-toggle" aria-label="Abrir menú"
            (click)="menuToggle.emit()">
        <svg appIcono [appIcono]="iconoMenu"></svg>
    </button>

    <div class="search-box">
        <svg appIcono [appIcono]="iconoSearch"></svg>
        <input type="search"
               placeholder="Buscar expedientes, clientes o audiencias..."
               aria-label="Buscar"
               [value]="busquedaQuery()"
               (input)="onBusquedaInput($any($event.target).value)"
               (blur)="cerrarResultados()"
               autocomplete="off">

        @if (mostrarResultados() && resultadosBusqueda()) {
            <div class="search-results">
                @for (item of resultadosBusqueda()!.expedientes; track item.id) {
                    <a class="search-item" (mousedown)="navegarResultado(item.ruta)">
                        <span class="search-item-label">Expediente</span>
                        <span class="search-item-titulo">{{ item.titulo }}</span>
                        <span class="search-item-sub">{{ item.subtitulo }}</span>
                    </a>
                }
                @for (item of resultadosBusqueda()!.clientes; track item.id) {
                    <a class="search-item" (mousedown)="navegarResultado(item.ruta)">
                        <span class="search-item-label">Cliente</span>
                        <span class="search-item-titulo">{{ item.titulo }}</span>
                        <span class="search-item-sub">{{ item.subtitulo }}</span>
                    </a>
                }
                @for (item of resultadosBusqueda()!.audiencias; track item.id) {
                    <a class="search-item" (mousedown)="navegarResultado(item.ruta)">
                        <span class="search-item-label">Audiencia</span>
                        <span class="search-item-titulo">{{ item.titulo }}</span>
                        <span class="search-item-sub">{{ item.subtitulo }}</span>
                    </a>
                }
                @for (item of resultadosBusqueda()!.tramites; track item.id) {
                    <a class="search-item" (mousedown)="navegarResultado(item.ruta)">
                        <span class="search-item-label">Trámite</span>
                        <span class="search-item-titulo">{{ item.titulo }}</span>
                        <span class="search-item-sub">{{ item.subtitulo }}</span>
                    </a>
                }
                @for (item of resultadosBusqueda()!.notificaciones; track item.id) {
                    <a class="search-item" (mousedown)="navegarResultado(item.ruta)">
                        <span class="search-item-label">Notificación</span>
                        <span class="search-item-titulo">{{ item.titulo }}</span>
                        <span class="search-item-sub">{{ item.subtitulo }}</span>
                    </a>
                }
                @for (item of resultadosBusqueda()!.diligencias; track item.id) {
                    <a class="search-item" (mousedown)="navegarResultado(item.ruta)">
                        <span class="search-item-label">Diligencia</span>
                        <span class="search-item-titulo">{{ item.titulo }}</span>
                        <span class="search-item-sub">{{ item.subtitulo }}</span>
                    </a>
                }

                @if (resultadosBusqueda()!.expedientes.length === 0 &&
                     resultadosBusqueda()!.clientes.length === 0 &&
                     resultadosBusqueda()!.audiencias.length === 0 &&
                     resultadosBusqueda()!.tramites.length === 0 &&
                     resultadosBusqueda()!.notificaciones.length === 0 &&
                     resultadosBusqueda()!.diligencias.length === 0) {
                    <div class="search-empty">Sin resultados para "{{ busquedaQuery() }}"</div>
                }
            </div>
        }
    </div>
</div>

<div class="topbar-right">
    @if (mostrarOj()) {
        <a class="oj-chip" href="#" (click)="verPortalOj($event)">OJ ONLINE</a>
        <span class="topbar-divider" aria-hidden="true"></span>
    }

    <button type="button" class="icon-btn" aria-label="Notificaciones"
            (click)="verNotificaciones()">
        <svg appIcono [appIcono]="iconoBell"></svg>
        @if (pendientes() > 0) {
            <span class="badge-dot">{{ pendientes() }}</span>
        }
    </button>

    <div class="user-chip">
        <div class="user-avatar">{{ iniciales() }}</div>
        <div>
            <div class="user-name">{{ auth.nombre() || 'Administrador' }}</div>
            <div class="user-role">{{ auth.rol() }}</div>
        </div>
    </div>
</div>
```

---

## 7. Frontend — CSS

### 7.1 Agregar en `styles/layout.css` (dentro de `.search-box`)

```css
/* --- Dropdown de resultados de búsqueda --- */
.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid var(--panel-line, #e5e8ea);
    border-radius: var(--radius-field, 8px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    max-height: 400px;
    overflow-y: auto;
    z-index: 50;
    margin-top: 4px;
}

.search-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 1px solid var(--panel-line, #e5e8ea);
    transition: background 0.15s;
}

.search-item:last-child { border-bottom: none; }
.search-item:hover { background: var(--topbar-bg, #f9f9fc); }

.search-item-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--brand, #358292);
    letter-spacing: 0.5px;
}

.search-item-titulo {
    font-size: 14px;
    font-weight: 500;
    color: var(--ink, #1a1c1e);
}

.search-item-sub {
    font-size: 12px;
    color: var(--subtle, #8b9aa0);
}

.search-empty {
    padding: 16px;
    text-align: center;
    color: var(--subtle, #8b9aa0);
    font-size: 13px;
}
```

### 7.2 Actualizar `.search-box` existente

Agregar `position: relative` al `.search-box` existente para que el dropdown se posicione correctamente:

```css
.search-box {
    position: relative;  /* ← agregar */
    /* ... estilos existentes ... */
}
```

---

## 8. Criterios de Aceptación

- [ ] `GET /api/notificaciones/pendientes/count` retorna el número de notificaciones sin atender
- [ ] `GET /api/buscar?q=texto` retorna resultados agrupados por entidad
- [ ] La campana del topbar muestra el conteo real de pendientes (no hardcodeado)
- [ ] El badge se oculta cuando `pendientes === 0`
- [ ] Hacer click en la campana navega a `/notificaciones-oj`
- [ ] La búsqueda muestra un dropdown con resultados categorizados
- [ ] La búsqueda tiene debounce de 300ms
- [ ] La búsqueda se cierra al perder foco
- [ ] Seleccionar un resultado navega a la entidad correspondiente
- [ ] La búsqueda es case-insensitive y soporta tildes
- [ ] `npx ng build` exitoso

---

## 9. Fases de Implementación

| Fase | Descripción | Dependencias |
|------|-------------|-------------|
| **9.1** | SP `SP_Notificacion_ContarPendientes` + migración `17-Topbar-Busqueda-Notificaciones.sql` | Ninguna |
| **9.2** | Backend: endpoint `pendientes/count` + método en servicio | 9.1 |
| **9.3** | Backend: `BuscarController` + `BuscarService` + SPs de búsqueda por entidad | 9.1 |
| **9.4** | Frontend: modelo `busqueda.model.ts` + servicio `buscar-service.ts` | 9.3 |
| **9.5** | Frontend: método `contarPendientes()` en `notificaciones-service.ts` | 9.2 |
| **9.6** | Frontend: reescribir `topbar.ts` + `topbar.html` | 9.4, 9.5 |
| **9.7** | CSS: dropdown de búsqueda en `layout.css` | 9.6 |

---

## 10. Archivos a Modificar/Crear

### Backend
| Archivo | Acción |
|---------|--------|
| `ScriptsDB/17-Topbar-Busqueda-Notificaciones.sql` | **Crear** — SP de conteo pendientes |
| `Back-end/LexControlApi/Controllers/NotificacionesController.cs` | **Modificar** — agregar `pendientes/count` |
| `Back-end/LexControlApi/Services/NotificacionService.cs` | **Modificar** — agregar `ContarPendientesAsync` |
| `Back-end/LexControlApi/Dtos/Notificaciones/NotificacionDtos.cs` | **Modificar** — agregar `ConteoDto` |
| `Back-end/LexControlApi/Controllers/BuscarController.cs` | **Crear** — endpoint de búsqueda global |
| `Back-end/LexControlApi/Services/BuscarService.cs` | **Crear** — servicio de búsqueda cross-entidad |
| `Back-end/LexControlApi/Dtos/Buscar/BusquedaResultadoDto.cs` | **Crear** — DTOs de búsqueda |
| `Back-end/LexControlApi/Program.cs` | **Modificar** — registrar `IBuscarService` |

### Frontend
| Archivo | Acción |
|---------|--------|
| `Front-end/LexControlFornt/src/app/core/models/busqueda.model.ts` | **Crear** — interfaces de búsqueda |
| `Front-end/LexControlFornt/src/app/core/services/buscar-service.ts` | **Crear** — servicio HTTP |
| `Front-end/LexControlFornt/src/app/core/services/notificaciones-service.ts` | **Modificar** — agregar `contarPendientes()` |
| `Front-end/LexControlFornt/src/app/layout/topbar/topbar.ts` | **Reescribir** — lógica real |
| `Front-end/LexControlFornt/src/app/layout/topbar/topbar.html` | **Reescribir** — dropdown + badge dinámico |
| `Front-end/LexControlFornt/src/styles/layout.css` | **Modificar** — estilos del dropdown |
