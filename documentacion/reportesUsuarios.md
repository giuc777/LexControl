# Reportes de Usuarios — Documentación Técnica

> Documentación del módulo **Reportes de Usuarios** de **LexControl**, el sistema de gestión de expedientes para un bufete jurídico guatemalteco.
>
> **Criterio**: Incluye (1) funcionalidad de la aplicación, (2) verificación en la base de datos, y (3) explicación técnica de modelos, rutas y componentes.

---

## 1. Estructura de carpetas del proyecto

```
LexControl/
├── Base_Datos.sql                  — Creación de BD DBLexControl (esquema principal)
├── Proceso_almacenados.sql         — 38 procedimientos SP_* de CRUD (Windows-1252)
├── Reportes_almacenados.sql        — 9 procedimientos SP_Reporte_* (UTF-8 BOM)
├── link-figma.txt                  — Enlace de diseño + token API Figma (no versionar)
├── AGENTS.md                       — Instrucciones para agentes IA
├── Incremento1.txt                 — Requerimientos de documentación (este archivo)
├── ModuloUsuarios.md               — Documentación del módulo de Usuarios
├── reportesUsuarios.md             — ← Este documento
│
├── Desarrollo/
│   ├── LexControlDB.sql            — Script único (esquema + SPs + seeds) de referencia
│   ├── Usuarios_SP.sql             — SPs extra para Login + Gestión de Usuarios
│   ├── Back-end/
│   │   └── LexControlApi/          — API REST en .NET 10 (Dapper + JWT)
│   │       ├── Controllers/        — EndPoints RESTful (Auth, Perfil, Usuarios, Permisos)
│   │       ├── Services/           — Lógica de negocio (AuthService, UsuarioService, etc.)
│   │       ├── Data/               — Capa de datos (IRepositorio, ConnectionFactory)
│   │       ├── Dtos/               — DTOs de entrada/salida por controlador
│   │       ├── Models/             — Modelos de dominio (futuro)
│   │       ├── Helpers/            — ApiResponse, HashHelper, ClaimsExtension
│   │       ├── Middleware/         — ManejadorExcepciones (captura global de errores)
│   │       ├── Excepciones/        — ExcepcionNegocio
│   │       ├── appsettings.json    — Configuración (conexiones, JWT)
│   │       ├── Program.cs          — Bootstrap de la aplicación
│   │       └── LexControlApi.csproj
│   │
│   └── Front-end/
│       ├── LexControlFornt/        — SPA Angular 20 (standalone components)
│       │   ├── src/app/
│       │   │   ├── core/           — Servicios, guards, interceptores, modelos
│       │   │   ├── layout/         — Shell, sidebar, topbar, toast
│       │   │   ├── shared/         — Componentes reutilizables (modal, íconos)
│       │   │   ├── features/       — Módulos por pantalla (login, ajustes, reportes, etc.)
│       │   │   ├── app.routes.ts   — Rutas (login público; resto bajo shell + guards)
│       │   │   └── app.config.ts   — Providers globales
│       │   └── src/environments/
│       │       ├── environment.ts  — Producción
│       │       └── environment.development.ts — Dev (apiBaseUrl: localhost:5181)
│       └── LexControlFornt/package.json
│
├── despliegue/LexControlDemo/      — Frontend estático mock (HTML/CSS/JS + datos mock)
└── Pototipo/                        — Copia del demo (validación visual con cliente)
```

### Convenciones del repositorio

| Aspecto | Regla |
|---|---|
| Nombres de tablas | UPPERCASE |
| Nombres de columnas | CamelCase |
| Nombres de SP | `SP_Entidad_Accion` (ej. `SP_Usuario_Listar`) |
| Codificación `Proceso_almacenados.sql` | Windows-1252 (ANSI), sin BOM — **conservar al editar** |
| Codificación `Reportes_almacenados.sql` | UTF-8 con BOM |
| Codificación `Base_Datos.sql` | UTF-8 con BOM |
| Borrado | Nunca `DELETE`; siempre `Activo = 0` (borrado lógico) |
| Comentarios | En español |

---

## 2. Instrucciones de inicio

### 2.1 Requisitos previos

| Herramienta | Versión |
|---|---|
| SQL Server (SSMS o `sqlcmd`) | SQL Server 2019+ |
| .NET SDK | 10.0 |
| Node.js + npm | 20+ |
| Angular CLI | 20.1+ (`npm i -g @angular/cli`) |

### 2.2 Crear la base de datos

Ejecutar en orden sobre una instancia SQL Server local (ej. `.\SQLEXPRESS`):

```sql
-- 1) Esquema + seeds + usuario admin
Base_Datos.sql

-- 2) Procedimientos almacenados de CRUD (codificación Windows-1252)
Proceso_almacenados.sql

-- 3) Procedimientos de reportes (UTF-8 con BOM)
Reportes_almacenados.sql

-- 4) SPs de usuarios/permisos (submódulo de Ajustes)
Desarrollo\Usuarios_SP.sql
```

> **Usuario admin por defecto**: `admin` / `admin123`

### 2.3 Iniciar el backend (API REST)

```bash
cd Desarrollo/Back-end/LexControlApi
dotnet run
```

- La API arranca en `http://localhost:5181` (o `https://localhost:7186`).
- Swagger UI disponible en `https://localhost:7186/swagger` con botón "Authorize" (Bearer JWT).
- Credenciales admin: `admin` / `admin123`.

### 2.4 Iniciar el frontend (SPA Angular)

```bash
cd Desarrollo/Front-end/LexControlFornt
npm install        # primera vez
npm start
```

- El SPA arranca en `http://localhost:4200`.
- El `proxy.conf.json` redirige `/api/*` al backend (`http://localhost:5181`), evitando CORS en desarrollo.

### 2.5 Secuencia de prueba del módulo

1. Navegar a `http://localhost:4200/login`.
2. Ingresar `admin` / `admin123`.
3. El dashboard carga con datos reales del API.
4. Click en **Reportes** en el sidebar.
5. Se muestra el grid de categorías de reporte.
6. Click en **Reporte de Usuarios** para ver el reporte completo.
7. Click en **Exportar PDF** para generar el documento.
8. Click en **Volver a Reportes** para regresar al grid.

---

## 3. Funcionalidad de la aplicación

### 3.1 Navegación de reportes

El módulo de Reportes utiliza un patrón de navegación por categorías inspirado en el módulo de Mantenimiento:

| Pantalla | Descripción |
|---|---|
| Grid de categorías | Muestra 6 tarjetas clickeables, cada una representando un tipo de reporte |
| Reporte de Usuarios | Se muestra al seleccionar la categoría "Usuarios" |
| Botón "Volver" | Regresa al grid de categorías |

**Categorías de reporte disponibles**:

| Categoría | Estado | Descripción |
|---|---|---|
| Reporte de Usuarios | ✅ Disponible | Resumen de actividad, roles y estado de todos los usuarios del sistema |
| Expedientes por Rama | 🔒 Próximamente | Distribución de expedientes por rama de derecho y estado actual |
| Agenda y Audiencias | 🔒 Próximamente | Calendario de audiencias programadas, realizadas y pendientes |
| Trámites en Curso | 🔒 Próximamente | Estado de trámites activos, tiempos de respuesta y resolución |
| Notificaciones OJ | 🔒 Próximamente | Resumen de notificaciones Oficina Judicial: pendientes, atendidas y duplicadas |
| Rendimiento del Bufete | 🔒 Próximamente | Métricas de productividad: casos resueltos, tiempos promedio y carga de trabajo |

**[Añadir captura: Grid de categorías de reporte estilo Mantenimiento]**

### 3.2 Reporte de Usuarios

El reporte de usuarios muestra un resumen completo del estado de los usuarios en el sistema. Conectado al endpoint `GET /api/usuarios`.

#### Secciones del reporte

##### Stat Cards (resumen rápido)

| Tarjeta | Valor | Descripción |
|---|---|---|
| Total Usuarios | `total()` | Cantidad total de usuarios registrados |
| Activos | `activos()` | Usuarios con `Activo = true` |
| Inactivos | `inactivos()` | Usuarios con `Activo = false` |
| Bloqueados | `bloqueados()` | Usuarios con `Bloqueado = true` (requiere atención) |

Cada tarjeta muestra un badge de estado:
- **Sistema completo** (info) — para Total
- **En uso** (ok) — para Activos
- **Desactivados** (warn) — si hay inactivos
- **Ninguno** (ok) — si no hay inactivos
- **Requiere atención** (danger) — si hay bloqueados

**[Añadir captura: Stat cards del reporte de usuarios]**

##### Usuarios por Rol

Barras horizontales de progreso que muestran la distribución de usuarios por rol:

| Rol | Color | Descripción |
|---|---|---|
| Administrador | `#358292` (brand) | Acceso total al sistema |
| Secretaria | `#8e44ad` (púrpura) | Acceso a gestión de agenda y documentos |
| Abogado | `#b2845a` (dorado) | Acceso a gestión de casos y audiencias |

Cada barra muestra:
- Nombre del rol con punto de color
- Cantidad de usuarios y porcentaje
- Barra de progreso con ancho proporcional

**[Añadir captura: Barras de distribución por rol]**

##### Últimos Accesos

Tabla con los 10 usuarios más recientes que han iniciado sesión:

| Columna | Descripción |
|---|---|
| Usuario | Avatar con iniciales + nombre completo + cuenta |
| Rol | Badge con color del rol |
| Último Acceso | Fecha y hora del último acceso (formato: `dd Mmm yyyy HH:mm`) |
| Estado | Badge "Activo" o "Inactivo" |

Los datos se obtienen del campo `U.UltimoAcceso` de la tabla `USUARIO`, que se actualiza en cada login exitoso mediante `SP_Usuario_ActualizarAcceso`.

> **Nota**: Si `UltimoAcceso` es NULL (nunca ha iniciado sesión), se muestra "Sin registro".

**[Añadir captura: Tabla de últimos accesos con top 10]**

##### Todos los Usuarios

Tabla completa con todos los usuarios del sistema:

| Columna | Descripción |
|---|---|
| Usuario | Avatar con iniciales + nombre completo + cuenta |
| Rol | Badge con color del rol |
| Correo | Email principal |
| Estado | Badge "Activo" o "Inactivo" |
| Bloqueado | Badge "Bloqueado" (rojo) o "No" (verde) |
| Creado | Fecha de creación (formato: `dd/mm/yyyy`) |
| Último Acceso | Fecha y hora del último acceso (formato: `dd Mmm yyyy HH:mm`) |

**[Añadir captura: Tabla completa de usuarios]**

### 3.3 Exportación a PDF

El botón **Exportar PDF** genera un documento PDF con los datos del reporte:

| Aspecto | Detalle |
|---|---|
| Orientación | Landscape (apaisado) |
| Tamaño de papel | A4 |
| Librería | jsPDF + jspdf-autotable |
| Nombre del archivo | `reporte-usuarios-lexcontrol.pdf` |

#### Contenido del PDF

1. **Encabezado**: Título "Reporte de Usuarios — LexControl" + fecha/hora de generación
2. **Resumen**: Total, Activos, Inactivos, Bloqueados
3. **Tabla completa**: Todos los usuarios con sus datos

**Estilo del PDF**:
- Encabezados de tabla con fondo `#358292` (brand) y texto blanco
- Filas alternas con fondo gris claro
- Fuente Helvetica (built-in de jsPDF)

**[Añadir captura: PDF generado con el reporte de usuarios]**

---

## 4. Verificación en la base de datos

### 4.1 Tablas involucradas

#### `USUARIO` (tabla principal)

```sql
CREATE TABLE USUARIO (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Persona_ID INT NOT NULL UNIQUE,     -- herencia: 1:1 con PERSONA
    Rol_ID INT NOT NULL,
    Usuario NVARCHAR(50) NOT NULL UNIQUE,
    ContraseñaHash NVARCHAR(255) NOT NULL,
    UltimoAcceso DATETIME NULL,          -- ← Campo utilizado en el reporte
    IntentosFallidos INT NOT NULL DEFAULT 0,
    Bloqueado BIT NOT NULL DEFAULT 0,
    FechaBloqueo DATETIME NULL,
    CONSTRAINT FK_USUARIO_PERSONA FOREIGN KEY (Persona_ID) REFERENCES PERSONA(ID) ON DELETE CASCADE,
    CONSTRAINT FK_USUARIO_ROL FOREIGN KEY (Rol_ID) REFERENCES ROL(ID)
);
```

#### `PERSONA` (datos personales)

```sql
CREATE TABLE PERSONA (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    NombreCompleto NVARCHAR(100) NOT NULL,
    DPI NVARCHAR(20) NULL,
    TelefonoPrincipal NVARCHAR(20) NULL,
    EmailPrincipal NVARCHAR(100) NULL,
    Direccion NVARCHAR(200) NULL,
    FechaNacimiento DATE NULL,
    Genero CHAR(1) NULL,               -- CHECK: 'M'|'F'|'O'
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NULL,
    UsuarioCreacion_ID INT NULL,
    UsuarioModificacion_ID INT NULL,
    CONSTRAINT CHK_PERSONA_Genero CHECK (Genero IN ('M', 'F', 'O'))
);
```

#### `ROL` (catálogo de roles)

```sql
CREATE TABLE ROL (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(30) NOT NULL UNIQUE,
    Descripcion NVARCHAR(200) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
);
-- Seeds: Administrador (ID 1), Secretaria (ID 2), Abogado (ID 3)
```

### 4.2 Procedimientos almacenados utilizados

#### Listado de usuarios (para el reporte)

| SP | Parámetros | Return / SELECT | Uso |
|---|---|---|---|
| `SP_Usuario_Listar` | `@FiltroNombre`, `@Rol_ID`, `@Activo` (todos NULL/default) | RETURN 0 + SELECT lista | `GET /api/usuarios` — alimenta todo el reporte |

**Campos retornados por el SP** (relevantes para el reporte):

| Campo | Tipo | Descripción |
|---|---|---|
| `U.ID` | INT | ID del usuario |
| `P.NombreCompleto` | NVARCHAR(100) | Nombre completo |
| `U.Usuario` | NVARCHAR(50) | Nombre de cuenta |
| `P.EmailPrincipal` | NVARCHAR(100) | Correo electrónico |
| `P.TelefonoPrincipal` | NVARCHAR(20) | Teléfono |
| `U.Rol_ID` | INT | ID del rol |
| `R.Nombre` | NVARCHAR(30) | Nombre del rol |
| `P.Activo` | BIT | Estado activo/inactivo |
| `U.Bloqueado` | BIT | Estado de bloqueo |
| `P.FechaCreacion` | DATETIME | Fecha de creación |
| `U.UltimoAcceso` | DATETIME | Fecha y hora del último acceso |

> **Importante**: El campo `U.UltimoAcceso` debe estar en el SELECT del SP para que el reporte muestre datos reales. Si no está presente, la columna mostrará "Sin registro".

#### Actualización de último acceso

| SP | Parámetros | Descripción |
|---|---|---|
| `SP_Usuario_ActualizarAcceso` | `@Usuario` | Actualiza `UltimoAcceso = GETDATE()` en login exitoso |

### 4.3 Verificación de datos

```sql
-- Ver todos los usuarios con su último acceso
SELECT
    U.ID,
    P.NombreCompleto,
    U.Usuario,
    R.Nombre AS Rol,
    P.Activo,
    U.Bloqueado,
    U.UltimoAcceso
FROM USUARIO U
INNER JOIN PERSONA P ON U.Persona_ID = P.ID
INNER JOIN ROL R ON U.Rol_ID = R.ID
ORDER BY U.UltimoAcceso DESC;

-- Verificar que UltimoAcceso se actualiza al hacer login
-- (ejecutar después de iniciar sesión con un usuario)
SELECT Usuario, UltimoAcceso
FROM USUARIO
WHERE Usuario = 'admin';

-- Contar usuarios por rol
SELECT R.Nombre AS Rol, COUNT(*) AS Cantidad
FROM USUARIO U
INNER JOIN ROL R ON U.Rol_ID = R.ID
WHERE U.Bloqueado = 0
GROUP BY R.Nombre
ORDER BY Cantidad DESC;
```

---

## 5. Explicación técnica

### 5.1 Arquitectura general

```
    ┌─────────────────────────────────────────────┐
    │              Frontend SPA (Angular 20)       │
    │  src/app/  (standalone components, signals)  │
    └──────────────┬──────────────────────────────┘
                   │  HTTPS + Bearer JWT (sessionStorage)
    ┌──────────────▼──────────────────────────────┐
    │  Backend API (.NET 10 / ASP.NET Core)       │
    │  ┌──────────────┐  ┌──────────┐  ┌───────┐   │
    │  │ Controllers  │──│ Services │──│ Repo  │   │
    │  │  REST/JSON   │  │  Business│  │ Dapper│   │
    │  └──────────────┘  └──────────┘  └───┬───┘   │
    └───────────────────────────────────────┼───────┘
                                           │ Stored Procedures (SQL Server)
    ┌───────────────────────────────────────▼───────┐
    │              Base de datos DBLexControl       │
    │  Base_Datos.sql + Proceso_almacenados.sql     │
    │  + Usuarios_SP.sql (módulo usuarios/permisos)  │
    │  + Reportes_almacenados.sql                   │
    └───────────────────────────────────────────────┘
```

**Principios de diseño**:
- **Data access vía Stored Procedures exclusivamente** — el backend nunca envía SQL dinámico; los SPs son el "muro contra inyección SQL" (convención del repositorio `AGENTS.md`).
- **Dapper como micro-ORM** — mapea resultados de SP a DTOs sin `DbContext` ni Entity Framework.
- **Borrado lógico** — nunca `DELETE`; se usa `Activo = 0`.
- **Respuesta estándar** — todos los endpoints devuelven `{ success: bool, data: T, error: string|null }`.
- **Errores centralizados** — `ManejadorExcepciones` catcha `ExcepcionNegocio`, `SqlException` y `Exception` general, devolviendo JSON consistente.

### 5.2 Backend — Modelos, rutas y componentes

#### Dependency Injection (`Program.cs`)

```
IConnectionFactory  → SqlConnectionFactory (singleton)
IRepositorio       → RepositorioSql (scoped)
IAuthService       → AuthService (scoped)
IUsuarioService    → UsuarioService (scoped)
IPerfilService     → PerfilService (scoped)
IPermisoService    → PermisoService (scoped)
```

#### Controladores y rutas

##### `UsuariosController` — `api/usuarios`

| Método | Endpoint | Body | Descripción |
|---|---|---|---|
| GET | `/` (filtros query) | — | Listado de usuarios (alimenta el reporte) |
| GET | `/roles` | — | Catálogo de roles |
| GET | `/{id}` | — | Detalle de usuario |
| POST | `/` | `UsuarioCrearDto` | Crear usuario |
| PUT | `/{id}` | `UsuarioActualizarDto` | Editar usuario |
| PUT | `/{id}/estado` | `UsuarioEstadoDto` | Cambiar estado (activo/inactivo) |
| POST | `/{id}/desbloquear` | — | Desbloquear cuenta |

**El reporte utiliza únicamente `GET /api/usuarios`** — no requiere endpoints adicionales.

#### Data layer (`IRepositorio` / `RepositorioSql`)

| Método | Uso |
|---|---|
| `ConsultarListaAsync<T>(sp, params)` | SPs que devuelven listas (ej. `SP_Usuario_Listar`) |
| `ConsultarPrimeroAsync<T>(sp, params)` | SPs que devuelven un fila (ej. `SP_Usuario_ObtenerPorID`) |
| `EjecutarRetornoAsync(sp, params)` | SPs de acción que devuelven código (RETURN 0/-1/-2) |
| `InsertarAsync(sp, params, outputParam)` | SPs con parámetro OUTPUT (ej. `SP_Usuario_CrearCompleto`) |

`DynamicParameters` captura `@RETURN_VALUE` automáticamente para validar el retorno del SP.

### 5.3 Frontend — Modelos, rutas y componentes

#### Router (`app.routes.ts`)

| Ruta | Componente | Guard | Auth |
|---|---|---|---|
| `/login` | `LoginPage` | `loginGuard` (redirige si ya logueado) | Pública |
| `''` → `/dashboard` | `DashboardPage` | `authGuard` + `moduloGuard('dashboard')` | Shell |
| `/reportes` | `ReportesPage` | `authGuard` + `moduloGuard('reportes')` | Shell |
| `/ajustes` | `AjustesPage` | `authGuard` + `moduloGuard('ajustes')` | Shell |
| `**` | redirect `/dashboard` | — | — |

#### Shell y layout (`src/app/layout/`)

- **`shell.ts`**: contenedor con `<router-outlet>`, incluye `Sidebar` y `Topbar`.
- **`sidebar.ts`**: navegación filtrada por permisos del rol. Usa `PermisosService.menu` (signal computada). Íconos SVG inline (paths de `MODULOS` en `permisos.ts`).
- **`topbar.ts`**: búsqueda global, campana de notificaciones, avatar con nombre + rol.

#### Guards (`src/app/core/auth/`)

| Guard | Lógica |
|---|---|
| `authGuard` | Si no hay sesión válida → redirect `/login` |
| `loginGuard` | Si ya hay sesión → redirect `/dashboard` |
| `moduloGuard(key)` | Carga menú del rol (`GET /api/permisos/{rolId}`); si el módulo no está activo → redirect `/dashboard` |

#### Interceptor (`auth-interceptor.ts`)

- Agrega `Authorization: Bearer <token>` a toda petición hacia `environment.apiBaseUrl`.
- Ante `401` en endpoints protegidos (no `/login`): cierra sesión y redirige a `/login`.

#### Modelos TypeScript (`src/app/core/models/`)

**`usuario.model.ts`**:
```typescript
interface UsuarioLista {
    id: number;
    nombreCompleto: string;
    usuario: string;
    email: string;
    telefono: string;
    rol: string;
    rolId: number;
    activo: boolean;
    bloqueado: boolean;
    ultimoAcceso: string | null;    // ← Utilizado en el reporte
    fechaCreacion: string;
}
```

#### Componentes del módulo de Reportes

##### `ReportesPage` (`src/app/features/reportes/reportes-page.ts`)

Componente contenedor que muestra el grid de categorías de reporte.

```typescript
@Component({
    selector: 'app-reportes-page',
    imports: [ReportesUsuariosPage],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-page.html'
})
export class ReportesPage {
    readonly reporteActivo = signal<string | null>(null);

    readonly reportes: ReporteItem[] = [
        { key: 'usuarios', titulo: 'Reporte de Usuarios', ... },
        { key: 'expedientes', titulo: 'Expedientes por Rama', ... },
        { key: 'agenda', titulo: 'Agenda y Audiencias', ... },
        { key: 'tramites', titulo: 'Trámites en Curso', ... },
        { key: 'notificaciones', titulo: 'Notificaciones OJ', ... },
        { key: 'rendimiento', titulo: 'Rendimiento del Bufete', ... }
    ];

    seleccionarReporte(key: string): void { ... }
    volver(): void { this.reporteActivo.set(null); }
}
```

**Flujo**:
1. `reporteActivo` es `null` → muestra el grid de categorías
2. Usuario hace clic en una categoría → `reporteActivo` se establece con la `key`
3. Se muestra el componente del reporte seleccionado (ej. `<app-reportes-usuarios-page />`)
4. Botón "Volver" → `reporteActivo.set(null)` → regresa al grid

##### `ReportesUsuariosPage` (`src/app/features/reportes/reportes-usuarios-page.ts`)

Componente que muestra el reporte completo de usuarios.

```typescript
@Component({
    selector: 'app-reportes-usuarios-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-usuarios-page.html'
})
export class ReportesUsuariosPage {
    private readonly usuariosService = inject(UsuariosService);

    readonly cargando = signal(true);

    private readonly usuarios = toSignal(
        this.usuariosService.listar().pipe(
            map(lista => lista),
            catchError(() => of([] as UsuarioLista[]))
        ),
        { initialValue: [] as UsuarioLista[] }
    );

    readonly total = computed(() => this.usuarios().length);
    readonly activos = computed(() => this.usuarios().filter(u => u.activo).length);
    readonly inactivos = computed(() => this.usuarios().filter(u => !u.activo).length);
    readonly bloqueados = computed(() => this.usuarios().filter(u => u.bloqueado).length);

    readonly porRol = computed<RolConteo[]>(() => { ... });
    readonly ultimosAccesos = computed<UsuarioAcceso[]>(() => { ... });
    readonly usuariosTabla = computed(() => { ... });

    exportarPDF(): void { ... }
}
```

**Señales computadas**:
- `total`, `activos`, `inactivos`, `bloqueados` — contadores para las stat cards
- `porRol` — agrupa usuarios por rol con conteo y porcentaje
- `ultimosAccesos` — top 10 usuarios activos ordenados por `ultimoAcceso` descendente
- `usuariosTabla` — todos los usuarios con campos formateados

**Exportación PDF**:
- Utiliza `jsPDF` para crear el documento
- Utiliza `jspdf-autotable` para generar la tabla de usuarios
- Orientación landscape, tamaño A4
- Estilo: encabezados con fondo brand (#358292), filas alternas gris claro

#### Servicios (`src/app/core/services/`)

**`usuarios-service.ts`**:
- `listar(filtros?)`: GET `/api/usuarios` con query params — **alimenta el reporte**
- `roles()`: GET `/api/usuarios/roles`
- `crear(datos)`: POST `/api/usuarios` → 201
- `actualizar(id, datos)`: PUT `/api/usuarios/{id}` → 200
- `cambiarEstado(id, activo)`: PUT `/api/usuarios/{id}/estado` → 204
- `desbloquear(id)`: POST `/api/usuarios/{id}/desbloquear` → 204

### 5.4 Estilos CSS

Los estilos del módulo de Reportes se encuentran en `src/styles/modules/reportes.css` (470 líneas).

#### Estructura del archivo

| Sección | Descripción |
|---|---|
| Grid de categorías | `.rep-cat-panels`, `.rep-cat-panel` — grid responsive de tarjetas |
| Botón volver | `.rep-back-btn` — botón para regresar al grid |
| Botón exportar PDF | `.rep-export-btn` — botón de exportación |
| Stat cards | `.rep-stats`, `.rep-stat` — tarjetas de resumen |
| Chips | `.rep-chip`, `.rep-chip-prox` — badges de estado |
| Barras de progreso | `.rep-progress-list`, `.rep-progress-fill` — distribución por rol |
| Tabla de usuarios | `.rep-usuarios-table`, `.rep-usuario-cell` — tabla con avatares |
| Nota de pie | `.rep-footnote` — información del endpoint |
| Responsive | Media queries para 1060px y 560px |

#### Variables CSS utilizadas

```css
--brand: #358292;        /* Color principal */
--brand-dark: #2a6b77;   /* Color principal hover */
--ink: #1a1c1e;          /* Texto principal */
--muted: #3f484b;        /* Texto secundario */
--subtle: #8b9aa0;       /* Texto terciario */
--panel-line: #e5e8ea;   /* Bordes de paneles */
--radius-card: 10px;     /* Radio de tarjetas */
--font: 'Hanken Grotesk' /* Fuente principal */
```

### 5.5 Seguridad

| Aspecto | Implementación |
|---|---|
| Transport | HTTPS (backend redirige HTTP→HTTPS) |
| Auth | JWT Bearer (120 min de expiración) |
| Token storage | `sessionStorage` (no persiste en refresh) |
| CORS | Orígenes: `localhost:5173`, `localhost:4200`, `localhost:3000`, `localhost:8080` |
| Inyección SQL | Bloqueada por SPs con parámetros nombrados (Dapper) |
| Autorización | `[Authorize]` en endpoints protegidos; `moduloGuard('reportes')` en frontend |
| Errores | `ManejadorExcepciones` oculta detalles en producción |

### 5.6 DTOs resumen (contrato frontend ↔ backend)

#### Listado de usuarios (alimenta el reporte)

```
GET /api/usuarios?filtroNombre=&rolId=&activo=

200 → { success: true, data: [
  {
    id: 1,
    nombreCompleto: "Administrador del Sistema",
    usuario: "admin",
    email: "admin@bufete.com",
    telefono: "5555-1234",
    rol: "Administrador",
    rolId: 1,
    activo: true,
    bloqueado: false,
    ultimoAcceso: "2026-08-31T18:30:00",   // ← Utilizado en el reporte
    fechaCreacion: "2026-01-15T10:00:00"
  },
  ...
]}
```

#### Estructura del PDF generado

```
┌─────────────────────────────────────────────────────────┐
│  Reporte de Usuarios — LexControl                       │
│  Generado: 31/8/2026 18:30                              │
├─────────────────────────────────────────────────────────┤
│  Resumen                                                │
│  Total: 5  |  Activos: 4  |  Inactivos: 1  |  Bloq: 0  │
├─────────────────────────────────────────────────────────┤
│  Nombre          │ Cuenta   │ Rol    │ Email  │ ...     │
│  Admin Sistema   │ admin    │ Admin  │ a@...  │ ...     │
│  Juan Pérez      │ juan     │ Abog.  │ j@...  │ ...     │
│  María López     │ maria    │ Secr.  │ m@...  │ ...     │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Capturas de pantalla

> Reemplace los marcadores de posición a continuación con capturas reales del sistema. Cada captura debe mostrarse al momento de la acción correspondiente.

### 6.1 Grid de categorías de reporte

`[Añadir captura: /reportes — Grid de 6 tarjetas de reporte estilo Mantenimiento, con "Reporte de Usuarios" como la primera opción disponible]`

### 6.2 Reporte de Usuarios — Stat Cards

`[Añadir captura: Stat cards mostrando Total Usuarios, Activos, Inactivos y Bloqueados con sus badges de estado]`

### 6.3 Reporte de Usuarios — Distribución por Rol

`[Añadir captura: Barras horizontales de progreso mostrando la distribución de usuarios por rol (Administrador, Secretaria, Abogado)]`

### 6.4 Reporte de Usuarios — Últimos Accesos

`[Añadir captura: Tabla de los 10 usuarios con último acceso más reciente, mostrando avatar, rol, fecha/hora y estado]`

### 6.5 Reporte de Usuarios — Tabla Completa

`[Añadir captura: Tabla completa de todos los usuarios con todas las columnas (Usuario, Rol, Correo, Estado, Bloqueado, Creado, Último Acceso)]`

### 6.6 Botón Exportar PDF

`[Añadir captura: Botón "Exportar PDF" en el page-header del reporte de usuarios]`

### 6.7 PDF Generado

`[Añadir captura: Documento PDF generado con el reporte de usuarios, mostrando encabezado, resumen y tabla completa]`

### 6.8 Botón Volver

`[Añadir captura: Botón "Volver a Reportes" visible al estar dentro del reporte de usuarios]`

---

## 7. Consideraciones y limitaciones

### 7.1 Gaps conocidos

1. **`U.UltimoAcceso` en el SP**: El campo `UltimoAcceso` debe estar en el SELECT de `SP_Usuario_Listar` para que el reporte muestre datos reales. Si no está presente, la columna mostrará "Sin registro". **Acción requerida**: Agregar `U.UltimoAcceso` al SELECT del SP.

2. **Reportes pendientes**: Solo el reporte de Usuarios está implementado. Los demás (Expedientes, Agenda, Trámites, Notificaciones, Rendimiento) muestran "Próximamente" en el grid.

3. **Dashboard**: aún no consume endpoints reales de reportes (usa mock temporal).

4. **Módulos pendientes**: Clientes, Expedientes, Agenda, Trámites, Histórico, Notificaciones OJ y Mantenimiento muestran `PaginaEnConstruccion`.

### 7.2 Dependencias adicionales

El módulo de reportes utiliza las siguientes dependencias no nativas de Angular:

| Paquete | Versión | Propósito |
|---|---|---|
| `jspdf` | 2.5.2+ | Generación de documentos PDF |
| `jspdf-autotable` | 3.8.4+ | Tablas automáticas en jsPDF |

> **Nota**: Estas dependencias generan warnings de CommonJS en el build (de `canvg` y `html2canvas`). Son warnings, no errores. Se pueden silenciar agregando `allowedCommonJsDependencies` en `angular.json` si es necesario.

### 7.3 Rendimiento

- **Lazy loading**: El módulo de reportes se carga perezosamente (`loadComponent`) solo cuando el usuario navega a `/reportes`.
- **Chunk size**: El chunk de reportes pesa ~459 kB (debido a jspdf + canvg). Se carga una sola vez y queda en cache del navegador.
- **Signals**: El componente utiliza signals de Angular para el estado reactivo, evitando re-renderizados innecesarios.

### 7.4 Responsive

El diseño es responsive con breakpoints en:

| Breakpoint | Comportamiento |
|---|---|
| > 1060px | Grid de categorías en 3 columnas, stat cards en 4 columnas |
| 560px - 1060px | Grid de categorías en 2 columnas, stat cards en 2 columnas |
| < 560px | Grid de categorías en 1 columna, stat cards en 1 columna |

### 7.5 Accesibilidad

- **Keyboard navigation**: Las tarjetas de categoría son navegables por teclado (`tabindex="0"`, manejo de `keydown.enter`).
- **SVG icons**: Todos los íconos tienen `aria-hidden="true"` para lectores de pantalla.
- **Semantic HTML**: Uso de `<section>`, `<article>`, `<header>` para estructura.
- **Color contrast**: Colores de texto cumplen con ratio mínimo 4.5:1 contra fondo blanco.

### 7.6 Próximos pasos

1. **Crear `SP_Permiso_Listar` y `SP_Permiso_GuardarRol`**: Estos SPs son necesarios para que la matriz de permisos funcione end-to-end (gap conocido del módulo de Usuarios).
2. **Implementar reportes faltantes**: Cada categoría del grid tendrá su propio componente hijo con datos específicos.
3. **Agregar filtros al reporte de Usuarios**: Filtros por rol, estado, rango de fechas.
4. **Exportar a Excel**: Agregar botón de exportación a Excel además de PDF.
5. **Reportes con gráficas SVG/CSS**: Los reportes de Expedientes, Agenda y Rendimiento incluirán gráficas dibujadas con SVG (igual que el dashboard).
