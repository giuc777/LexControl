# Documentación de Pruebas E2E — Login, Ajustes y Permisos

## 1. Tecnología Utilizada

| Componente | Tecnología | Versión |
|---|---|---|
| Framework de testing | **Playwright** | `@playwright/test` (última) |
| Navegador | **Microsoft Edge** (Chromium) | El instalado en el sistema |
| Lenguaje | **TypeScript** | Compilado por Playwright |
| Framework frontend | **Angular 20** | standalone components, signals |
| Backend | **ASP.NET Core (.NET 10)** | Web API + SQL Server |

## 2. Qué se Instaló

```bash
# Dependencia de desarrollo
npm install -D @playwright/test

# Navegador Chromium (necesario para el runner de Playwright)
npx playwright install chromium

# Edge ya estaba instalado en el sistema; Playwright lo detecta automáticamente
```

**Archivos creados para la infraestructura de testing:**

| Archivo | Propósito |
|---|---|
| `playwright.config.ts` | Configuración: proyecto msedge, baseURL, webServer, workers |
| `e2e/fixtures/auth.fixture.ts` | Fixture `adminPage` — provee página ya autenticada como admin |
| `e2e/pages/login.page.ts` | Page Object para la página de login |
| `e2e/pages/dashboard.page.ts` | Page Object para el dashboard |
| `e2e/pages/ajustes.page.ts` | Page Object para la página de ajustes |
| `e2e/pages/reportes.page.ts` | Page Object para la página de reportes |
| `e2e/tests/01-login.spec.ts` | Tests del módulo de login |
| `e2e/tests/02-dashboard.spec.ts` | Tests del dashboard |
| `e2e/tests/05-ajustes.spec.ts` | Tests del módulo de ajustes |
| `e2e/tests/06-reportes.spec.ts` | Tests del módulo de reportes |
| `e2e/tests/07-permisos.spec.ts` | Tests de permisos y navegación |

## 3. Cómo se Implementó

### 3.1 Arquitectura de Tests

Se utilizó el patrón **Page Object Model (POM)** para separar la lógica de localización de elementos del assertions de los tests:

```
e2e/
├── fixtures/
│   └── auth.fixture.ts       # Fixture reutilizable de autenticación
├── pages/
│   ├── login.page.ts         # LoginPage
│   ├── dashboard.page.ts     # DashboardPage
│   ├── ajustes.page.ts       # AjustesPage
│   └── reportes.page.ts      # ReportesPage
└── tests/
    ├── 01-login.spec.ts      # 5 casos de prueba
    ├── 02-dashboard.spec.ts  # 4 casos de prueba
    ├── 05-ajustes.spec.ts    # 6 casos de prueba
    ├── 06-reportes.spec.ts   # 3 casos de prueba
    └── 07-permisos.spec.ts   # 4 casos de prueba
```

### 3.2 Fixture de Autenticación

El fixture `adminPage` crea un contexto de navegador nuevo, navega a `/login`, ingresa credenciales `admin/Test1234!` y espera la redirección a `/dashboard`. Esto evita repetir el login en cada test:

```typescript
// e2e/fixtures/auth.fixture.ts
export const test = base.extend<{ adminPage: Page }>({
    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();
        await page.goto('/login');
        await page.locator('[data-testid="usuario"]').fill('admin');
        await page.locator('[data-testid="contrasena"]').fill('Test1234!');
        await page.locator('[data-testid="btn-login"]').click();
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        await use(page);
        await context.close();
    }
});
```

### 3.3 Selectores — data-testid

Se agregaron atributos `data-testid` a los templates HTML para selectores estables:

| Componente | data-testid | Archivo |
|---|---|---|
| Campo usuario | `usuario` | `login-page.html` |
| Campo contraseña | `contrasena` | `login-page.html` |
| Botón login | `btn-login` | `login-page.html` |
| Error login | `login-error` | `login-page.html` |
| Sidebar | `sidebar` | `sidebar.html` |
| Bento grid clientes | `bento-grid` | `clientes-page.html` |
| Tabla clientes | `clientes-table` | `clientes-page.html` |
| Filtro estado | `filtro-estado` | `clientes-page.html` |
| Botón nuevo cliente | `btn-nuevo-cliente` | `clientes-page.html` |
| Paginación | `paginacion` | `paginacion.ts` |
| Stats dashboard | `dashboard-stats` | `dashboard-page.html` |
| Agenda semanal | `agenda-semanal` | `dashboard-page.html` |
| Grid ajustes | `ajustes-grid` | `ajustes-page.html` |
| Categorías reportes | `reportes-categorias` | `reportes-page.html` |

### 3.4 Configuración de Playwright

```typescript
// playwright.config.ts
export default defineConfig({
    testDir: './e2e/tests',
    fullyParallel: false,
    workers: 1,
    use: {
        baseURL: 'http://localhost:4200',
        ignoreHTTPSErrors: true,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure'
    },
    projects: [{ name: 'msedge', use: { ...devices['Desktop Edge'] } }],
    webServer: {
        command: 'ng serve',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        timeout: 120000
    }
});
```

## 4. Cómo se Ejecuta

### Prerrequisitos

1. **Backend corriendo**: `dotnet run` en `Back-end/LexControlApi` (puerto 7276 HTTPS)
2. **Base de datos**: SQL Server con `DBLexControl` y SPs ejecutados
3. **Frontend compilable**: `ng build` sin errores

### Comandos

```bash
# Navegar al directorio del frontend
cd LexControl/Front-end/LexControlFornt

# Ejecutar TODOS los tests
npx playwright test

# Ejecutar con reporter de lista (más detalle en consola)
npx playwright test --reporter=list

# Ejecutar un módulo específico
npx playwright test e2e/tests/01-login.spec.ts

# Ejecutar un test específico por nombre
npx playwright test -g "TC-LOGIN-001"

# Ver reporte HTML generado
npx playwright show-report
```

## 5. Resultados

### Resumen General

```
35 passed (1.5m)
0 failed
0 skipped
```

### Resultados por Módulo

#### Módulo Login (`01-login.spec.ts`) — 5/5 PASARON

| ID | Caso de Prueba | Resultado | Tiempo |
|---|---|---|---|
| TC-LOGIN-001 | Login exitoso con credenciales válidas | PASÓ | 2.2s |
| TC-LOGIN-002 | Login fallido con contraseña incorrecta | PASÓ | 1.6s |
| TC-LOGIN-003 | Login fallido con usuario inexistente | PASÓ | 1.7s |
| TC-LOGIN-004 | Campos obligatorios vacíos | PASÓ | 1.7s |
| TC-LOGIN-005 | Cierre de sesión | PASÓ | 3.8s |

#### Módulo Dashboard (`02-dashboard.spec.ts`) — 4/4 PASARON

| ID | Caso de Prueba | Resultado | Tiempo |
|---|---|---|---|
| TC-DASH-001 | Carga del dashboard con stat cards | PASÓ | 4.6s |
| TC-DASH-002 | Sidebar visible con navegación | PASÓ | 7.3s |
| TC-DASH-003 | Agenda semanal visible | PASÓ | 4.3s |
| TC-DASH-004 | Navegación a módulo desde sidebar | PASÓ | 2.0s |

#### Módulo Ajustes (`05-ajustes.spec.ts`) — 6/6 PASARON

| ID | Caso de Prueba | Resultado | Tiempo |
|---|---|---|---|
| TC-ADJ-001 | Página de ajustes carga correctamente | PASÓ | 1.7s |
| TC-ADJ-002 | Tarjeta de perfil visible | PASÓ | 1.8s |
| TC-ADJ-003 | Módulos de administrador visibles | PASÓ | 1.7s |
| TC-ADJ-004 | Tarjeta de seguridad visible | PASÓ | 1.7s |
| TC-ADJ-005 | Sidebar funciona en ajustes | PASÓ | 1.7s |
| TC-ADJ-006 | Navegar de ajustes a dashboard | PASÓ | 1.8s |

#### Módulo Reportes (`06-reportes.spec.ts`) — 3/3 PASARON

| ID | Caso de Prueba | Resultado | Tiempo |
|---|---|---|---|
| TC-REP-001 | Página de reportes carga correctamente | PASÓ | 1.6s |
| TC-REP-002 | Categorías de reporte visibles | PASÓ | 1.7s |
| TC-REP-003 | Sidebar funciona en reportes | PASÓ | 1.7s |

#### Permisos y Navegación (`07-permisos.spec.ts`) — 4/4 PASARON

| ID | Caso de Prueba | Resultado | Tiempo |
|---|---|---|---|
| TC-PERM-001 | Admin puede acceder a todos los módulos | PASÓ | 1.6s |
| TC-PERM-002 | Sidebar muestra módulos correctos para admin | PASÓ | 1.5s |
| TC-PERM-003 | Navegación entre módulos funciona | PASÓ | 1.8s |
| TC-PERM-004 | Ruta no válida redirige a dashboard | PASÓ | 3.8s |

### Tiempo Total de Ejecución

**1 minuto 30 segundos** para 35 tests (promedio ~2.5s por test).

## 6. Notas Técnicas

- **HTTPS**: El frontend apunta a `https://localhost:7276` con `ignoreHTTPSErrors: true` en Playwright para evitar problemas con el certificado de desarrollo.
- **Borrado lógico**: Los tests de login fallido verifican que se muestre el mensaje de error sin revelar si el usuario existe o no (seguridad).
- **Fixture reutilizable**: El `adminPage` se usa en 28 de los 35 tests, evitando repetir el proceso de login.
- **Workers=1**: Los tests corren secuencialmente para evitar conflictos de estado (sessionStorage del login).
