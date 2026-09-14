# Módulo 01 — Catálogos y Juzgados

> **Estado:** El backend ya tiene el controller y service, pero faltan 5 SPs que el service llama.
> **Prerequisito:** `sp_seguridad.sql` ejecutado
> **Archivos SQL de salida:** `ScriptsDB/sp_catalogos_juzgados.sql`

---

## 1. Descripción

El módulo de Catálogos permite gestionar las 16 tablas de catálogos del sistema (RAMA, ESTADO_EXPEDIENTE, TIPO_AUDIENCIA, etc.) y la tabla JUZGADO con sus FKs. El `CatalogoService.cs` ya implementa el CRUD genérico pero llama a 5 SPs que no existen en la BD.

**Estado actual:**
- ✅ `CatalogosController.cs` — 10 endpoints
- ✅ `CatalogoService.cs` — 10 métodos
- ✅ `CatalogoDtos.cs` — DTOs completos
- ❌ `SP_Catalogo_ObtenerPorID` — No existe
- ❌ `SP_Juzgado_Buscar` — No existe
- ❌ `SP_Juzgado_Insertar` — No existe
- ❌ `SP_Juzgado_Actualizar` — No existe
- ❌ `SP_Juzgado_ObtenerPorID` — No existe
- ✅ Frontend `MantenimientoPage` — Completo
- ✅ Frontend `MantenimientoDetallePage` — Completo
- ✅ Frontend `MantenimientoItemModal` — Completo

---

## 2. Procedimientos Almacenados

### 2.1 SP_Catalogo_ObtenerPorID

**Llamado por:** `CatalogoService.cs:205`

```sql
CREATE OR ALTER PROCEDURE SP_Catalogo_ObtenerPorID
    @Tabla NVARCHAR(50),
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Tabla NOT IN (
            'RAMA','ESTADO_EXPEDIENTE','TIPO_AUDIENCIA','ESTADO_AUDIENCIA',
            'RESULTADO_AUDIENCIA','TIPO_TRAMITE','ESTADO_TRAMITE',
            'TIPO_DILIGENCIA','ESTADO_DILIGENCIA','TIPO_NOTIFICACION_OJ',
            'ESTADO_NOTIFICACION_OJ','TIPO_PROCESO','ETIQUETA_NOTA',
            'ESTADO_EVENTO','TIPO_JUZGADO','ROL_PROCESAL'
        )
        BEGIN
            RAISERROR('Tabla no permitida.', 16, 1);
            RETURN;
        END

        DECLARE @sql NVARCHAR(MAX) = N'
            SELECT ID, Nombre, Valor, Descripcion, Color, Orden, Activo, FechaCreacion
            FROM ' + QUOTENAME(@Tabla) + '
            WHERE ID = @ID';

        EXEC sp_executesql @sql, N'@ID INT', @ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.2 SP_Juzgado_Buscar

**Llamado por:** `CatalogoService.cs:222, 268`

```sql
CREATE OR ALTER PROCEDURE SP_Juzgado_Buscar
    @Nombre NVARCHAR(200) = NULL,
    @TipoJuzgado_ID INT = NULL,
    @Municipio_ID INT = NULL,
    @Activo BIT = 1,
    @Pagina INT = 1,
    @TamanoPagina INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            J.ID, J.Nombre, J.Direccion, J.Telefono, J.Email,
            J.Tipo_Juzgado_ID, TJ.Nombre AS TipoJuzgado,
            J.Municipio_ID, M.Nombre AS Municipio,
            D.Nombre AS Departamento,
            J.Activo, J.FechaCreacion
        FROM JUZGADO J
        INNER JOIN TIPO_JUZGADO TJ ON J.Tipo_Juzgado_ID = TJ.ID
        LEFT JOIN MUNICIPIO M ON J.Municipio_ID = M.ID
        LEFT JOIN DEPARTAMENTO D ON M.Departamento_ID = D.ID
        WHERE (@Nombre IS NULL OR J.Nombre LIKE '%' + @Nombre + '%')
          AND (@TipoJuzgado_ID IS NULL OR J.Tipo_Juzgado_ID = @TipoJuzgado_ID)
          AND (@Municipio_ID IS NULL OR J.Municipio_ID = @Municipio_ID)
          AND J.Activo = @Activo
        ORDER BY J.Nombre
        OFFSET (@Pagina - 1) * @TamanoPagina ROWS
        FETCH NEXT @TamanoPagina ROWS ONLY;

        SELECT COUNT(1) AS Total
        FROM JUZGADO J
        WHERE (@Nombre IS NULL OR J.Nombre LIKE '%' + @Nombre + '%')
          AND (@TipoJuzgado_ID IS NULL OR J.Tipo_Juzgado_ID = @TipoJuzgado_ID)
          AND (@Municipio_ID IS NULL OR J.Municipio_ID = @Municipio_ID)
          AND J.Activo = @Activo;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.3 SP_Juzgado_Insertar

**Llamado por:** `CatalogoService.cs:241`

```sql
CREATE OR ALTER PROCEDURE SP_Juzgado_Insertar
    @Nombre NVARCHAR(200),
    @Direccion NVARCHAR(500) = NULL,
    @Telefono NVARCHAR(30) = NULL,
    @Email NVARCHAR(200) = NULL,
    @Tipo_Juzgado_ID INT,
    @Municipio_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM JUZGADO WHERE Nombre = @Nombre AND Activo = 1)
        BEGIN
            RAISERROR('Ya existe un juzgado con ese nombre.', 16, 1);
            RETURN;
        END

        INSERT INTO JUZGADO (Nombre, Direccion, Telefono, Email, Tipo_Juzgado_ID, Municipio_ID, Activo, FechaCreacion)
        VALUES (@Nombre, @Direccion, @Telefono, @Email, @Tipo_Juzgado_ID, @Municipio_ID, 1, GETDATE());

        SELECT SCOPE_IDENTITY() AS ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.4 SP_Juzgado_Actualizar

**Llamado por:** `CatalogoService.cs:285`

```sql
CREATE OR ALTER PROCEDURE SP_Juzgado_Actualizar
    @ID INT,
    @Nombre NVARCHAR(200),
    @Direccion NVARCHAR(500) = NULL,
    @Telefono NVARCHAR(30) = NULL,
    @Email NVARCHAR(200) = NULL,
    @Tipo_Juzgado_ID INT,
    @Municipio_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM JUZGADO WHERE ID = @ID)
        BEGIN
            RAISERROR('Juzgado no encontrado.', 16, 1);
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM JUZGADO WHERE Nombre = @Nombre AND ID != @ID AND Activo = 1)
        BEGIN
            RAISERROR('Ya existe otro juzgado con ese nombre.', 16, 1);
            RETURN;
        END

        UPDATE JUZGADO
        SET Nombre = @Nombre,
            Direccion = @Direccion,
            Telefono = @Telefono,
            Email = @Email,
            Tipo_Juzgado_ID = @Tipo_Juzgado_ID,
            Municipio_ID = @Municipio_ID
        WHERE ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### 2.5 SP_Juzgado_ObtenerPorID

**Llamado por:** `CatalogoService.cs:340`

```sql
CREATE OR ALTER PROCEDURE SP_Juzgado_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            J.ID, J.Nombre, J.Direccion, J.Telefono, J.Email,
            J.Tipo_Juzgado_ID, TJ.Nombre AS TipoJuzgado,
            J.Municipio_ID, M.Nombre AS Municipio,
            D.Nombre AS Departamento,
            J.Activo, J.FechaCreacion
        FROM JUZGADO J
        INNER JOIN TIPO_JUZGADO TJ ON J.Tipo_Juzgado_ID = TJ.ID
        LEFT JOIN MUNICIPIO M ON J.Municipio_ID = M.ID
        LEFT JOIN DEPARTAMENTO D ON M.Departamento_ID = D.ID
        WHERE J.ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

---

## 3. Backend

**No hay cambios en el backend** — el controller, service y DTOs ya están implementados y apuntan a estos SPs.

| Archivo | Estado |
|---------|--------|
| `Controllers/CatalogosController.cs` | ✅ Existente (10 endpoints) |
| `Services/CatalogoService.cs` | ✅ Existente (10 métodos) |
| `Dtos/Catalogos/CatalogoDtos.cs` | ✅ Existente |

---

## 4. Pruebas de Endpoints

```http
### Obtener catálogo por ID
GET http://localhost:5181/api/catalogos/RAMA/1
Authorization: Bearer <token>

### Buscar juzgados
GET http://localhost:5181/api/catalogos/juzgados?Pagina=1&TamanoPagina=5
Authorization: Bearer <token>

### Crear juzgado
POST http://localhost:5181/api/catalogos/juzgados
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Juzgado de Prueba E2E",
  "tipoJuzgadoId": 1,
  "municipioId": 1,
  "direccion": "Dirección de prueba"
}

### Actualizar juzgado
PUT http://localhost:5181/api/catalogos/juzgados/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Juzgado Actualizado",
  "tipoJuzgadoId": 1,
  "municipioId": 1
}

### Cambiar estado juzgado
PUT http://localhost:5181/api/catalogos/juzgados/1/estado
Authorization: Bearer <token>
Content-Type: application/json

{
  "activo": false
}
```

---

## 5. Frontend

**No hay cambios en el frontend** — las páginas de Mantenimiento ya están implementadas.

| Archivo | Estado |
|---------|--------|
| `features/mantenimiento/mantenimiento-page.ts` | ✅ |
| `features/mantenimiento/mantenimiento-detalle-page.ts` | ✅ |
| `features/mantenimiento/mantenimiento-item-modal.ts` | ✅ |
| `features/mantenimiento/catalogos-metadata.ts` | ✅ |
| `core/services/catalogos-service.ts` | ✅ |
| `styles/modules/mantenimiento.css` | ✅ |

---

## 6. Tests Playwright

### 6.1 Page Object: `mantenimiento.ts`

```typescript
// e2e/pages/mantenimiento.ts
import { Page, Locator } from '@playwright/test';

export class MantenimientoPage {
  readonly page: Page;
  readonly grid: Locator;
  readonly cards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.grid = page.locator('[data-testid="catalogos-grid"]');
    this.cards = page.locator('[data-testid="catalogo-card"]');
  }

  async goto() {
    await this.page.goto('/mantenimiento');
  }

  async clickCatalogo(nombre: string) {
    await this.page.locator(`[data-testid="catalogo-card-${nombre}"]`).click();
  }
}
```

### 6.2 Page Object: `mantenimiento-detalle.ts`

```typescript
// e2e/pages/mantenimiento-detalle.ts
import { Page, Locator } from '@playwright/test';

export class MantenimientoDetallePage {
  readonly page: Page;
  readonly tabla: Locator;
  readonly btnNuevo: Locator;
  readonly busqueda: Locator;
  readonly paginacion: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabla = page.locator('[data-testid="items-tabla"]');
    this.btnNuevo = page.locator('[data-testid="btn-nuevo-item"]');
    this.busqueda = page.locator('[data-testid="busqueda"]');
    this.paginacion = page.locator('[data-testid="paginacion"]');
  }

  async goto(catalogo: string) {
    await this.page.goto(`/mantenimiento/${catalogo}`);
  }

  async crearItem(nombre: string) {
    await this.btnNuevo.click();
    await this.page.fill('[data-testid="input-nombre"]', nombre);
    await this.page.click('[data-testid="btn-guardar-item"]');
  }

  async editarItem(nombre: string) {
    await this.page.locator('[data-testid="btn-editar-item"]').first().click();
    await this.page.fill('[data-testid="input-nombre"]', nombre);
    await this.page.click('[data-testid="btn-guardar-item"]');
  }

  async toggleActivo(index: number = 0) {
    await this.page.locator('[data-testid="toggle-activo"]').nth(index).click();
  }
}
```

### 6.3 Test: `18-mantenimiento.spec.ts`

```typescript
// e2e/tests/18-mantenimiento.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth.fixture';
import { MantenimientoPage } from '../pages/mantenimiento';
import { MantenimientoDetallePage } from '../pages/mantenimiento-detalle';

test.describe('Mantenimiento de Catálogos', () => {
  let mantPage: MantenimientoPage;
  let detPage: MantenimientoDetallePage;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    mantPage = new MantenimientoPage(page);
    detPage = new MantenimientoDetallePage(page);
  });

  test('muestra grid de catálogos', async () => {
    await mantPage.goto();
    await expect(mantPage.grid).toBeVisible();
    await expect(mantPage.cards).toHaveCount({ minimum: 8 });
  });

  test('navega al detalle de RAMA', async ({ page }) => {
    await mantPage.goto();
    await mantPage.clickCatalogo('RAMA');
    await expect(page).toHaveURL(/\/mantenimiento\/RAMA/);
  });

  test('muestra tabla de ítems', async () => {
    await detPage.goto('RAMA');
    await expect(detPage.tabla).toBeVisible();
  });

  test('crea un nuevo ítem', async () => {
    await detPage.goto('RAMA');
    await detPage.crearItem('Rama Prueba E2E');
    await expect(detPage.tabla).toContainText('Rama Prueba E2E');
  });

  test('edita un ítem existente', async () => {
    await detPage.goto('RAMA');
    await detPage.editarItem('Rama Editada E2E');
    await expect(detPage.tabla).toContainText('Rama Editada E2E');
  });

  test('activa/desactiva un ítem', async () => {
    await detPage.goto('RAMA');
    await detPage.toggleActivo(0);
    // Verificar que el estado cambió
  });

  test('búsqueda filtra resultados', async () => {
    await detPage.goto('RAMA');
    await detPage.busqueda.fill('Civil');
    await expect(detPage.tabla.locator('tr')).toHaveCount({ minimum: 1 });
  });

  test('paginación funciona', async () => {
    await detPage.goto('RAMA');
    if (await detPage.paginacion.isVisible()) {
      await detPage.page.click('[data-testid="pagina-siguiente"]');
    }
  });
});
```

---

## 7. Criterios de Aceptación

- [ ] Los 5 SPs ejecutan sin errores en SSMS
- [ ] `SP_Catalogo_ObtenerPorID` retorna datos para cada tabla del whitelist
- [ ] SPs de Juzgado validan nombre único
- [ ] El endpoint `GET /api/catalogos/RAMA/1` retorna 200
- [ ] El endpoint `POST /api/catalogos/juzgados` crea juzgado correctamente
- [ ] `dotnet build` exitoso (0 errores)
- [ ] Tests Playwright de mantenimiento pasan
