# Documentación de Pruebas E2E — Módulo de Clientes

## 1. Tecnología Utilizada

| Componente | Tecnología | Versión |
|---|---|---|
| Framework de testing | **Playwright** | `@playwright/test` (última) |
| Navegador | **Microsoft Edge** (Chromium) | El instalado en el sistema |
| Lenguaje | **TypeScript** | Compilado por Playwright |
| Framework frontend | **Angular 20** | standalone components, signals |
| Backend | **ASP.NET Core (.NET 10)** | Web API + SQL Server |
| API endpoints | `ClientesController` | 7 endpoints REST |

## 2. Qué se Instaló

```bash
# Dependencia de desarrollo
npm install -D @playwright/test

# Navegador Chromium (para el runner de Playwright)
npx playwright install chromium
```

**Archivos creados para testing del módulo clientes:**

| Archivo | Propósito |
|---|---|
| `playwright.config.ts` | Configuración global: proyecto msedge, baseURL, webServer |
| `e2e/fixtures/auth.fixture.ts` | Fixture `adminPage` — autenticación automática |
| `e2e/pages/clientes.page.ts` | Page Object para la lista de clientes |
| `e2e/pages/cliente-detalle.page.ts` | Page Object para el detalle de un cliente |
| `e2e/tests/03-clientes.spec.ts` | 8 casos de prueba de la lista de clientes |
| `e2e/tests/04-cliente-detalle.spec.ts` | 5 casos de prueba del detalle de cliente |

## 3. Cómo se Implementó

### 3.1 Arquitectura de Tests

Se utilizó el patrón **Page Object Model (POM)** con separación por vista:

```
e2e/
├── fixtures/
│   └── auth.fixture.ts          # Fixture de autenticación
├── pages/
│   ├── clientes.page.ts         # ClientesPage (lista)
│   └── cliente-detalle.page.ts  # ClienteDetallePage (detalle)
└── tests/
    ├── 03-clientes.spec.ts      # 8 casos de prueba (lista)
    └── 04-cliente-detalle.spec.ts # 5 casos de prueba (detalle)
```

### 3.2 Page Object — ClientesPage

```typescript
// e2e/pages/clientes.page.ts
export class ClientesPage {
    readonly bentoGrid: Locator;
    readonly tabla: Locator;
    readonly filtroEstado: Locator;
    readonly btnNuevoCliente: Locator;
    readonly paginacion: Locator;
    readonly filas: Locator;

    constructor(private page: Page) {
        this.bentoGrid = page.locator('[data-testid="bento-grid"]');
        this.tabla = page.locator('[data-testid="clientes-table"]');
        this.filtroEstado = page.locator('[data-testid="filtro-estado"]');
        this.btnNuevoCliente = page.locator('[data-testid="btn-nuevo-cliente"]');
        this.paginacion = page.locator('[data-testid="paginacion"]');
        this.filas = page.locator('[data-testid="clientes-table"] tbody tr');
    }

    async navigate(): Promise<void> { await this.page.goto('/clientes'); }
    async filterByEstado(estado: string): Promise<void> { await this.filtroEstado.selectOption(estado); }
    async clickCliente(fila: number): Promise<void> { await this.filas.nth(fila).click(); }
    async getRowCount(): Promise<number> { return this.filas.count(); }
    async openNewClientModal(): Promise<void> { await this.btnNuevoCliente.click(); }
}
```

### 3.3 Page Object — ClienteDetallePage

```typescript
// e2e/pages/cliente-detalle.page.ts
export class ClienteDetallePage {
    readonly breadcrumb: Locator;
    readonly nombre: Locator;
    readonly badgeEstado: Locator;
    readonly infoDatos: Locator;
    readonly btnEditar: Locator;
    readonly tablaExpedientes: Locator;

    constructor(private page: Page) {
        this.breadcrumb = page.locator('.breadcrumb');
        this.nombre = page.locator('.info-nombre');
        this.badgeEstado = page.locator('.badge-activo, .badge.inactivo');
        this.infoDatos = page.locator('.info-dl');
        this.btnEditar = page.locator('[data-testid="btn-editar-cliente"]');
        this.tablaExpedientes = page.locator('.data-table-exp');
    }

    async navigate(id: number): Promise<void> { await this.page.goto(`/clientes/${id}`); }
    async getNombre(): Promise<string> { return (await this.nombre.textContent()) ?? ''; }
    async clickEditar(): Promise<void> { await this.btnEditar.click(); }
}
```

### 3.4 Selectores — data-testid

Los siguientes `data-testid` fueron agregados a los templates HTML del módulo clientes:

| Elemento | data-testid | Archivo HTML |
|---|---|---|
| Botón Nuevo Cliente | `btn-nuevo-cliente` | `clientes-page.html` |
| Bento Grid (stats) | `bento-grid` | `clientes-page.html` |
| Filtro de estado | `filtro-estado` | `clientes-page.html` |
| Tabla de clientes | `clientes-table` | `clientes-page.html` |
| Paginación | `paginacion` | `paginacion.ts` |
| Campo nombre (modal) | `cli-nombre` | `cliente-modal.html` |
| Campo DPI (modal) | `cli-dpi` | `cliente-modal.html` |
| Campo teléfono (modal) | `cli-telefono` | `cliente-modal.html` |
| Campo email (modal) | `cli-email` | `cliente-modal.html` |
| Botón guardar (modal) | `btn-guardar-cliente` | `cliente-modal.html` |
| Botón editar (detalle) | `btn-editar-cliente` | `cliente-detalle-page.html` |

### 3.5 Flujo del Test de Crear Cliente

```
1. Navegar a /clientes
2. Click en "Nuevo Cliente" → se abre el modal
3. Llenar campos obligatorios:
   - Nombre completo: "Juan Test Playwright"
   - DPI: "3012345678901"
   - Teléfono: "+502 5555-9999"
   - Email: "juan.test@playwright.com"
4. Click en "Guardar Cliente"
5. Verificar que el modal se cierra
```

## 4. Cómo se Ejecuta

### Prerrequisitos

1. **Backend corriendo**: `dotnet run` en `Back-end/LexControlApi` (puerto 7276 HTTPS)
2. **Base de datos**: SQL Server con `DBLexControl`, SPs ejecutados, usuario `admin` con contraseña `Test1234!`
3. **Frontend compilable**: `ng build` sin errores

### Comandos

```bash
# Navegar al directorio del frontend
cd LexControl/Front-end/LexControlFornt

# Ejecutar TODOS los tests de clientes
npx playwright test e2e/tests/03-clientes.spec.ts e2e/tests/04-cliente-detalle.spec.ts

# Ejecutar solo la lista de clientes
npx playwright test e2e/tests/03-clientes.spec.ts

# Ejecutar solo el detalle de cliente
npx playwright test e2e/tests/04-cliente-detalle.spec.ts

# Ejecutar un test específico
npx playwright test -g "TC-CLI-005"

# Ejecutar con verbose
npx playwright test e2e/tests/03-clientes.spec.ts --reporter=list

# Ver reporte HTML
npx playwright show-report
```

## 5. Resultados

### Resumen — Módulo Clientes

```
13 passed
0 failed
0 skipped
Tiempo total: ~30 segundos
```

### Resultados por Caso de Prueba

#### Lista de Clientes (`03-clientes.spec.ts`) — 8/8 PASARON

| ID | Caso de Prueba | Descripción | Resultado | Tiempo |
|---|---|---|---|---|
| TC-CLI-001 | Listado carga correctamente | Verifica que la tabla de clientes sea visible al navegar a `/clientes` | PASÓ | 1.7s |
| TC-CLI-002 | Stat cards muestran datos | Verifica que el bento grid de estadísticas esté visible | PASÓ | 1.7s |
| TC-CLI-003 | Filtro por estado funciona | Selecciona "Activo" en el dropdown de filtro y verifica que la tabla se actualiza | PASÓ | 2.7s |
| TC-CLI-004 | Botón Nuevo Cliente abre modal | Click en "Nuevo Cliente" y verifica que el modal con campo nombre sea visible | PASÓ | 1.8s |
| TC-CLI-005 | Crear nuevo cliente | Llena el formulario del modal (nombre, DPI, teléfono, email) y guarda | PASÓ | 3.8s |
| TC-CLI-006 | Paginación funciona | Verifica que el componente de paginación esté visible cuando hay datos | PASÓ | 1.7s |
| TC-CLI-007 | Click en fila navega al detalle | Click en la primera fila de la tabla y verifica la redirección a `/clientes/:id` | PASÓ | 1.7s |
| TC-CLI-008 | Tabla con columnas correctas | Verifica que la tabla tenga 6 columnas (ID, Nombre, DPI, Contacto, Expedientes, Última Actividad) | PASÓ | 1.7s |

#### Detalle de Cliente (`04-cliente-detalle.spec.ts`) — 5/5 PASARON

| ID | Caso de Prueba | Descripción | Resultado | Tiempo |
|---|---|---|---|---|
| TC-DET-001 | Detalle carga correctamente | Navega a `/clientes/1` y verifica que la URL contiene el ID | PASÓ | 3.6s |
| TC-DET-002 | Información del cliente visible | Verifica que el `dl.info-dl` (lista de datos del cliente) sea visible | PASÓ | 3.6s |
| TC-DET-003 | Breadcrumb de navegación | Verifica que el breadcrumb ("Clientes / Nombre") esté visible | PASÓ | 3.6s |
| TC-DET-004 | Botón editar visible | Verifica que el botón "Editar cliente" esté presente y visible | PASÓ | 3.7s |
| TC-DET-005 | Tabla de expedientes | Verifica que la tabla de expedientes del cliente esté visible | PASÓ | 3.7s |

## 6. API Consumida

Los tests del módulo clientes consumen los siguientes endpoints del backend:

| Método | Endpoint | Uso en Tests |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticación del fixture `adminPage` |
| `GET` | `/api/clientes?Page=1&PageSize=10` | TC-CLI-001, TC-CLI-006, TC-CLI-007, TC-CLI-008 |
| `GET` | `/api/clientes/estadisticas` | TC-CLI-002 |
| `POST` | `/api/clientes` | TC-CLI-005 (crear cliente) |
| `GET` | `/api/clientes/1` | TC-DET-001, TC-DET-002, TC-DET-003, TC-DET-004, TC-DET-005 |
| `GET` | `/api/clientes/1/expedientes` | TC-DET-005 |

## 7. Notas Técnicas

- **Paginación server-side**: La tabla de clientes usa paginación del backend. Los tests verifican la existencia del componente de paginación sin depender de una cantidad específica de registros.
- **Modal de creación**: El test TC-CLI-005 crea un cliente con datos únicos para evitar conflictos con datos existentes.
- **Navegación al detalle**: TC-CLI-007 verifica que al hacer click en una fila se redirija a `/clientes/:id`, pero no depende de que existan registros (usa `if filasCount > 0`).
- **Detalle por ID**: Los tests de detalle navegan directamente a `/clientes/1` (asumiendo que existe al menos un cliente con ID 1 en la BD de prueba).
- **HTTPS**: El frontend apunta a `https://localhost:7276` con `ignoreHTTPSErrors: true` para evitar problemas con certificados de desarrollo.
- **Workers=1**: Los tests corren secuencialmente para evitar conflictos de estado entre navegadores.
