# Módulo 02 — Audiencias (Agenda)

> **Estado:** ✅ COMPLETADO — SPs + Backend + Frontend + Correcciones
> **Ruta frontend:** `/agenda` (calendario), `/agenda/:id` (detalle)
> **Fecha implementación:** 14 Sep 2026
> **Última actualización:** 15 Sep 2026 (correcciones + modal de resultado)

---

## 1. Descripción

Gestión de audiencias judiciales. Calendario mensual navegable con eventos posicionados por día, registro de resultados en modal y detalle completo.

---

## 2. Procedimientos Almacenados

**Estado:** Los 5 SPs ya existían en la BD (LexControlDB.sql + Extras_SP.sql).

| SP | Archivo | Parámetros |
|---|---|---|
| `SP_Audiencia_Listar` | Extras_SP.sql | @Expediente_ID, @FechaInicio, @FechaFin, @Estado_ID, @Tipo_ID |
| `SP_Audiencia_ObtenerPorID` | Extras_SP.sql | @ID |
| `SP_Audiencia_Insertar` | LexControlDB.sql | @Expediente_ID, @Fecha, @HoraInicio, @HoraFin, @Tipo_ID, @Juzgado_ID, @Sala, @Estado_ID, @Resultado_ID, @DescripcionResultado, @ProximaActuacion, @Notas, @Documentos, @Usuario_Creacion_ID, @NuevoID OUTPUT |
| `SP_Audiencia_RegistrarResultado` | LexControlDB.sql | @ID, @Resultado_ID, @DescripcionResultado, @ProximaActuacion, @UsuarioModificacion_ID |
| `SP_Audiencia_Proximas` | LexControlDB.sql | @Dias, @Usuario_ID |

**Estructura de la tabla AUDIENCIA:**
```
ID, Expediente_ID, Fecha, HoraInicio, HoraFin, Tipo_ID, Juzgado_ID, Sala,
Estado_ID, Resultado_ID, DescripcionResultado, ProximaActuacion, Notas,
Documentos, Usuario_Creacion_ID, FechaCreacion
```

---

## 3. Backend

### 3.1 DTOs

**Archivo:** `Back-end/LexControlApi/Dtos/Audiencias/AudienciaDtos.cs`

| Clase | Uso |
|---|---|
| `AudienciaFila` | Mapeo Dapper de SP_Audiencia_Listar |
| `AudienciaDetalleFila` | Mapeo Dapper de SP_Audiencia_ObtenerPorID |
| `AudienciaProximaFila` | Mapeo Dapper de SP_Audiencia_Proximas |
| `AudienciaDto` | DTO de respuesta (listado y proximas) |
| `AudienciaDetalleDto` | DTO de respuesta (detalle completo) |
| `AudienciaCrearDto` | DTO de entrada para crear |
| `AudienciaResultadoDto` | DTO de entrada para registrar resultado |

### 3.2 Service

**Archivo:** `Back-end/LexControlApi/Services/AudienciaService.cs`

| Método | SP | Descripción |
|---|---|---|
| `ListarAsync()` | SP_Audiencia_Listar | Lista con filtros (expediente, fechas, estado, tipo) |
| `ObtenerPorIdAsync()` | SP_Audiencia_ObtenerPorID | Detalle completo con joins |
| `CrearAsync()` | SP_Audiencia_Insertar | Crea nueva audiencia (con OUTPUT @NuevoID) |
| `RegistrarResultadoAsync()` | SP_Audiencia_RegistrarResultado | Registra resultado y cambia estado a "Realizada" |
| `ProximasAsync()` | SP_Audiencia_Proximas | Audiencias próximas (default 30 días) |

### 3.3 Controller

**Archivo:** `Back-end/LexControlApi/Controllers/AudienciasController.cs`

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/api/audiencias` | [Authorize] | Listar con filtros query string |
| GET | `/api/audiencias/{id}` | [Authorize] | Obtener detalle por ID |
| POST | `/api/audiencias` | [Authorize(Roles="Administrador,Abogado")] | Crear audiencia |
| PUT | `/api/audiencias/{id}/resultado` | [Authorize(Roles="Administrador,Abogado")] | Registrar resultado |
| GET | `/api/audiencias/proximas` | [Authorize] | Próximas audiencias |

### 3.4 DI Registration

**Archivo:** `Back-end/LexControlApi/Program.cs`
```csharp
builder.Services.AddScoped<IAudienciaService, AudienciaService>();
```

---

## 4. Frontend

### 4.1 Modelo

**Archivo:** `Front-end/LexControlFornt/src/app/core/models/audiencia.model.ts`

| Interfaz | Uso |
|---|---|
| `Audiencia` | Listado y proximas |
| `AudienciaDetalle` | Detalle completo |
| `AudienciaCrear` | DTO de creación |
| `AudienciaResultado` | DTO de registro de resultado |

### 4.2 Service

**Archivo:** `Front-end/LexControlFornt/src/app/core/services/audiencias-service.ts`

| Método | Endpoint | Retorna |
|---|---|---|
| `listar()` | GET `/api/audiencias` | `Observable<Audiencia[]>` |
| `obtenerPorId()` | GET `/api/audiencias/{id}` | `Observable<AudienciaDetalle>` |
| `crear()` | POST `/api/audiencias` | `Observable<number>` |
| `registrarResultado()` | PUT `/api/audiencias/{id}/resultado` | `Observable<void>` |
| `proximas()` | GET `/api/audiencias/proximas` | `Observable<Audiencia[]>` |

### 4.3 Componentes

| Archivo | Descripción |
|---|---|
| `features/agenda/agenda-page.ts` + `.html` | Calendario mensual navegable + lista de eventos del día |
| `features/agenda/audiencia-modal.ts` + `.html` | Modal de creación con catálogos dinámicos (TIPO_AUDIENCIA, ESTADO_AUDIENCIA, JUZGADO) |
| `features/agenda/agenda-detalle-page.ts` + `.html` | Detalle de audiencia con botón de registro de resultado |
| `features/agenda/resultado-modal.ts` + `.html` | **[NUEVO]** Modal de registro de resultado con resumen de audiencia + formulario |

### 4.4 Estilos

**Archivo:** `Front-end/LexControlFornt/src/styles/modules/agenda.css`

- Calendario grid 7 columnas con navegación mes anterior/siguiente
- Eventos del día con cards y pills de estado
- Detalle de audiencia con grid de campos, resumen y pills de tipo/estado
- Botón "Registrar Resultado" con icono SVG
- Panel de resultado registrado con borde lateral y icono de check
- Modal de resultado con resumen de audiencia (fondo gris) y formulario
- Loading spinner animado
- Responsive mobile (≤640px)

### 4.5 Rutas

**Archivo:** `Front-end/LexControlFornt/src/app/app.routes.ts`

```typescript
{
    path: 'agenda',
    canActivate: [moduloGuard('audiencias')],
    loadComponent: () => import('./features/agenda/agenda-page').then(m => m.AgendaPage)
},
{
    path: 'agenda/:id',
    canActivate: [moduloGuard('audiencias')],
    loadComponent: () => import('./features/agenda/agenda-detalle-page').then(m => m.AgendaDetallePage)
}
```

---

## 5. Pruebas de Endpoints

```http
### Listar audiencias
GET http://localhost:5181/api/audiencias
Authorization: Bearer <token>

### Obtener por ID
GET http://localhost:5181/api/audiencias/1
Authorization: Bearer <token>

### Crear audiencia
POST http://localhost:5181/api/audiencias
Authorization: Bearer <token>
Content-Type: application/json

{
  "expedienteId": 1,
  "tipoId": 1,
  "fecha": "2026-09-20",
  "horaInicio": "10:00",
  "juzgadoId": 1,
  "estadoId": 1,
  "sala": "Sala 1"
}

### Registrar resultado
PUT http://localhost:5181/api/audiencias/1/resultado
Authorization: Bearer <token>
Content-Type: application/json

{
  "resultadoId": 1,
  "descripcionResultado": "Audiencia realizada exitosamente",
  "proximaActuacion": "Sentencia para el 15/10/2026"
}

### Próximas audiencias
GET http://localhost:5181/api/audiencias/proximas?dias=30
Authorization: Bearer <token>
```

---

## 6. Criterios de Aceptación

- [x] Los 5 SPs existen y ejecutan sin errores
- [x] El controller compila con los 5 endpoints
- [x] Frontend muestra calendario con eventos reales
- [x] Modal de crear audiencia funciona con catálogos dinámicos
- [x] Registrar resultado cambia estado a "Realizada"
- [x] `dotnet build` exitoso (0 errores)
- [x] `npx ng build` exitoso (0 errores)
- [x] **[NUEVO]** Restricción unique en tabla AUDIENCIA previene duplicados
- [x] **[NUEVO]** Modal de registro de resultado con diseño completo
- [x] **[NUEVO]** SPs de reportes corregidos (subqueries → variables)
- [x] **[NUEVO]** Fix error CS1503 en AudienciaDtos.cs (ToString en string)

---

## 7. Correcciones y Mejoras (15 Sep 2026)

### 7.1 Restricción Única en AUDIENCIA

**Archivo:** `ScriptsDB/08-Audiencias-UniqueConstraint.sql`

```sql
ALTER TABLE AUDIENCIA
ADD CONSTRAINT UQ_AUDIENCIA_EXPEDIENTE_FECHA_HORA
UNIQUE (Expediente_ID, Fecha, HoraInicio);
```

Previene que se registren dos audiencias para el mismo expediente en la misma fecha y hora.

### 7.2 Datos Seed de Audiencias

**Archivo:** `ScriptsDB/09-Audiencias-SeedData.sql`

Script de prueba que inserta:
- 4 personas (clientes de prueba)
- 4 clientes vinculados a las personas
- 5 expedientes (Civil, Familiar, Laboral, Penal)
- 8 audiencias distribuidas en septiembre 2026

Solo se ejecuta si la tabla AUDIENCIA está vacía.

### 7.3 Corrección de SPs de Reportes

**Archivo:** `ScriptsDB/10-Reportes-FixSubquery.sql`

Corrección de 3 SPs que usaban subqueries dentro de `SUM(CASE WHEN ...)`:
- `SP_Reporte_NotificacionesOJ` — Líneas 70-71
- `SP_Reporte_Diligencias` — Líneas 16-17
- `SP_Reporte_EventosAgendaMes` — Línea 21

**Solución:** Declarar variables para los IDs antes de usar en agregaciones:
```sql
DECLARE @EstadoAtendida INT = (SELECT ID FROM ESTADO_NOTIFICACION_OJ WHERE Nombre = 'Atendida');
SUM(CASE WHEN N.Estado_ID = @EstadoAtendida THEN 1 ELSE 0 END)
```

### 7.4 Fix Error CS1503 en Backend

**Archivo:** `Back-end/LexControlApi/Dtos/Audiencias/AudienciaDtos.cs:102`

```csharp
// ANTES (error): HoraInicio ya es string, ToString() intenta usar IFormatProvider
HoraInicio = f.HoraInicio.ToString(@"hh\:mm"),

// DESPUÉS (fix): usar directamente el string
HoraInicio = f.HoraInicio,
```

`AudienciaProximaFila.HoraInicio` es `string` (Dapper convierte TIME a string), por lo que llamar `.ToString(formato)` falla porque el compilador interpreta el formato como `IFormatProvider?`.

### 7.5 Modal de Registro de Resultado

**Archivos nuevos:**
- `features/agenda/resultado-modal.ts` — Componente modal con `input.required<AudienciaDetalle>()`
- `features/agenda/resultado-modal.html` — Template con resumen de audiencia + formulario

**Flujo:**
1. En `/agenda/:id`, si el estado es "Programada" o "Reprogramada", aparece botón "Registrar Resultado"
2. Al hacer clic → se abre modal con resumen de la audiencia
3. Select de resultado cargado dinámicamente desde `RESULTADO_AUDIENCIA`
4. Textarea de descripción (obligatorio)
5. Input de próxima actuación (opcional)
6. Al guardar → `PUT /api/audiencias/{id}/resultado`
7. Modal se cierra y detalle se recarga

**Mejoras en el detalle:**
- Pills de tipo y estado con colores
- Panel de resultado con borde lateral izquierdo
- Icono de check para resultado registrado
- Próxima actuación destacada con fondo especial
- Loading spinner animado
- Responsive mobile
