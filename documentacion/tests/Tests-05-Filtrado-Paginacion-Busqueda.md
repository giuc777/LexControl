# Tests de Filtrado, Búsqueda y Paginación

## Resumen

Tests que validan el uso de parámetros de consulta para filtrar, buscar y paginar resultados en los diferentes controladores.

---

## 1. Filtrado por Parámetros de Consulta

| Controlador | Método | Endpoint | Parámetros | Status |
|---|---|---|---|---|
| **Clientes** | `Listar_ConFiltroNombre_DevuelveListaFiltrada` | `GET /api/clientes` | `?filtroNombre=Carlos` | 200 o 401 |
| **Expedientes** | `Listar_ConFiltros_Devuelve200` | `GET /api/expedientes` | `?estadoId=1&ramaId=1&pagina=1&tamanioPagina=10` | 200 o 401 |
| **Audiencias** | `Listar_ConFiltroEstado_Devuelve200` | `GET /api/audiencias` | `?estadoId=1` | 200 |
| **Trámites** | `Listar_ConFiltros_Devuelve200` | `GET /api/tramites` | `?estadoId=1&tipoId=1` | 200 |
| **Diligencias** | `Listar_ConFiltros_Devuelve200` | `GET /api/diligencias` | `?estadoId=1&tipoId=1` | 200 |
| **Notificaciones** | `Listar_ConFiltros_Devuelve200` | `GET /api/notificaciones` | `?estadoId=1&tipoId=1` | 200 |
| **Histórico** | `Listar_ConFiltros_Devuelve200` | `GET /api/historico` | `?ramaId=1&clienteId=1` | 200 |
| **Usuarios** | `Listar_ConFiltros_Devuelve200` | `GET /api/usuarios` | `?filtroNombre=admin&rolId=1&activo=true` | 200 |

**Total: 8 tests**

### Parámetros Comunes de Filtros

| Parámetro | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `estadoId` | int | Filtrar por estado del registro | `?estadoId=1` |
| `ramaId` | int | Filtrar por rama/jurisdicción | `?ramaId=1` |
| `tipoId` | int | Filtrar por tipo de trámite/diligencia | `?tipoId=1` |
| `clienteId` | int | Filtrar por cliente asociado | `?clienteId=1` |
| `rolId` | int | Filtrar por rol de usuario | `?rolId=1` |
| `filtroNombre` | string | Buscar por nombre | `?filtroNombre=Carlos` |
| `activo` | bool | Filtrar por estado activo | `?activo=true` |

---

## 2. Paginación

| Controlador | Método | Endpoint | Parámetros | Status |
|---|---|---|---|---|
| **Clientes** | `Listar_ConPaginacion_DevuelveHeaders` | `GET /api/clientes` | `?pagina=1&tamanioPagina=5` | 200 o 401 |
| **Expedientes** | `Listar_ConFiltros_Devuelve200` | `GET /api/expedientes` | `?pagina=1&tamanioPagina=10` | 200 o 401 |

**Total: 2 tests**

### Parámetros de Paginación

| Parámetro | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `pagina` | int | Número de página (1-indexed) | `?pagina=1` |
| `tamanioPagina` | int | Registros por página | `?tamanioPagina=5` |

---

## 3. Búsqueda de Texto

| Controlador | Método | Endpoint | Parámetros | Status |
|---|---|---|---|---|
| **Catálogos** | `BuscarCatalogo_ConBusqueda_Devuelve200` | `GET /api/catalogos/RAMA` | `?busqueda=Civil` | 200 |
| **Histórico** | `Listar_ConBusqueda_Devuelve200` | `GET /api/historico` | `?busqueda=test` | 200 |
| **Catálogos** | `Juzgados_ConBusqueda_Devuelve200` | `GET /api/catalogos/juzgados` | `?busqueda=Primera` | 200 |

**Total: 3 tests**

---

## 4. Filtrado por Fechas

| Controlador | Método | Endpoint | Parámetros | Status |
|---|---|---|---|---|
| **Histórico** | `Listar_ConFechas_Devuelve200` | `GET /api/historico` | `?fechaInicio=2026-08-16&fechaFin=2026-09-16` | 200 |
| **Reportes** | `ExpedientesPorEstado_ConFiltros_Devuelve200` | `GET /api/reportes/expedientes-por-estado` | `?fechaInicio=2026-03-16&fechaFin=2026-09-16` | 200 |
| **Eventos** | `ObtenerDelDia_ConFecha_Devuelve200` | `GET /api/eventos/dia` | `?fecha=2026-09-16` | 200 |
| **Audiencias** | `Proximas_ConToken_Devuelve200` | `GET /api/audiencias/proximas` | `?dias=30` | 200 |

**Total: 4 tests**

### Formatos de Fecha

| Parámetro | Formato | Descripción |
|---|---|---|
| `fechaInicio` | `YYYY-MM-DD` | Fecha de inicio del rango |
| `fechaFin` | `YYYY-MM-DD` | Fecha de fin del rango |
| `fecha` | `YYYY-MM-DD` | Fecha específica |
| `dias` | int | Número de días hacia adelante |

---

## 5. Validación de Tablas de Catálogos

| Controlador | Método | Endpoint | Status | Qué Valida |
|---|---|---|---|---|
| **Catálogos** | `BuscarCatalogo_TablaInvalida_DevuelveError` | `GET /api/catalogos/TABLA_NO_EXISTENTE` | 400 o 500 | Tabla inexistente es rechazada |

---

## Resumen

| Categoría | Tests |
|---|---|
| Filtrado por parámetros | 8 |
| Paginación | 2 |
| Búsqueda de texto | 3 |
| Filtrado por fechas | 4 |
| Validación de tablas | 1 |
| **Total** | **18** |
