# Módulo 02 — Audiencias (Agenda)

> **Estado:** ✅ COMPLETADO — SPs + Backend + Frontend
> **Ruta frontend:** `/agenda` (calendario), `/agenda/:id` (detalle)
> **Fecha implementación:** 14 Sep 2026

---

## 1. Descripción

Gestión de audiencias judiciales. Calendario mensual navegable con eventos posicionados por día, registro de resultados y detalle completo.

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
| `features/agenda/agenda-detalle-page.ts` + `.html` | Detalle de audiencia + formulario de registro de resultado |

### 4.4 Estilos

**Archivo:** `Front-end/LexControlFornt/src/styles/modules/agenda.css`

- Calendario grid 7 columnas con navegación mes anterior/siguiente
- Eventos del día con cards y pills de estado
- Detalle de audiencia con grid de campos
- Formulario de registro de resultado

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
