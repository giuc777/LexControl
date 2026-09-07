# Plan de Trabajo - Frontend LexControlFornt (Angular 20)

Documento de planificación para la implementación del SPA en `LexControlFornt` (Angular 20, componentes standalone). El proyecto es un scaffold recién creado (`ng new`). Este plan detalla qué se implementará para replicar el prototipo visual de `Pototipo/` y conectarlo con la API REST de `LexControlApi` (.NET 10).

> **Nota**: Los comentarios y textos de la interfaz deben estar en español, consistente con el repositorio. La fuente de verdad del diseño es `Pototipo/` (copia de `despliegue/LexControlDemo/`).

---

## 1. Visión General

- **Tecnología**: Angular 20 (standalone components, signals, nuevo control flow `@if/@for`), TypeScript estricto, zone.js activado.
- **Diseño**: Réplica fiel del prototipo estático `Pototipo/` — CSS propio portado tal cual, sin librerías UI (sin Angular Material, sin Bootstrap).
- **Gráficas**: SVG/CSS dibujados a mano (barras, donas, sparklines), igual que hace el prototipo en `dashboard.js` y `reportes-comun.js`.
- **Backend**: Consume `LexControlApi` vía REST + JWT. El contrato de datos ya está definido por los mocks de `Pototipo/js/*-comun.js` y los DTOs documentados en `Desarrollo/Back-end/LexControlApi/agents.md`.

## 2. Stack y Dependencias

| Paquete | Estado | Propósito |
|---|---|---|
| `@angular/*` ^20.1 | Instalado | Framework |
| `rxjs` ~7.8 | Instalado | Reactividad (HTTP, guards) |
| `zone.js` ~0.15 | Instalado | Change detection |

**No se añaden librerías UI ni de gráficas.** Todo componente visual es propio, portado del prototipo.

## 3. Sistema de Diseño (extraído de `Pototipo/css/layout.css`)

### 3.1 Tokens CSS (portar a `src/styles/tokens.css`)

```css
:root {
    --brand: #358292;        /* color principal (sidebar, avatar, botones) */
    --brand-dark: #2a6b77;
    --deep: #066575;         /* chips OJ, acentos */
    --deep-dark: #054e5a;

    --sidebar-bg: #358292;
    --topbar-bg: #f9f9fc;
    --divider: #bec8cb;
    --field-line: #d8dede;
    --panel-line: #e5e8ea;

    --ink: #1a1c1e;          /* texto principal */
    --muted: #3f484b;        /* texto secundario */
    --subtle: #8b9aa0;       /* texto terciario */

    --radius-card: 10px;
    --radius-field: 8px;

    --font: 'Hanken Grotesk', 'Segoe UI', system-ui, -apple-system, sans-serif;
}
```

- Fondo del cuerpo de la app: `#f3f5f7`.
- Fuente Hanken Grotesk cargada desde Google Fonts (weights 400/500/600), igual que el prototipo.
- Badges de estado con colores por catálogo (ver sección 3.3).

### 3.2 Layout de aplicación

- **Sidebar**: fijo izquierdo, 260px, fondo `--brand`, logo + "LexControl / Gestión Legal Centralizada", lista de módulos filtrada por permisos, footer con "Cerrar Sesión". Ítems SVG inline (paths tomados de `layout.js NAV_ITEMS`).
- **Topbar**: fijo superior, 64px, fondo `--topbar-bg`; búsqueda (360px), chip "OJ ONLINE" (solo si el rol permite notificaciones), campana con badge rojo, avatar con iniciales + nombre + rol.
- **Main**: `margin-left: 260px; margin-top: 64px; padding: 28px`.
- **Responsive `<1024px`**: sidebar oculto con `transform: translateX(-100%)`, botón hamburguesa, overlay al abrir. En `<640px` se ocultan búsqueda, nombre de usuario y chip OJ.
- **Toast**: fijo abajo-derecha, fondo oscuro, animación fade/slide (reemplaza a `window.lexToast`).
- **FAB**: botón flotante "Nuevo Expediente" en Dashboard (abajo-derecha).

### 3.3 Colores semánticos de estados (de los mocks)

- Ramas (Reportes): Civil `#358292`, Penal `#B2845A`, Familiar `#97BEC6`, Municipal `#6C8B6C`, Laboral `#8E44AD`, Constitucional `#2C3E50`.
- Estados de trámite: Ingresado `#3498DB`, En Proceso `#F39C12`, Resuelto `#2ECC71`, Rechazado `#E74C3C`.
- Estados de expediente/notificación: usar `Color` de los catálogos de la BD (`GET /api/catalogos` devuelve la columna `Color NVARCHAR(7)`).

## 4. Mapa de Rutas (espejo del prototipo)

Ruta pública:

| Ruta | Componente | Prototipo |
|---|---|---|
| `/login` | `LoginPage` | `index.html` + `login.js` |

Rutas autenticadas (todas bajo un `ShellComponent` con sidebar+topbar, lazy loading):

| Ruta | Módulo (key permiso) | Prototipo |
|---|---|---|
| `/dashboard` | dashboard | `dashboard.html` |
| `/clientes` · `/clientes/:id` | clientes | `clientes.html` · `clientes-detalle.html` |
| `/expedientes` · `/expedientes/:id` | expedientes | `expedientes.html` · `expedientes-detalle.html` |
| `/agenda` · `/agenda/:id` | audiencias | `agenda.html` · `agenda-detalle.html` |
| `/tramites` · `/tramites/:id` | tramites | `tramites.html` · `tramites-detalle.html` |
| `/historico` · `/historico/:id` | historico | `historico.html` · `historico-detalle.html` |
| `/notificaciones-oj` · `/notificaciones-oj/:id` | notificaciones | `notificaciones-oj.html` · `notificacion-oj.html` |
| `/mantenimiento` · `/mantenimiento/:catalogo` | mantenimiento | `mantenimiento.html` · `mantenimiento-detalle.html` |
| `/reportes` | reportes | `reportes.html` |
| `/ajustes` | ajustes | `ajustes.html` |

- Default `''` → redirect `/dashboard`. Ruta wildcard `**` → redirect `/dashboard`.
- Cada feature se carga con `loadComponent`/`loadChildren` (lazy).
- Guards: `authGuard` (sesión válida) y `moduloGuard(key)` (rol puede ver el módulo; si no → redirect `/dashboard`, igual que hace `layout.js`).

## 5. Arquitectura de Carpetas Propuesta

```
src/
├── index.html                      // carga fuentes + título LexControl
├── styles.css                      // importa los parciales de styles/
├── styles/
│   ├── tokens.css                  // :root variables (sección 3.1)
│   ├── layout.css                  // sidebar/topbar/toast/responsive (portado)
│   ├── login.css                   // portado íntegro
│   └── modules/                    // dashboard.css, clientes.css, ... portados
├── app/
│   ├── app.config.ts               // providers: router, httpClient, interceptor
│   ├── app.routes.ts               // rutas raíz (login + shell lazy)
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth-service.ts     // login, sesión, token, logout
│   │   │   ├── auth-interceptor.ts // agrega Bearer + manejo 401
│   │   │   ├── auth-guard.ts       // protege rutas autenticadas
│   │   │   └── modulo-guard.ts     // valida permiso de módulo por rol
│   │   ├── permisos/
│   │   │   └── permisos.ts         // matriz rol→módulos (igual que permisos-comun.js)
│   │   ├── api/
│   │   │   ├── api-config.ts       // baseUrl centralizada
│   │   │   └── api-error.ts        // tipo de error normalizado { error, codigo }
│   │   └── models/                 // interfaces TS = contratos mock/API
│   │       ├── cliente.model.ts
│   │       ├── expediente.model.ts
│   │       ├── audiencia.model.ts
│   │       ├── tramite.model.ts
│   │       ├── notificacion-oj.model.ts
│   │       ├── evento.model.ts
│   │       ├── catalogo.model.ts   // Catálogo genérico {id,nombre,valor,descripcion,color,orden,activo}
│   │       └── reporte.model.ts    // ReporteRespuesta<T> { resumen: T[]; detalle: T[] }
│   ├── core/services/              // un servicio por recurso (sección 8)
│   ├── layout/
│   │   ├── shell/shell.*           // sidebar + topbar + <router-outlet>
│   │   ├── sidebar/sidebar.*
│   │   ├── topbar/topbar.*
│   │   └── toast/toast-service.ts + toast.*
│   ├── shared/components/
│   │   ├── modal/                  // modal genérico reutilizable
│   │   ├── data-table/             // tabla con búsqueda/filtros/paginación cliente-side
│   │   ├── badge-estado/           // badge coloreado según catálogo
│   │   ├── stat-card/              // card de estadística del dashboard
│   │   ├── empty-state/            // estado vacío de tablas/listas
│   │   ├── page-header/            // título + breadcrumb + acciones
│   │   └── charts/                 // bar-chart, donut-chart, sparkline (SVG propio)
│   └── features/
│       ├── login/
│       ├── dashboard/
│       ├── clientes/               // lista + detalle (+ modales CRUD)
│       ├── expedientes/            // lista + detalle con tabs (partes, notas, documentos)
│       ├── agenda/
│       ├── tramites/
│       ├── historico/
│       ├── notificaciones-oj/
│       ├── mantenimiento/          // catálogos paginados + editor de ítem
│       ├── reportes/
│       └── ajustes/                // perfil, usuarios, permisos, bufete, seguridad
```

Convención de nombres: estilo Angular 20 (sin sufijos `.component`/`.service`): `clientes-page.ts`, `cliente-detalle-page.ts`, `auth-service.ts`. Comentarios y textos de UI en español.

## 6. Autenticación y Permisos

### 6.1 Flujo de login (replica `login.js`)

1. `POST /api/auth/login` con `{ usuario, contrasena }` (ojo: el backend espera `Contraseña` — acordar el nombre exacto del campo JSON).
2. Respuesta esperada: `{ token, usuario, nombreCompleto, rol, expiracion }`.
3. Guardar sesión en `sessionStorage` (claves equivalentes al prototipo): `lexcontrol_token`, `lexcontrol_usuario`, `lexcontrol_nombre`, `lexcontrol_rol`, `lexcontrol_expiracion`.
4. Errores: mostrar alerta roja "Usuario o contraseña incorrectos..." (mismo texto del prototipo).
5. Al cerrar sesión: limpiar storage y redirigir a `/login`.

### 6.2 Matriz de permisos (replica `permisos-comun.js`)

```ts
// Defaults por rol; Administrador puede editarla luego en Ajustes > Permisos.
const PERMISOS_DEFECTO = {
  Administrador: todosLosModulos(),
  Secretaria:    todosMenos(['historico', 'notificaciones']),
  Abogado:       todosMenos(['mantenimiento'])
};
```

- Módulos (keys): `dashboard, clientes, expedientes, audiencias, tramites, historico, notificaciones, mantenimiento, reportes, ajustes`.
- El sidebar solo muestra módulos permitidos al rol de la sesión; el `moduloGuard` bloquea acceso directo por URL redirigiendo a `/dashboard`.
- Fase inicial: matriz hardcodeada (la BD no tiene tabla de permisos). Fase futura: persistir edición del admin vía endpoint de configuración.

## 7. Contratos TypeScript Clave (= mocks del prototipo)

```ts
interface ClienteLista {
  id: number; codigo: string;                // 'CL-001' se genera en UI o backend
  nombreCompleto: string; dpi: string;
  telefonoPrincipal: string; emailPrincipal: string;
  direccion: string; fechaNacimiento: string; genero: 'M'|'F';
  tipoCliente: string; notas: string; activo: boolean;
  expedientesActivos: number; expedientesTotal: number; ultimaActividad: string;
}

interface ExpedienteDto {
  no: string;                                // 'CIV-2026-0045'
  clienteId: number; cliente: string;
  ramaId: number; rama: string; tipoProceso: string;
  juzgadoId: number; juzgado: string;
  fechaIngreso: string; estadoId: number; estado: string;
  descripcion: string; notasInternas?: string;
  abogadoId: number; abogado: string;
  partes: ParteProcesal[];
  notas: NotaExpediente[];
  documentos: DocExpediente[];
}

interface Catalogo { id: number; nombre: string; valor?: string;
  descripcion?: string; color?: string; orden: number; activo: boolean; }

interface ReporteRespuesta<T> { resumen: T[]; detalle: T[]; }
```

Reglas de fechas: siempre ISO `yyyy-MM-dd` para fechas y `yyyy-MM-ddTHH:mm:ss` para datetimes (contrato acordado con el backend). Formateo local (dd/mm/yyyy, nombres de mes en español) en helpers de UI, no en los modelos.

## 8. Servicios Front ↔ Endpoints Backend

| Servicio (core/services/) | Endpoint(s) | Notas |
|---|---|---|
| `auth-service` | `POST /api/auth/login` | JWT + sesión |
| `catalogos-service` | `GET /api/catalogos` | Un solo request para poblar TODOS los selects; cachear en signal durante la sesión |
| `clientes-service` | `GET/POST/PUT/DELETE /api/clientes` | DELETE lógico (`Activo=0`) |
| `expedientes-service` | `/api/expedientes` + `/api/expedientes/{id}/notas` · `/documentos` · `/partes` | Cambio de estado vía `PUT /{id}/estado` |
| `audiencias-service` | `/api/audiencias` · `/proximas` · `PUT /{id}/resultado` | Agenda mensual + registro de resultado |
| `eventos-service` | `/api/eventos/dia` · `POST /api/eventos` | Agenda del día/semana del dashboard |
| `tramites-service` | `/api/tramites` · `PUT /{id}/estado` | |
| `notificaciones-service` | `/api/notificaciones` · `PUT /{id}/atender` · `POST /verificar-duplicado` | Módulo OJ |
| `reportes-service` | `/api/reportes/*` (11 endpoints) | Respuesta siempre `{resumen, detalle}` |
| `configuracion-service` | `/api/configuracion` · `/perfil` · `/cambiocontrasena` | Ajustes |
| `usuarios-service` | (definir con backend) | Gestión de usuarios de Ajustes |

Manejo de errores uniforme: el interceptor captura 401 → logout y redirect `/login`; errores de negocio (`{error, codigo}`) → toast con el mensaje.

## 9. Fases de Implementación

| Fase | Entregable | Criterio de listo |
|---|---|---|
| 0 | Estilos globales portados + Shell (sidebar/topbar/toast) + Login conectado al API real | Se inicia sesión con admin/admin123 contra LexControlApi; nav filtra por rol |
| 1 | Core: models, services base, interceptor, guards, catálogos cacheados | Navegación completa con lazy routes y guards activos |
| 2 | Dashboard: stat cards + agenda semanal + FAB | Datos reales desde `/api/eventos` y `/api/reportes/alertas-pendientes` |
| 3 | Clientes lista + detalle + CRUD modal | Alta/edición/desactivación persistida |
| 4 | Expedientes lista + detalle (tabs: resumen/partes/notas/documentos) | CRUD + notas + cambio de estado funcionando |
| 5 | Agenda (audiencias) + detalle + registro de resultado | Calendario mensual navegable con eventos reales |
| 6 | Trámites + Histórico Legal (listas y detalles) | CRUD y filtros operativos |
| 7 | Notificaciones OJ lista + detalle + atender/duplicados | Flujo OJ completo |
| 8 | Mantenimiento de catálogos (grid paginado + editor) | Catálogos editables desde `GET /api/catalogos` + SPs de mantenimiento |
| 9 | Reportes con gráficas SVG/CSS | Los 11 reportes renderizan resumen+detalle |
| 10 | Ajustes (perfil, usuarios, permisos, bufete, seguridad) + pulido responsive | Paridad visual con prototipo revisada página por página |

## 10. Buenas Prácticas

### 10.1 Angular moderno

- **Standalone siempre**: ningún NgModule; imports por componente.
- **Signals para estado local/servicios** (`signal`, `computed`); RxJS solo para flujos HTTP/eventos (usar `toSignal` cuando aplique). No mezclar suscripciones manuales con signals para el mismo dato.
- **Control flow nativo**: `@if`, `@for (track item.id)`, `@switch` — no usar `*ngIf/*ngFor`.
- **`ChangeDetectionStrategy.OnPush`** en todos los componentes nuevos.
- **Tipado estricto**: `strict: true` (ya viene así); prohibido `any` — usar interfaces de `core/models/`. Templates con `$any()` prohibidos.
- **Inyección con `inject()`** en lugar de constructor para servicios nuevos.
- **Lazy loading** obligatorio por feature route (`loadComponent`/`loadChildren`); mantener budgets de `angular.json` (initial 500kB warn / 1MB error).
- **Host bindings modernos**: `host: {}` en el decorator en lugar de `@HostBinding/@HostListener`.

### 10.2 Estilos

- Portar el CSS del prototipo **como estilos globales** (`src/styles/modules/*.css` importados desde `styles.css`), NO como estilos por componente: los archivos del prototipo superan el budget `anyComponentStyle` (4kB warn / 8kB error) y así se garantiza fidelidad visual 1:1.
- No reescribir clases del prototipo (mantener `.app-sidebar`, `.stat-card`, etc.) para poder comparar lado a lado con `Pototipo/`.
- Variables siempre vía `var(--token)`; prohibido hardcodear colores fuera de `tokens.css`.
- Iconografía: SVG inline con paths copiados de `Pototipo/js/layout.js` (no añadir librería de íconos).

### 10.3 Seguridad

- Nunca loguear ni versionar el token JWT ni credenciales; el token vive solo en `sessionStorage`.
- **Sanitización XSS**: todo texto dinámico se interpola con `{{ }}` (escapado automático). Prohibido `[innerHTML]`; si algún día es imprescindible, pasar por `DomSanitizer.sanitize()`.
- Validar formularios con Reactive Forms (validadores síncronos) antes de enviar; nunca confiar solo en validación de UI (el backend también valida).
- `baseUrl` del API por environments (`environment.apiBaseUrl`), nunca hardcoded en servicios.
- No incluir el token de Figma de `link-figma.txt` ni secretos en este proyecto.

### 10.3.1 Validación de archivos subidos (Documentos)

El módulo de expedientes permite subir documentos adjuntos. La validación de archivos se ejecuta en **3 capas**:

| Capa | Ubicación | Qué valida |
|---|---|---|
| HTML | `expediente-detalle-page.html` | Atributo `accept` en `<input type="file">` (filtro UX) |
| Frontend | `expediente-detalle-page.ts` | Extensión + magic bytes antes del HTTP |
| Backend | `FileStorageService.cs` | Extensión + magic bytes antes de escribir a disco |

**Tipos permitidos**: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`, `.txt`

**Magic bytes validados en el frontend** (`validarMagicBytes()`):
- PDF → `25 50 44 46` (%PDF)
- DOC → `D0 CF 11 E0` (OLE2)
- DOCX → `50 4B 03 04` (ZIP/PK)
- JPEG → `FF D8 FF`
- PNG → `89 50 4E 47` (‰PNG)
- TXT → siempre válido (sin magic bytes fiables)

**Flujo en `alSubirArchivo()`**:
1. Validar extensión contra lista de permitidos → toast si no coincide
2. Leer primeros 8 bytes con `FileReader.readAsArrayBuffer(archivo.slice(0, 8))`
3. Comparar magic bytes contra firma conocida → toast si no coincide
4. Si pasa ambas validaciones → enviar al backend via `DocumentosService.subir()`

**Importante**: La validación frontend es UX (error inmediato). La validación backend es la seguridad obligatoria. Nunca confiar solo en la capa de UI.

### 10.4 HTTP y datos

- Toda llamada pasa por `HttpClient` + `auth-interceptor` (Bearer automático).
- Manejo de errores centralizado: 401 → logout; resto → toast con mensaje del backend (`{error, codigo}`). Ningún componente maneja errores HTTP crudos.
- Catálogos: una sola carga de `GET /api/catalogos` cacheada en servicio con signal; selects nunca hacen requests propios repetidos.
- Fechas: viajar siempre en ISO; convertir a zona horaria local solo al renderizar.
- Borrado siempre lógico: botones "Desactivar"/"Activar" (`activo: false/true`); no existe eliminar físico en la UI.

### 10.5 Accesibilidad y UX

- Replicar la semántica del prototipo: `aria-label` en icon buttons, `role="alert"`/`role="status"` en alertas, labels asociados a inputs.
- Navegación por teclado en tablas/modales (foco atrapado en modal, cierre con Escape).
- Textos de UI exactamente como el prototipo (botones "Guardar cliente", "HOY", placeholders de búsqueda, mensajes vacíos).
- Loading states: skeleton o spinner simple en cada página mientras carga; nunca doble submit (deshabilitar botón durante request).

### 10.6 Código y repositorio

- Comentarios en español, solo donde aporten contexto (mismo estilo del prototipo).
- Commits pequeños por fase/módulo con mensaje descriptivo en español.
- `git status` limpio antes de commits; no versionar `node_modules/`, `dist/`, ni `.angular/` (completar `.gitignore` si falta algo).
- Antes de dar por terminada cada fase: `npm run build` sin errores y comparación visual contra `Pototipo/<pagina>.html`.

## 11. Gotchas y Limitaciones Conocidas

- **Nombre de carpeta**: `LexControlFornt` tiene typo (falta la 'e' de "Front"). Se conserva para no romper `package.json`/`angular.json` (project name `"LexControlFornt"`).
- **CORS/proxy**: el dev server de Angular corre en `http://localhost:4200`. Preferir `proxy.conf.json` (`/api` → URL del API) para evitar CORS en desarrollo; alternativamente coordinar con el backend la lista de orígenes permitidos.
- **Campo contraseña**: el seed usa SHA256 sin salt — eso lo resuelve el backend; el front solo envía la contraseña en HTTPS por el body del login. No implementar hash en el cliente (no aporta seguridad real).
- **SPs faltantes en backend**: algunos módulos (histórico legal, usuarios) aún no tienen endpoints definidos; marcar esos features con mock temporal claramente etiquetado (`// MOCK: pendiente endpoint`) hasta que el backend exponga el SP.
- **Permisos**: la BD no tiene tabla de permisos; la matriz vive en el front (sección 6.2) hasta definirse su persistencia.
- **Presupuestos de estilos**: ver sección 10.2 — portar CSS globalmente o subir budget explícito si algún día un componente necesita estilos propios grandes.
