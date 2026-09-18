# Módulo 08 — Dashboard

> **Módulo:** Conexión del Dashboard a datos reales del API
> **Estado:** ✅ COMPLETADO — Stat cards conectadas a datos reales
> **Ruta frontend:** `/dashboard`

---

## 1. Descripción

El Dashboard es la primera pantalla que ve el usuario. Muestra stat cards con datos reales y agenda semanal desde la API.

**Conexiones a API:**
- ✅ `GET /api/expedientes` — Expedientes activos (conteo)
- ✅ `GET /api/audiencias` — Audiencias próximas (conteo) + agenda semanal
- ✅ `GET /api/tramites` — Trámites pendientes (conteo)
- ✅ `GET /api/notificaciones` — Notificaciones OJ pendientes (conteo)
- ✅ `GET /api/eventos/semana` — Agenda semanal (eventos propios por rango de fechas)
- ✅ `GET /api/diligencias` — Agenda semanal (diligencias por rango de fechas)

---

## 2. Procedimientos Almacenados

- ✅ `SP_Evento_ObtenerDeLaSemana` — nuevo SP para la agenda semanal (rango de fechas). Ver Módulo 06 / `ScriptsDB/16-Eventos-Agenda-Semanal.sql`.
- Se reutilizan los SPs de Eventos, Reportes, Audiencias, Diligencias y Expedientes.

---

## 3. Backend

**No se necesita backend nuevo.** Los endpoints ya existen:
- `GET /api/eventos/semana` (Módulo 06) — eventos propios por rango
- `GET /api/audiencias` (Módulo 02) — audiencias por rango
- `GET /api/diligencias` (Módulo 04) — diligencias por rango
- `GET /api/expedientes`, `GET /api/tramites`, `GET /api/notificaciones` (stat cards)

---

## 4. Frontend — Cambios en `dashboard-page.ts`

### 4.1 Eliminar seed data

Las constantes `ESTADISTICAS_SEED` / `EVENTOS_SEED` se eliminaron. Las stat cards se inicializan en un `signal` con valores `0` y detalle `"Cargando..."`, y se reemplazan al recibir la respuesta del API.

### 4.2 Inyectar servicios

```typescript
export class DashboardPage implements OnInit {
  private readonly eventosSvc = inject(EventosService);
  private readonly expedientesSvc = inject(ExpedientesService);
  private readonly audienciasSvc = inject(AudienciasService);
  private readonly diligenciasSvc = inject(DiligenciasService);
  private readonly tramitesSvc = inject(TramitesService);
  private readonly notificacionesSvc = inject(NotificacionesService);

  readonly estadisticas = signal<StatCard[]>([...placeholders...]);
  private readonly agendaRaw = signal<EventoAgenda[]>([]);

  ngOnInit(): void {
    this.cargarAgendaSemana();
    this.cargarEstadisticas();
  }
}
```

### 4.3 Stat cards dinámicas

- Expedientes activos → `expedientesSvc.listar({ estadoId: 1 })` (`data.total`)
- Audiencias próximas → `audienciasSvc.listar({})` filtrando `fecha >= hoy`
- Trámites pendientes → `tramitesSvc.listar({})` filtrando estados distintos de `Resuelto`/`Rechazado`
- Notificaciones OJ → `notificacionesSvc.listar({})` filtrando `estado === 'Pendiente'`

### 4.4 Agenda semanal

La agenda se carga para la semana visible (lunes a viernes) combinando **tres fuentes** con `forkJoin`, igual que el módulo de Agenda:

```typescript
forkJoin({
  eventos: this.eventosSvc.obtenerDeLaSemana(fechaInicio, fechaFin),
  audiencias: this.audienciasSvc.listar({ fechaInicio, fechaFin }),
  diligencias: this.diligenciasSvc.listar({ fechaInicio, fechaFin })
}).subscribe(({ eventos, audiencias, diligencias }) => {
  // Normaliza las tres fuentes a EventoAgenda y las combina en agendaRaw
});
```

Los eventos se posicionan dentro de una jornada de **8:00 a 20:00** (12 filas horarias) y se limita la posición vertical para que ninguno se desborde de la columna. La cuadrícula usa `totalFilas = HORAS + 2` (cabecera + horas).

---

## 5. Tests Playwright

### Actualizar `02-dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
  });

  test('muestra stat cards con datos reales', async ({ page }) => {
    await expect(page.locator('[data-testid="stat-expedientes"]')).toBeVisible();
  });

  test('muestra agenda semanal', async ({ page }) => {
    const agenda = page.locator('[data-testid="agenda-semanal"]');
    const empty = page.locator('[data-testid="empty-agenda"]');
    await expect(agenda.or(empty)).toBeVisible();
  });

  test('muestra eventos del día o empty state', async ({ page }) => {
    const eventos = page.locator('[data-testid="evento-agenda"]');
    const empty = page.locator('[data-testid="empty-agenda"]');
    await expect(eventos.or(empty)).toBeVisible();
  });

  test('navega al hacer click en stat card', async ({ page }) => {
    await page.click('[data-testid="stat-expedientes"]');
    await expect(page).toHaveURL('/expedientes');
  });
});
```

---

## 6. Criterios de Aceptación

- [x] Las stat cards muestran datos reales del API
- [x] La agenda semanal muestra eventos reales (eventos + audiencias + diligencias)
- [x] No hay datos seed hardcodeados
- [x] Loading states al cargar datos
- [x] Empty state cuando no hay datos
- [x] `npx ng build` exitoso
- [ ] Tests Playwright pasan
