# Reporte de Expedientes por Rama — Documentación Técnica

> Documentación del módulo **Reporte de Expedientes por Rama** de **LexControl**, el sistema de gestión de expedientes para un bufete jurídico guatemalteco.
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
├── reportesUsuarios.md             — Documentación del reporte de Usuarios
├── reportesExpedientesRama.md      — ← Este documento
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
│       │   │   │   └── reportes/   — Componentes de reportes
│       │   │   │       ├── reportes-page.ts/html              — Grid selector de reportes
│       │   │   │       ├── reportes-usuarios-page.ts/html     — Reporte de usuarios
│       │   │   │       └── reportes-expedientes-rama-page.ts/html — Reporte de expedientes por rama
│       │   │   ├── app.routes.ts   — Rutas (login público; resto bajo shell + guards)
│       │   │   └── app.config.ts   — Providers globales
│       │   └── src/environments/
│       │       ├── environment.ts  — Producción
│       │       └── environment.development.ts — Dev (apiBaseUrl: localhost:5181)
```

---

## 2. Descripción funcional

El reporte de **Expedientes por Rama** ofrece una vista consolidada de todos los expedientes del bufete, agrupados por rama de derecho y estado procesal.

### 2.1 Tarjetas de estadísticas (4 cards)

| Tarjeta | Descripción | Fórmula |
|---|---|---|
| **Total Expedientes** | Cantidad total de expedientes en el sistema | `expedientes.length` |
| **Activos** | Expedientes con estado "Activo" (estadoId = 1) | `filter(estadoId === 1).length` |
| **En Espera** | Expedientes con estado "En Espera" (estadoId = 2) | `filter(estadoId === 2).length` |
| **Cerrados / Archivados** | Expedientes con estado "Cerrado" (3) o "Archivado" (4) | `filter(estadoId === 3 \|\| 4).length` |

### 2.2 Distribución por Rama (barras de progreso)

Barras horizontales que muestran la cantidad y porcentaje de expedientes por cada rama del derecho:
- **Civil**, **Penal**, **Familiar**, **Municipal**, **Laboral**, **Constitucional**
- Ordenadas de mayor a menor cantidad
- Colores asignados desde `ramaColor` del catálogo de la BD

### 2.3 Distribución por Estado (tabla)

Tabla que muestra el conteo y porcentaje de expedientes por cada estado:
- **Activo**, **En Espera**, **Cerrado**, **Archivado**, **Urgente**
- Colores asignados desde `estadoColor` del catálogo de la BD

### 2.4 Tabla completa de expedientes

| Columna | Campo | Descripción |
|---|---|---|
| No. Expediente | `noExpediente` | Código único del expediente (ej. CIV-2026-0001) |
| Cliente | `cliente` | Nombre completo del cliente |
| Rama | `rama` | Rama del derecho (badge coloreado) |
| Estado | `estado` | Estado procesal actual (badge coloreado) |
| Juzgado | `juzgado` | Juzgado asignado |
| Abogado | `abogado` | Abogado responsable |
| Fecha Ingreso | `fechaIngreso` | Fecha de ingreso formateada |

### 2.5 Exportar PDF

Genera un archivo PDF en formato **landscape A4** con:
- **Encabezado**: "Expedientes por Rama — LexControl" + fecha de generación
- **Resumen**: Total, Activos, En Espera, Cerrados/Archivados
- **Tabla completa**: 8 columnas con todos los expedientes
- **Color de encabezado**: `#B2845A` (color de la categoría Expedientes)
- **Archivo**: `reporte-expedientes-por-rama-lexcontrol.pdf`

---

## 3. Fuente de datos

### 3.1 Endpoint utilizado

| Método | URL | Descripción |
|---|---|---|
| `GET` | `/api/expedientes?tamanioPagina=9999` | Trae todos los expedientes (sin paginación) |

**Nota**: Se usa `tamanioPagina=9999` para obtener todos los registros de una sola llamada, ya que el componente necesita el conjunto completo para computar las estadísticas.

### 3.2 Modelo de datos: ExpedienteLista

```typescript
interface ExpedienteLista {
    id: number;
    noExpediente: string;        // 'CIV-2026-0001'
    cliente: string;             // Nombre completo
    clienteId: number;
    rolProcesalId: number;
    rolProcesal: string;
    ramaId: number;
    rama: string;                // 'Civil', 'Penal', etc.
    ramaColor: string | null;    // '#358292', '#B2845A', etc.
    tipoProceso: string | null;
    juzgadoId: number;
    juzgado: string;
    fechaIngreso: string | null; // ISO date
    estadoId: number;
    estado: string;              // 'Activo', 'En Espera', etc.
    estadoColor: string | null;  // '#358292', '#F39C12', etc.
    descripcion: string | null;
    notasInternas: string | null;
    abogadoId: number;
    abogado: string;
    fechaCreacion: string | null;
    fechaModificacion: string | null;
}
```

### 3.3 Cálculos en el frontend

Los datos se procesan con `computed()` signals de Angular:

```typescript
// Conteo por rama
readonly porRama = computed(() => {
    const mapa = new Map<string, { cantidad: number; color: string }>();
    for (const e of lista) {
        const key = e.rama || 'Sin rama';
        // Acumula conteo y color
    }
    // Retorna array ordenado por cantidad descendente
});

// Conteo por estado
readonly porEstado = computed(() => {
    // Similar a porRama, agrupando por e.estado
});
```

---

## 4. Arquitectura técnica

### 4.1 Componentes

| Componente | Archivo | Responsabilidad |
|---|---|---|
| `ReportesPage` | `reportes-page.ts/html` | Grid selector de 6 categorías de reporte |
| `ReportesExpedientesRamaPage` | `reportes-expedientes-rama-page.ts/html` | Reporte de expedientes por rama |

### 4.2 Flujo de datos

```
ExpedientesService.listar({ tamanioPagina: 9999 })
    │
    ├── toSignal() → signal<ExpedienteLista[]>
    │
    ├── computed: total
    ├── computed: activos (estadoId === 1)
    ├── computed: enEspera (estadoId === 2)
    ├── computed: cerrados (estadoId === 3 || 4)
    ├── computed: porRama → RamaConteo[]
    ├── computed: porEstado → EstadoConteo[]
    └── computed: expedientesTabla → ExpedienteLista[] + fechaIngresoFormato
```

### 4.3 Templates

El patrón sigue el mismo estilo que el reporte de usuarios:

1. **Page header** con título + botón Exportar PDF
2. **4 stat cards** en grid `.rep-stats`
3. **2-column grid** (`.rep-grid`): barras por rama (izq) + tabla por estado (der)
4. **Tabla completa** en `.aj-card`
5. **Footnote** con referencia al endpoint

### 4.4 Estilos CSS

Todos los estilos son globales en `src/styles/modules/reportes.css` (ya existentes):

| Clase CSS | Uso |
|---|---|
| `.rep-stats` | Grid de 4 tarjetas de estadísticas |
| `.rep-stat` | Tarjeta individual con label, value, badge |
| `.rep-stat-badge.ok/.warn/.danger/.info` | Badges coloreados según condición |
| `.rep-grid` | Grid de 12 columnas |
| `.rep-c5`, `.rep-c7` | Span de 5 y 7 columnas |
| `.rep-progress-list` | Lista de barras de progreso |
| `.rep-progress-row` | Fila individual de barra |
| `.rep-progress-track/.rep-progress-fill` | Barra de progreso horizontal |
| `.rep-dot` | Indicador de color pequeño |
| `.rep-chip` | Badge con contador |
| `.rep-export-btn` | Botón de exportar PDF |
| `.rep-back-btn` | Botón "Volver a Reportes" |
| `.rep-footnote` | Nota al pie |
| `.rep-fecha` | Celda de fecha con formato monospace |
| `.data-table` | Tabla de datos estándar |
| `.pill` | Badge genérico con color dinámico |

---

## 5. Verificación en la base de datos

### 5.1 Datos de prueba (seeds)

Los seeds de `LexControlDB.sql` insertan ramas del derecho con estos IDs y colores:

| ID | Rama | Color |
|---|---|---|
| 1 | Civil | `#358292` |
| 2 | Penal | `#B2845A` |
| 3 | Familiar | `#97BEC6` |
| 4 | Municipal | `#6C8B6C` |
| 5 | Laboral | `#8E44AD` |
| 6 | Constitucional | `#2C3E50` |

Los estados de expediente:

| ID | Estado | Color |
|---|---|---|
| 1 | Activo | `#3498DB` |
| 2 | En Espera | `#F39C12` |
| 3 | Cerrado | `#2ECC71` |
| 4 | Archivado | `#8b9aa0` |
| 5 | Urgente | `#E74C3C` |

### 5.2 Verificar datos

```sql
-- Contar expedientes por rama
SELECT r.Nombre AS Rama, COUNT(e.Expediente_ID) AS Cantidad
FROM EXPEDIENTE e
JOIN RAMA r ON e.Rama_ID = r.Rama_ID
GROUP BY r.Nombre
ORDER BY Cantidad DESC;

-- Contar expedientes por estado
SELECT es.Nombre AS Estado, COUNT(e.Expediente_ID) AS Cantidad
FROM EXPEDIENTE e
JOIN ESTADO_EXPEDIENTE es ON e.Estado_ID = es.Estado_ID
GROUP BY es.Nombre
ORDER BY Cantidad DESC;
```

### 5.3 Verificar en el navegador

1. Navegar a `/reportes`
2. Hacer clic en "Expedientes por Rama" (tarjeta color `#B2845A`)
3. Verificar que las stat cards muestran los conteos correctos
4. Verificar que las barras de rama reflejan la distribución real
5. Verificar que la tabla de estados muestra los porcentajes correctos
6. Hacer clic en "Exportar PDF" y verificar el archivo generado

---

## 6. Endpoint del backend

### 6.1 GET /api/expedientes

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `ramaId` | number | No | Filtrar por rama (1-6) |
| `estadoId` | number | No | Filtrar por estado (1-5) |
| `clienteId` | number | No | Filtrar por cliente |
| `abogadoId` | number | No | Filtrar por abogado |
| `noExpediente` | string | No | Búsqueda por número de expediente |
| `pagina` | number | No | Página (default: 1) |
| `tamanioPagina` | number | No | Tamaño de página (default: 7, reporte usa 9999) |

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "noExpediente": "CIV-2026-0001",
            "cliente": "Carlos Morales Ortiz",
            "rama": "Civil",
            "ramaColor": "#358292",
            "estado": "Activo",
            "estadoColor": "#3498DB",
            "juzgado": "Juzgado de Primera Instancia Civil de Solola",
            "abogado": "Maria Lopez",
            "fechaIngreso": "2026-01-15T00:00:00"
        }
    ]
}
```

**Headers de respuesta:**
```
X-Total-Count: 45
```

---

## 7. Integración con el módulo de Reportes

### 7.1 Registro en el grid de reportes

En `reportes-page.ts`, el reporte de expedientes está registrado como:

```typescript
{
    key: 'expedientes',
    titulo: 'Expedientes por Rama',
    descripcion: 'Distribución de expedientes por rama de derecho y estado actual.',
    icono: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    color: '#B2845A',
    disponibles: 1  // ← Indica que el reporte está disponible
}
```

### 7.2 Renderizado condicional

En `reportes-page.html`:
```html
@if (reporteActivo() === 'expedientes') {
    <app-reportes-expedientes-rama-page />
}
```

### 7.3 Importación del componente

En `reportes-page.ts`:
```typescript
import { ReportesExpedientesRamaPage } from './reportes-expedientes-rama-page';

@Component({
    imports: [ReportesUsuariosPage, ReportesExpedientesRamaPage],
    ...
})
```

---

## 8. Comparación con el reporte de usuarios

| Aspecto | Reporte de Usuarios | Reporte de Expedientes por Rama |
|---|---|---|
| **Endpoint** | `GET /api/usuarios` | `GET /api/expedientes?tamanioPagina=9999` |
| **Stat cards** | Total, Activos, Inactivos, Bloqueados | Total, Activos, En Espera, Cerrados |
| **Barras de progreso** | Por Rol (3 roles) | Por Rama (6 ramas) |
| **Tabla secundaria** | Últimos 10 accesos | Distribución por Estado |
| **Tabla completa** | Todos los usuarios | Todos los expedientes |
| **Exportar PDF** | Sí (header azul #358292) | Sí (header rojizo #B2845A) |
| **Color de categoría** | `#358292` (cyan) | `#B2845A` (dorado) |

---

## 9. Siguientes pasos

- [ ] Crear reportes para: Agenda y Audiencias, Trámites en Curso, Notificaciones OJ, Rendimiento del Bufete
- [ ] Agregar filtros de fecha al reporte (rango de fechas de ingreso)
- [ ] Agregar exportar a Excel/CSV
- [ ] Considerar endpoint dedicado para datos agregados (más eficiente que traer todos los registros)
