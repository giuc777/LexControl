# Módulo 08 — Dashboard

> **Módulo:** Conexión del Dashboard a datos reales del API
> **Estado:** Dashboard usa datos hardcodeados (seed). Necesita conectar a API.
> **Ruta frontend:** `/dashboard`

---

## 1. Descripción

El Dashboard es la primera pantalla que ve el usuario. Actualmente muestra datos de prueba (`ESTADISTICAS_SEED`, `EVENTOS_SEED`). Debe conectarse al API para mostrar datos reales.

**Depende de:**
- Módulo 06 (Eventos) — para `GET /api/eventos/dia`
- Módulo 07 (Reportes) — para `GET /api/reportes/alertas-pendientes`
- Módulo 02 (Audiencias) — para `GET /api/audiencias/proximas`

---

## 2. Procedimientos Almacenados

**No se necesitan SPs nuevos.** Se reutilizan los SPs de Eventos, Reportes y Audiencias.

---

## 3. Backend

**No se necesita backend nuevo.** Los endpoints ya existen:
- `GET /api/eventos/dia` (Módulo 06)
- `GET /api/reportes/alertas-pendientes` (Módulo 07)
- `GET /api/audiencias/proximas` (Módulo 02)

---

## 4. Frontend — Cambios en `dashboard-page.ts`

### 4.1 Eliminar seed data

```typescript
// ANTES:
const ESTADISTICAS_SEED = [...];
const EVENTOS_SEED = [...];

// DESPUÉS: Eliminar estas constantes
```

### 4.2 Inyectar servicios

```typescript
export class DashboardPage {
  private eventosService = inject(EventosService);
  private reportesService = inject(ReportesService);
  private audienciasService = inject(AudienciasService);

  readonly estadisticas = signal<Estadistica[]>([]);
  readonly eventos = signal<Evento[]>([]);

  constructor() {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    // Cargar eventos del día
    this.eventosService.obtenerDelDia(new Date()).subscribe({
      next: r => { if (r.success) this.eventos.set(r.data); }
    });

    // Cargar alertas pendientes (stat cards)
    this.reportesService.alertasPendientes().subscribe({
      next: r => {
        if (r.success) {
          this.estadisticas.set(r.data.resumen.map(a => ({
            titulo: a.tipo,
            valor: a.cantidad,
            icono: this.obtenerIcono(a.tipo),
            color: this.obtenerColor(a.tipo)
          })));
        }
      }
    });
  }
}
```

### 4.3 Stat cards dinámicas

Reemplazar las stat cards hardcodeadas por datos del API:
- Expedientes activos → `alertasPendientes` (tipo = "Expedientes")
- Audiencias próximas → `audiencias.proximas(7)` (count)
- Trámites pendientes → `alertasPendientes` (tipo = "Trámites")
- Notificaciones pendientes → `alertasPendientes` (tipo = "Notificaciones")

### 4.4 Agenda semanal

Reemplazar `EVENTOS_SEED` por `eventosService.obtenerDelDia()` para cada día de la semana.

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

- [ ] Las stat cards muestran datos reales del API
- [ ] La agenda semanal muestra eventos reales
- [ ] No hay datos seed hardcodeados
- [ ] Loading states al cargar datos
- [ ] Empty state cuando no hay datos
- [ ] `npx ng build` exitoso
- [ ] Tests Playwright pasan
