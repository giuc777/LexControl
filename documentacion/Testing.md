# Testing — Frameworks y Implementación en LexControl

> Documentación técnica que describe los frameworks de testing utilizados en el proyecto **LexControl**, cómo se configuraron, cómo se ejecutan y cómo escribir nuevos tests.

---

## 1. Visión General

LexControl utiliza **dos frameworks de testing** en capas complementarias:

| Capa | Framework | Tipo | Ubicación |
|---|---|---|---|
| **Unit Tests** | Jasmine + Karma | Tests aislados de servicios/componentes | `src/**/*.spec.ts` |
| **E2E Tests** | Playwright | Tests de integración end-to-end | `e2e/tests/*.spec.ts` |

```
                    ┌─────────────────────────────────┐
                    │         E2E (Playwright)         │
                    │  Navegador real, flujo completo  │
                    │  Login → Navegar → Verificar     │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │      Unit Tests (Jasmine)        │
                    │  Servicios HTTP aislados         │
                    │  Mock de HTTP, sin backend       │
                    └─────────────────────────────────┘
```

---

## 2. Unit Tests — Jasmine + Karma

### 2.1 ¿Qué es?

- **Jasmine**: Framework de assertions que provee `describe()`, `it()`, `expect()`, `beforeEach()`, `afterEach()`
- **Karma**: Test runner que ejecuta los tests en un navegador real (Chrome) y genera reportes

### 2.2 Configuración

**Dependencias en `package.json`:**

```json
{
  "devDependencies": {
    "@types/jasmine": "~5.1.0",
    "jasmine-core": "~5.8.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0"
  }
}
```

**Configuración en `angular.json`:**

```json
{
  "test": {
    "builder": "@angular/build:karma",
    "options": {
      "polyfills": ["zone.js", "zone.js/testing"],
      "tsConfig": "tsconfig.spec.json",
      "styles": ["src/styles.css"]
    }
  }
}
```

**`tsconfig.spec.json`:**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["jasmine"]
  },
  "include": ["src/**/*.ts"]
}
```

### 2.3 Convención de archivos

- Los archivos de unit tests se nombran `*.spec.ts`
- Se colocan **junto al archivo que testea** (misma carpeta)
- Ejemplo: `usuarios-service.ts` → `usuarios-service.spec.ts`

### 2.4 Ejecución

```bash
# Ejecutar todos los unit tests (abre Chrome)
ng test

# Ejecutar una sola vez (sin watcher)
ng test --watch=false

# Ejecutar con cobertura de código
ng test --code-coverage

# Ejecutar un archivo específico
ng test --include='**/usuarios-service.spec.ts'
```

### 2.5 Patrones de implementación

#### Test básico de servicio HTTP

```typescript
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UsuariosService } from './usuarios-service';

describe('UsuariosService', () => {
    let servicio: UsuariosService;
    let httpMock: HttpTestingController;

    // Configurar TestBed ANTES de cada test
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        servicio = TestBed.inject(UsuariosService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    // Verificar que no queden peticiones pendientes
    afterEach(() => httpMock.verify());

    it('lista usuarios sin filtros', () => {
        servicio.listar().subscribe();

        // Esperar una petición GET a la URL correcta
        const peticion = httpMock.expectOne(BASE_URL);
        expect(peticion.request.method).toBe('GET');

        // Simular respuesta del backend
        peticion.flush({ success: true, data: [], error: null });
    });
});
```

#### Test con autenticación (sessionStorage)

```typescript
function sembrarSesion(rolId: number, rol: string): void {
    sessionStorage.setItem('lexcontrol_token', 'jwt-prueba');
    sessionStorage.setItem('lexcontrol_usuario', 'admin');
    sessionStorage.setItem('lexcontrol_rolId', String(rolId));
    sessionStorage.setItem('lexcontrol_rol', rol);
    sessionStorage.setItem(
        'lexcontrol_expiracion',
        new Date(Date.now() + 60 * 60 * 1000).toISOString()
    );
}

beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()]
    });
});

afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
});
```

#### Test de componente Angular

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter([])]
        }).compileComponents();
    });

    it('se crea correctamente', () => {
        const fixture = TestBed.createComponent(App);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
```

### 2.6 API de Jasmine (referencia rápida)

| Método | Uso |
|---|---|
| `describe('nombre', fn)` | Agrupa tests relacionados (suite) |
| `it('descripcion', fn)` | Define un caso de prueba |
| `expect(valor).toBe(esperado)` | Igualdad estricta (`===`) |
| `expect(valor).toEqual(objeto)` | Igualdad profunda (objetos) |
| `expect(valor).toBeTruthy()` | Evalúa como `true` |
| `expect(valor).toBeFalsy()` | Evalúa como `false` |
| `expect(valor).toBeNull()` | Es `null` |
| `expect(valor).toContain(elemento)` | Array/string contiene el elemento |
| `expect(funcion).toThrowError()` | Lanza excepción |
| `beforeEach(fn)` | Se ejecuta antes de cada `it` |
| `afterEach(fn)` | Se ejecuta después de cada `it` |

### 2.7 API de HttpTestingController (Angular)

| Método | Uso |
|---|---|
| `httpMock.expectOne(url)` | Espera exactamente una petición a la URL |
| `httpMock.expectNone(url)` | Verifica que NO haya peticiones a la URL |
| `httpMock.match(url)` | Coincide con 0 o más peticiones |
| `peticion.flush(datos)` | Simula respuesta exitosa |
| `peticion.flush(datos, { status, statusText })` | Simula respuesta con error HTTP |
| `peticion.error(new ErrorEvent('...'))` | Simula error de red |
| `httpMock.verify()` | Verifica que no queden peticiones sin resolver |

---

## 3. E2E Tests — Playwright

### 3.1 ¿Qué es?

**Playwright** es un framework de testing E2E que ejecuta tests en un navegador real (Edge/Chromium/Firefox) simulando interacciones de usuario: clics, escritura, navegación, esperas.

### 3.2 Configuración

**Dependencia en `package.json`:**

```json
{
  "devDependencies": {
    "@playwright/test": "^1.62.1"
  }
}
```

**`playwright.config.ts`:**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/tests',          // Carpeta de tests
    fullyParallel: false,            // Secuencial (por sessionStorage)
    workers: 1,                      // Un solo worker
    reporter: [['html', { open: 'never' }]],

    use: {
        baseURL: 'http://localhost:4200',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        ignoreHTTPSErrors: true
    },

    projects: [
        {
            name: 'msedge',
            use: { ...devices['Desktop Edge'] }
        }
    ],

    webServer: {
        command: 'ng serve',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        timeout: 120000
    }
});
```

### 3.3 Convención de archivos

```
e2e/
├── fixtures/
│   └── auth.fixture.ts       # Fixture reutilizable de autenticación
├── pages/
│   ├── login.page.ts         # Page Object: página de login
│   ├── dashboard.page.ts     # Page Object: dashboard
│   ├── ajustes.page.ts       # Page Object: ajustes
│   └── reportes.page.ts      # Page Object: reportes
└── tests/
    ├── 01-login.spec.ts      # Tests de login
    ├── 02-dashboard.spec.ts  # Tests de dashboard
    ├── 05-ajustes.spec.ts    # Tests de ajustes
    ├── 06-reportes.spec.ts   # Tests de reportes
    └── 07-permisos.spec.ts   # Tests de permisos
```

### 3.4 Page Object Model (POM)

Patrón que separa la **localización de elementos** de las **aserciones**:

```typescript
// e2e/pages/login.page.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly usuario: Locator;
    readonly contrasena: Locator;
    readonly btnLogin: Locator;
    readonly error: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usuario = page.locator('[data-testid="usuario"]');
        this.contrasena = page.locator('[data-testid="contrasena"]');
        this.btnLogin = page.locator('[data-testid="btn-login"]');
        this.error = page.locator('[data-testid="login-error"]');
    }

    async goto(): Promise<void> {
        await this.page.goto('/login');
    }

    async login(usuario: string, contrasena: string): Promise<void> {
        await this.usuario.fill(usuario);
        await this.contrasena.fill(contrasena);
        await this.btnLogin.click();
    }
}
```

```typescript
// e2e/tests/01-login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('TC-LOGIN-001: Login exitoso con credenciales válidas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'Test1234!');

    await expect(page).toHaveURL(/.*dashboard/);
});
```

### 3.5 Fixture de autenticación

Evita repetir el login en cada test:

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

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

### 3.6 Ejecución

```bash
# Prerrequisitos
# 1. Backend corriendo: dotnet run (puerto 7276)
# 2. Frontend compilable: ng build sin errores

# Instalar Playwright y navegador
npm install -D @playwright/test
npx playwright install chromium

# Ejecutar todos los tests E2E
npx playwright test

# Ejecutar con más detalle en consola
npx playwright test --reporter=list

# Ejecutar un módulo específico
npx playwright test e2e/tests/01-login.spec.ts

# Ejecutar un test por nombre
npx playwright test -g "TC-LOGIN-001"

# Ver reporte HTML
npx playwright show-report
```

### 3.7 API de Playwright (referencia rápida)

| Método | Uso |
|---|---|
| `page.goto('/ruta')` | Navegar a una URL |
| `page.locator('[data-testid="x"]')` | Localizar elemento por testid |
| `locator.fill('texto')` | Escribir en un input |
| `locator.click()` | Hacer clic |
| `locator.textContent()` | Obtener texto |
| `expect(locator).toBeVisible()` | Elemento visible |
| `expect(locator).toHaveText('x')` | Texto exacto |
| `expect(locator).toContainText('x')` | Texto parcial |
| `expect(page).toHaveURL(/regex/)` | URL coincide con regex |
| `page.waitForURL('**/ruta')` | Esperar redirección |
| `page.waitForSelector('[data-testid="x"]')` | Esperar que aparezca un elemento |

---

## 4. data-testid — Selectores estables

Se agregan atributos `data-testid` en los templates HTML para que los tests no dependan de clases CSS o estructura DOM:

```html
<!-- HTML -->
<input type="text" data-testid="usuario" placeholder="Usuario" />
<button data-testid="btn-login">Iniciar Sesión</button>
```

```typescript
// Test
await page.locator('[data-testid="usuario"]').fill('admin');
await page.locator('[data-testid="btn-login"]').click();
```

### Selectores definidos en el proyecto

| Componente | data-testid | Archivo |
|---|---|---|
| Campo usuario | `usuario` | `login-page.html` |
| Campo contraseña | `contrasena` | `login-page.html` |
| Botón login | `btn-login` | `login-page.html` |
| Error login | `login-error` | `login-page.html` |
| Sidebar | `sidebar` | `sidebar.html` |
| Bento grid clientes | `bento-grid` | `clientes-page.html` |
| Tabla clientes | `clientes-table` | `clientes-page.html` |
| Filtro estado clientes | `filtro-estado` | `clientes-page.html` |
| Botón nuevo cliente | `btn-nuevo-cliente` | `clientes-page.html` |
| Botón nuevo expediente | `btn-nuevo-expediente` | `expedientes-page.html` |
| Tabla expedientes | `expedientes-table` | `expedientes-page.html` |
| Filtro rama | `filtro-rama` | `expedientes-page.html` |
| Filtro estado expediente | `filtro-estado` | `expedientes-page.html` |
| Paginación | `paginacion` | `paginacion.ts` |
| Stats dashboard | `dashboard-stats` | `dashboard-page.html` |
| Agenda semanal | `agenda-semanal` | `dashboard-page.html` |
| Grid ajustes | `ajustes-grid` | `ajustes-page.html` |
| Categorías reportes | `reportes-categorias` | `reportes-page.html` |

---

## 5. Unit Tests existentes

### 5.1 `usuarios-service.spec.ts` — 6 tests

| Test | Qué verifica |
|---|---|
| `lista usuarios sin filtros` | GET sin query params |
| `envía los filtros como query params` | Filtros se codifican como query params |
| `obtiene el catálogo de roles` | GET `/roles` desempaqueta el sobre |
| `crea un usuario con el body esperado` | POST con body correcto |
| `cambia el estado con PUT /{id}/estado` | PUT con `{ activo: false }` |
| `desbloquea con POST /{id}/desbloquear` | POST a endpoint de desbloqueo |

### 5.2 `auth-service.spec.ts` — 4 tests

| Test | Qué verifica |
|---|---|
| `inicia sesión y persiste el token` | POST login + sessionStorage |
| `propaga el error con credenciales inválidas` | 401 no crea sesión |
| `rechaza sesión con token vencido` | Token expirado → limpiar storage |
| `cerrarSesion limpia el storage` | Logout completo |

### 5.3 `permisos-service.spec.ts` — 5 tests

| Test | Qué verifica |
|---|---|
| `carga y ordena el menú del rol` | GET `/permisos/{rolId}` + ordenamiento |
| `ante fallo conserva defaults` | Error 500 → menú por defecto |
| `obtiene la matriz completa` | GET `/permisos` |
| `guarda la matriz de un rol` | PUT con estructura de módulos |
| `matrizDefectoDe devuelve copia editable` | Función helper |

### 5.4 `app.spec.ts` — 1 test

| Test | Qué verifica |
|---|---|
| `se crea correctamente` | Componente App se instancia |

---

## 6. E2E Tests existentes

### 6.1 Resumen por módulo

| Archivo | Módulo | Tests | Estado |
|---|---|---|---|
| `01-login.spec.ts` | Login | 5 | ✅ Todos pasan |
| `02-dashboard.spec.ts` | Dashboard | 4 | ✅ Todos pasan |
| `05-ajustes.spec.ts` | Ajustes | 6 | ✅ Todos pasan |
| `06-reportes.spec.ts` | Reportes | 3 | ✅ Todos pasan |
| `07-permisos.spec.ts` | Permisos | 4 | ✅ Todos pasan |
| **Total** | | **22** | **✅** |

### 6.2 IDs de casos de prueba

| ID | Módulo | Descripción |
|---|---|---|
| TC-LOGIN-001 | Login | Login exitoso con credenciales válidas |
| TC-LOGIN-002 | Login | Login fallido con contraseña incorrecta |
| TC-LOGIN-003 | Login | Login fallido con usuario inexistente |
| TC-LOGIN-004 | Login | Campos obligatorios vacíos |
| TC-LOGIN-005 | Login | Cierre de sesión |
| TC-DASH-001 | Dashboard | Carga del dashboard con stat cards |
| TC-DASH-002 | Dashboard | Sidebar visible con navegación |
| TC-DASH-003 | Dashboard | Agenda semanal visible |
| TC-DASH-004 | Dashboard | Navegación a módulo desde sidebar |
| TC-ADJ-001 | Ajustes | Página de ajustes carga correctamente |
| TC-ADJ-002 | Ajustes | Tarjeta de perfil visible |
| TC-ADJ-003 | Ajustes | Módulos de administrador visibles |
| TC-ADJ-004 | Ajustes | Tarjeta de seguridad visible |
| TC-ADJ-005 | Ajustes | Sidebar funciona en ajustes |
| TC-ADJ-006 | Ajustes | Navegar de ajustes a dashboard |
| TC-REP-001 | Reportes | Página de reportes carga correctamente |
| TC-REP-002 | Reportes | Categorías de reporte visibles |
| TC-REP-003 | Reportes | Sidebar funciona en reportes |
| TC-PERM-001 | Permisos | Admin puede acceder a todos los módulos |
| TC-PERM-002 | Permisos | Sidebar muestra módulos correctos para admin |
| TC-PERM-003 | Permisos | Navegación entre módulos funciona |
| TC-PERM-004 | Permisos | Ruta no válida redirige a dashboard |

---

## 7. Cómo agregar nuevos tests

### 7.1 Nuevo unit test de servicio

1. Crear `mi-servicio.spec.ts` junto a `mi-servicio.ts`
2. Importar `provideHttpClient()` y `provideHttpClientTesting()`
3. Configurar `TestBed` en `beforeEach`
4. Usar `HttpTestingController` para mockear peticiones HTTP
5. Verificar con `httpMock.verify()` en `afterEach`

```typescript
// Ejemplo: catalogos-service.spec.ts
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogosService } from './catalogos-service';

describe('CatalogosService', () => {
    let servicio: CatalogosService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        servicio = TestBed.inject(CatalogosService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('buscarCatalogo retorna items del sobre', () => {
        servicio.buscarCatalogo('RAMA').subscribe(resp => {
            expect(resp.items.length).toBe(6);
        });

        const peticion = httpMock.expectOne(r => r.url.includes('/api/catalogos/RAMA'));
        expect(peticion.request.method).toBe('GET');
        peticion.flush({
            success: true,
            data: [
                { id: 1, nombre: 'Civil', activo: true },
                { id: 2, nombre: 'Penal', activo: true }
            ],
            error: null
        });
    });
});
```

### 7.2 Nuevo test E2E

1. Crear `e2e/tests/XX-modulo.spec.ts`
2. Importar `test` del fixture o de `@playwright/test`
3. Usar `data-testid` para localizar elementos
4. Seguir la convención `TC-MODULO-NNN`

```typescript
// Ejemplo: 08-expedientes.spec.ts
import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth.fixture';

authTest('TC-EXP-001: Tabla de expedientes carga correctamente', async ({ adminPage }) => {
    await adminPage.click('[data-testid="nav-expedientes"]');
    await adminPage.waitForURL('**/expedientes');

    const tabla = adminPage.locator('[data-testid="expedientes-table"]');
    await expect(tabla).toBeVisible();
});
```

---

## 8. Buenas prácticas

### Unit Tests

- **Un assertion por test**: Cada `it` debe verificar una cosa específica
- **Nombres descriptivos**: `describe('UsuariosService')` + `it('crea un usuario con el body esperado')`
- **Siempre mockear HTTP**: Nunca hacer llamadas reales al backend en unit tests
- **Verificar después**: `httpMock.verify()` detecta peticiones pendientes
- **Limpiar estado**: `sessionStorage.clear()` entre tests que usan autenticación

### E2E Tests

- **Usar data-testid**: Nunca depender de clases CSS o estructura DOM
- **Page Objects**: Separar localización de aserciones
- **Fixture de auth**: Reutilizar `adminPage` en vez de repetir login
- **Esperas explícitas**: `waitForURL()`, `waitForSelector()` en vez de `setTimeout`
- **Un test aislado**: Cada test debe funcionar independientemente
- **Workers=1**: Evitar conflictos de estado (sessionStorage)

---

## 9. Referencias

- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Runner](https://karma-runner.github.io/)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Angular HttpClient Testing](https://angular.dev/guide/http/making-requests#testing-requests)
