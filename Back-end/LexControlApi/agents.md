# Plan de Trabajo - Backend LexControlApi

Documento de planificación para la implementación del backend en `LexControlApi` (.NET 10 / ASP.NET Core Web API). El proyecto actualmente es un scaffold vacío con solo el controlador `WeatherForecast`. Este plan detalla qué se implementará para conectar el frontend SPA con la base de datos `DBLexControl`.

> **Nota**: Los comentarios y documentación deben estar en español, consistente con el repositorio.

---

## 1. Visión General

- **Tecnología**: .NET 10, ASP.NET Core Web API, `Nullable` e `ImplicitUsings` activados.
- **Arquitectura**: Web API que expone endpoints RESTful. La capa de datos llama a procedimientos almacenados en SQL Server (no se usan `DELETE` directos; el borrado es lógico con `Activo = 0`).
- **Contrato de datos**: Definido implícitamente por los mock del frontend (`despliegue/LexControlDemo/js/*-comun.js`). El API debe devolver DTOs que coincidan con las estructuras `MOCK_CLIENTES`, `MOCK_EXPEDIENTES`, etc.

## 2. Arquitectura Propuesta

```
LexControlApi/
├── Controllers/
│   ├── AuthController.cs            // Login y renovación de token
│   ├── CatalogosController.cs        // Catálogos estáticos (RAMA, ESTADOS, etc.)
│   ├── ClientesController.cs         // CRUD de CLIENTES
│   ├── ExpedientesController.cs      // CRUD de EXPEDIENTES
│   ├── AudienciasController.cs       // CRUD de AUDIENCIAS
│   ├── TramitesController.cs         // CRUD de TRAMITES
│   ├── DiligenciasController.cs      // CRUD de DILIGENCIAS
│   ├── NotificacionesController.cs   // CRUD de NOTIFICACION_OJ
│   ├── EventosController.cs          // CRUD de EVENTO_BASE (agenda)
│   ├── NotasController.cs            // CRUD de NOTA_* (notas de expediente/cliente/audiencia/tramite)
│   ├── DocumentosController.cs       // CRUD de DOC_* (documentos por entidad)
│   ├── ReportesController.cs         // SP_Reporte_*
│   └── ConfiguracionController.cs    // CONFIGURACION, perfil de usuario, ajustes
├── Models/
│   ├── Persona.cs
│   ├── Usuario.cs
│   ├── Cliente.cs
│   ├── Expediente.cs
│   ├── Audiencia.cs
│   ├── Tramite.cs
│   ├── NotificacionOJ.cs
│   ├── EventoBase.cs
│   ├── NotaExpediente.cs
│   ├── DocExpediente.cs
│   └── Catalogos.cs (RAMA, ESTADO_EXPEDIENTE, TIPO_AUDIENCIA, etc.)
├── Dtos/
│   ├── Auth/
│   │   ├── LoginRequest.cs
│   │   └── LoginResponse.cs
│   ├── Clientes/
│   │   ├── ClienteDto.cs
│   │   ├── ClienteCreateDto.cs
│   │   ├── ClienteUpdateDto.cs
│   │   └── ClienteListaDto.cs
│   ├── Expedientes/
│   │   ├── ExpedienteDto.cs
│   │   ├── ExpedienteCreateDto.cs
│   │   ├── ExpedienteUpdateDto.cs
│   │   ├── ExpedienteListaDto.cs
│   │   ├── ParteProcesalDto.cs
│   │   ├── NotaExpedienteDto.cs
│   │   └── DocExpedienteDto.cs
│   ├── Audiencias/
│   ├── Tramites/
│   ├── Diligencias/
│   ├── Notificaciones/
│   ├── Eventos/
│   ├── Reportes/
│   ├── Configuracion/
│   └── Catalogos/
│       └── CatalogoDtos.cs        // Todas las clases DTO: CatalogoFila, JuzgadoFila, CatalogoDto, JuzgadoDto, CatalogoCrearDto, JuzgadoCrearDto, CatalogoEstadoDto
├── Data/
│   ├── IRepositorio.cs              // Interfaz de repositorio genérica
│   ├── RepositorioSql.cs            // Implementación vía stored procedures (Dapper)
│   └── ConnectionFactory.cs         // Factory de conexiones SqlConnection
├── Services/
│   ├── IAuthService.cs              // Login, generación de token
│   ├── AuthService.cs
│   ├── CatalogoService.cs           // ICatalogoService + CatalogoService (CRUD genérico + Juzgado)
│   └── IReporteService.cs
│     └── ReporteService.cs
├── Filters/
│   └── ValidacionFiltro.cs           // Validación de modelos
├── Middleware/
│   └── ManejadorExcepciones.cs       // Captura global de errores
├── Helpers/
│   ├── HashHelper.cs                // SHA256 (compatibilidad legacy con seed)
│   ├── PaginacionHelper.cs
│   └── FechasHelper.cs
├── Properties/
├── appsettings.json
├── Program.cs
└── LexControlApi.csproj
```

## 3. Dependencias a Instalar (NuGet)

| Paquete | Propósito |
|---|---|
| `Dapper` | Micro-ORM para mapear resultados de SP a DTOs (ligero, no requiere DbContext). |
| `Microsoft.Data.SqlClient` | Cliente SQL Server. |
| `System.IdentityModel.Tokens.Jwt` | Generación y validación de JWT. |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Middleware de autenticación JWT. |
| `Microsoft.AspNetCore.Cors` | CORS para consumo desde frontend SPA. |
| `FluentValidation.AspNetCore` | Validación de DTOs en capa de entrada. |

## 4. Configuración (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DBLexControl;User Id=sa;Password=TuPassword123;Encrypt=false;TrustServerCertificate=true;"
  },
  "Jwt": {
    "Secret": "LexControl_Secret_Key_32_Chars_2026!",
    "Issuer": "LexControlApi",
    "Audience": "LexControlApp",
    "ExpiryMinutes": 120
  },
  "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
  "AllowedHosts": "*"
}
```

> **Nota de seguridad**: El `Secret` debe venir de variable de entorno en producción (`builder.Configuration["Jwt:Secret"]`). El hash de la BD usa SHA256 sin salt (débil); se documenta en AGENTS.md. El backend debe hashar la contraseña del login con SHA256 antes de comparar con la BD (compatibilidad), pero se recomienda migrar a BCrypt/PBKDF2 en el futuro.

## 5. Autenticación y Autorización

### 5.1 AuthController (`POST /api/auth/login`)

1. Recibe `LoginRequest { Usuario, Contraseña }`.
2. Calcula SHA256 de `Contraseña` (sin salt — compat con seed).
3. Ejecuta `SP_Usuario_Autenticar @Usuario, @ContraseñaHash`.
4. Si devuelve fila → genera JWT con claims: `Usuario_ID`, `Usuario`, `NombreCompleto`, `Rol_ID`, `RolNombre`.
5. Respuesta: `LoginResponse { Token, Usuario, NombreCompleto, Rol, Expiracion }`.
6. Registra intento fallido vía `SP_Usuario_RegistrarIntentoFallido` si falla.

### 5.2 Políticas de autorización

- **Administrador** (Rol_ID = 1): acceso total.
- **Secretaria** (Rol_ID = 2): acceso a agenda, documentos, notificaciones.
- **Abogado** (Rol_ID = 3): acceso a expedientes, audiencias, trámites.

### 5.3 CORS

- Permitir orígenes `http://localhost:5181` (backend) y el puerto del frontend SPA.
- Permitir credenciales, métodos GET/POST/PUT/DELETE.

## 6. Controladores y Endpoints

### 6.1 Catálogos (`GET /api/catalogos`)

Lista todos los catálogos maestros en un solo request (evita múltiples round-trips en el SPA):

| Catálogo | Tabla origen |
|---|---|
| Ramas | RAMA |
| EstadosExpediente | ESTADO_EXPEDIENTE |
| TiposAudiencia | TIPO_AUDIENCIA |
| EstadosAudiencia | ESTADO_AUDIENCIA |
| ResultadosAudencia | RESULTADO_AUDIENCIA |
| TiposTramite | TIPO_TRAMITE |
| EstadosTramite | ESTADO_TRAMITE |
| TiposDiligencia | TIPO_DILIGENCIA |
| EstadosDiligencia | ESTADO_DILIGENCIA |
| TiposNotificacionOJ | TIPO_NOTIFICACION_OJ |
| EstadosNotificacionOJ | ESTADO_NOTIFICACION_OJ |
| TiposProceso | TIPO_PROCESO |
| EtiquetasNota | ETIQUETA_NOTA |
| EstadosEvento | ESTADO_EVENTO |
| TiposJuzgado | TIPO_JUZGADO |
| RolesProcesales | ROL_PROCESAL |
| Juzgados | JUZGADO (con Departamento/Municipio) |
| Abogados | USUARIO/Rol = 'Abogado' |

### 6.2 Clientes (`ClientesController`)

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/clientes` | `SP_Cliente_Buscar` | Lista con filtros: Nombre, DPI, Teléfono, Email |
| GET | `/api/clientes/{id}` | `SP_Cliente_ObtenerPorID` | Detalle completo con datos de PERSONA |
| POST | `/api/clientes` | `SP_Cliente_Insertar` | Crea Persona + Cliente en transacción |
| PUT | `/api/clientes/{id}` | `SP_Cliente_Actualizar` | Actualiza datos (a implementar) |
| DELETE | `/api/clientes/{id}` | — | Borrado lógico (`Activo = 0` en CLIENTE) |

**Contrato DTO Cliente** (basado en mock `MOCK_CLIENTES`):
```json
{
  "id": 1,
  "nombreCompleto": "Carlos Morales Ortiz",
  "dpi": "2983123450101",
  "telefonoPrincipal": "+502 5555-0123",
  "emailPrincipal": "carlos.mo@email.com",
  "telefonoSecundario": null,
  "emailSecundario": null,
  "direccion": "Calle Principal 5-20, Zona 1, Panajachel",
  "fechaNacimiento": "1985-03-12",
  "genero": "M",
  "tipoCliente": "Particular",
  "notas": "Cliente referido por recomendación.",
  "activo": true,
  "expedientesActivos": 2
}
```

### 6.3 Expedientes (`ExpedientesController`)

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/expedientes` | `SP_Expediente_Listar` | Lista con filtros: Cliente_ID, Estado_ID, Rama_ID, Usuario_ID, FechaInicio, FechaFin, NoExpediente |
| GET | `/api/expedientes/{id}` | `SP_Expediente_ObtenerPorID` | Detalle con joins de cliente, rama, abogado, juzgado |
| POST | `/api/expedientes` | `SP_Expediente_Insertar` | Crea nuevo expediente |
| PUT | `/api/expedientes/{id}` | `SP_Expediente_Actualizar` | Actualización parcial |
| PUT | `/api/expedientes/{id}/estado` | `SP_Expediente_CambiarEstado` | Cambio de estado (cerrar/activar) |
| DELETE | `/api/expedientes/{id}` | `SP_Expediente_Eliminar` | Verifica dependencias y elimina (con cascade) |

**Contrato DTO Expediente** (basado en mock `MOCK_EXPEDIENTES`):
```json
{
  "no": "CIV-2026-0045",
  "clienteId": 1,
  "cliente": "Carlos Morales Ortiz",
  "rolProcesal": "Demandante",
  "rolProcesalId": 1,
  "rama": "Civil",
  "ramaId": 1,
  "tipoProceso": "Incumplimiento Contractual",
  "juzgado": "Juzgado de Primera Instancia Civil de Sololá",
  "juzgadoId": 3,
  "fechaIngreso": "2026-01-15",
  "estado": "Activo",
  "estadoId": 1,
  "descripcion": "Demanda por incumplimiento de contrato de servicios.",
  "notasInternas": "Revisar términos de la demanda inicial antes del viernes.",
  "abogado": "Lic. Diego Matzar",
  "abogadoId": 2,
  "partes": [ { "rol": "Demandante", "entidad": "Carlos Morales Ortiz", "representante": "Lic. Carlos Fuentes" } ],
  "notas": [ { "contenido": "...", "etiqueta": "Estrategia", "prioritario": 1, "autor": "Lic. Diego Matzar", "fecha": "2026-03-15" } ],
  "documentos": [ { "nombre": "Demanda_Inicial.pdf", "tipo": "PDF", "tamano": "2.4 MB" } ]
}
```

> **Endpoints secundarios de expediente**: notas (`POST /api/expedientes/{id}/notas`), documentos (`POST /api/expedientes/{id}/documentos`), partes procesales.

### 6.4 Audiencias (`AudienciasController`)

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/audiencias` | (nuevo) | Lista con filtros: Expediente_ID, Fecha, Estado |
| GET | `/api/audiencias/{id}` | — | Obtener por ID |
| POST | `/api/audiencias` | `SP_Audiencia_Insertar` | Registrar audiencia |
| PUT | `/api/audiencias/{id}/resultado` | `SP_Audiencia_RegistrarResultado` | Registrar resultado y estado = Realizada |
| GET | `/api/audiencias/proximas` | `SP_Audiencia_Proximas` | Audiencias próximas (default 30 días) |

### 6.5 Trámites (`TramitesController`)

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/tramites` | — | Lista con filtros: Expediente_ID, Estado_ID, Tipo_ID |
| POST | `/api/tramites` | `SP_Tramite_Insertar` | Registrar trámite |
| PUT | `/api/tramites/{id}/estado` | `SP_Tramite_ActualizarEstado` | Cambiar estado y registrar resolución |

### 6.6 Notificaciones OJ (`NotificacionesController`)

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/notificaciones` | — | Lista con filtros: Expediente_ID, Estado_ID, Tipo_ID |
| POST | `/api/notificaciones` | `SP_NotificacionOJ_Insertar` | Registrar notificación |
| PUT | `/api/notificaciones/{id}/atender` | `SP_NotificacionOJ_Atender` | Marcar como atendida |
| POST | `/api/notificaciones/verificar-duplicado` | `SP_NotificacionOJ_VerificarDuplicado` | Chequear duplicados |

### 6.7 Eventos / Agenda (`EventosController`)

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/eventos/dia` | `SP_Evento_ObtenerDelDia` | Eventos del día (Usuario_ID, Fecha) |
| POST | `/api/eventos` | `SP_EventoBase_Insertar` | Crear evento base |
| POST | `/api/eventos/audiencia` | `SP_EventoAudiencia_Insertar` | Crear evento de tipo audiencia |

### 6.8 Notas y Documentos

Endpoints CRUD genéricos anidados bajo su entidad padre:
- `POST /api/expedientes/{id}/notas` → `SP_NotaExpediente_Insertar`
- `GET /api/expedientes/{id}/notas` → `SP_NotaExpediente_ObtenerPorExpediente`
- `POST /api/expedientes/{id}/documentos` → `SP_DocExpediente_Insertar`

Los demás (notas/documentos de cliente, audiencia, trámite, diligencia, notificación) siguen el mismo patrón y usarán SPs similares a crearse.

### 6.9 Reportes (`ReportesController`)

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/reportes/expedientes-por-estado` | `SP_Reporte_ExpedientesPorEstado` | Resumen + detalle |
| GET | `/api/reportes/plazos-vencimiento` | `SP_Reporte_PlazosVencimiento` | Plazos próximos a vencer |
| GET | `/api/reportes/expedientes-por-rama` | `SP_Reporte_ExpedientesPorRama` | Distribución por rama |
| GET | `/api/reportes/expedientes-por-juzgado` | `SP_Reporte_ExpedientesPorJuzgado` | Distribución por juzgado |
| GET | `/api/reportes/antiguedad-expedientes` | `SP_Reporte_AntiguedadExpedientes` | Control de mora procesal |
| GET | `/api/reportes/actividad-audiencias` | `SP_Reporte_ActividadAudiencias` | Estadísticas de audiencias |
| GET | `/api/reportes/gestion-tramites` | `SP_Reporte_GestionTramites` | KPIs de trámites |
| GET | `/api/reportes/notificaciones-oj` | `SP_Reporte_NotificacionesOJ` | Seguimiento de notificaciones |
| GET | `/api/reportes/diligencias` | `SP_Reporte_Diligencias` | Actividad de diligencias |
| GET | `/api/reportes/alertas-pendientes` | `SP_Reporte_AlertasPendientes` | Alertas activas |
| GET | `/api/reportes/eventos-agenda-mes` | `SP_Reporte_EventosAgendaMes` | Eventos del mes en agenda |

> Cada reporte devuelve **dos conjuntos de resultados**: un **resumen** (agrupado) y un **detalle** (filas individuales). El DTO de respuesta contendrá `Resumen` y `Detalle` como listas.

### 6.10 Configuración (`ConfiguracionController`)

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/configuracion` | — | Lista claves de configuración (NombreBufete, EmailBufete, etc.) |
| GET | `/api/configuracion/perfil` | — | Perfil del usuario autenticado |
| PUT | `/api/configuracion/perfil` | — | Actualiza nombre/email/teléfono del usuario |
| PUT | `/api/configuracion/cambiocontrasena` | — | Cambio de contraseña |

### 6.11 Mantenimiento de Catálogos (`CatalogosController`)

CRUD genérico para catálogos del sistema. Solo accesible para Administrador (Rol_ID = 1).

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/catalogos/{tabla}` | `SP_Catalogo_Buscar` | Lista filas del catálogo (con filtros, paginación y Total en header) |
| GET | `/api/catalogos/{tabla}/{id}` | `SP_Catalogo_ObtenerPorID` | Obtener fila por ID |
| POST | `/api/catalogos/{tabla}` | `SP_Catalogo_Insertar` | Crear nueva fila (valida unicidad de Nombre) |
| PUT | `/api/catalogos/{tabla}/{id}` | `SP_Catalogo_Actualizar` | Actualizar fila (valida unicidad de Nombre) |
| PUT | `/api/catalogos/{tabla}/{id}/estado` | `SP_Catalogo_CambiarEstado` | Activar/desactivar fila (verifica integridad referencial antes de desactivar) |

**Tablas soportadas** (whitelist): RAMA, ESTADO_EXPEDIENTE, TIPO_PROCESO, ROL_PROCESAL, TIPO_JUZGADO, ETIQUETA_NOTA.

**Endpoints dedicados para Juzgado** (por complejidad con FKs):

| Método | Endpoint | SP | Descripción |
|---|---|---|---|
| GET | `/api/catalogos/juzgados` | `SP_Juzgado_Buscar` | Lista juzgados (con Municipio/Departamento, filtros, paginación) |
| GET | `/api/catalogos/juzgados/{id}` | `SP_Juzgado_ObtenerPorID` | Obtener juzgado por ID |
| POST | `/api/catalogos/juzgados` | `SP_Juzgado_Insertar` | Crear juzgado (valida nombre único) |
| PUT | `/api/catalogos/juzgados/{id}` | `SP_Juzgado_Actualizar` | Actualizar juzgado (valida nombre único) |
| PUT | `/api/catalogos/juzgados/{id}/estado` | `SP_Juzgado_CambiarEstado` | Activar/desactivar juzgado (verifica integridad referencial) |

**Contrato DTO genérico**:
```json
{
  "id": 1,
  "nombre": "Derecho Civil",
  "valor": null,
  "descripcion": "Rama del derecho civil",
  "color": "#358292",
  "orden": 1,
  "activo": true,
  "fechaCreacion": "2026-01-01T00:00:00"
}
```

**SPs**: Todos están en `LexControl/ScriptsDB/sp_mantenimientos.sql`. SPs genéricos validan que la tabla esté en el whitelist para prevenir inyección SQL. Los SPs de juzgado son dedicados por la complejidad de las FKs (Tipo_Juzgado_ID, Municipio_ID).

## 7. Detalles de Implementación por Fase

### Fase 1: Infraestructura Base
1. Agregar paquetes NuGet (`Dapper`, `Microsoft.Data.SqlClient`, `System.IdentityModel.Tokens.Jwt`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `FluentValidation.AspNetCore`).
2. Configurar `ConnectionStrings` y `Jwt` en `appsettings.json`.
3. Crear `Data/ConnectionFactory.cs` — singleton que retorna `SqlConnection`.
4. Crear `Data/IRepositorio.cs` y `Data/RepositorioSql.cs` — métodos genéricos `QuerySingle`, `QueryMultiple` que ejecutan SPs.
5. Configurar CORS y JWT en `Program.cs`.
6. Crear `Middleware/ManejadorExcepciones.cs` para capturar errores y devolver JSON consistente.
7. Crear `Helpers/HashHelper.cs` — método `Sha256Hash(string)` para compatibilidad con la BD.
8. Reemplazar `WeatherForecastController` con los nuevos controladores.

### Fase 2: Autenticación
1. Crear DTOs `LoginRequest` / `LoginResponse`.
2. Implementar `Services/AuthService.cs` → `Login()`: calcula SHA256, ejecuta `SP_Usuario_Autenticar`, genera JWT.
3. `Controllers/AuthController.cs` con `[HttpPost("login")]`.
4. Probar con las credenciales admin/admin123.

### Fase 3: Catálogos
1. Endpoint `GET /api/catalogos` que devuelve todos los catálogos y abogados en un solo DTO.
2. Útil para poblar SelectBoxes del SPA sin múltiples requests.

### Fase 4: CRUD de Clientes y Expedientes (entidades maestras)
1. Modelos y DTOs (`Cliente`, `Expediente`, etc.).
2. `ClientesController` completo (GET lista, GET por ID, POST, PUT, DELETE lógico).
3. `ExpedientesController` completo + endpoints anidados de notas/documentos/partes.
4. Validaciones con FluentValidation.

### Fase 5: CRUD secundario
1. `AudienciasController`, `TramitesController`, `NotificacionesController`, `EventosController`.
2. Implementar los SPs faltantes que el frontend mock asume existentes (ej. audiencias, trámites, notas/documentos por tipo).

### Fase 6: Reportes
1. `ReportesController` con los 11 endpoints.
2. DTO `ReporteRespuesta<T>` con `Resumen` y `Detalle`.
3. Mapear resultados de `QueryMultiple` a ambas listas.

### Fase 7: Configuración y Ajustes
1. Endpoints de perfil, cambio de contraseña, configuración del bufete.
2. Conectar con tabla `CONFIGURACION` y `PERSONA`/`USUARIO`.

### Fase 8: Pulido y Testing
1. Documentación Swagger (ya habilitado con `AddOpenApi`).
2. Swagger UI configurado en development.
3. Pruebas manuales con archivos `.http`.
4. Revisar consistencia de fechas (ISO 8601: `yyyy-MM-dd`).

## 8. Convenciones de Código

- **Controladores** en `Controllers/`, nombres en plural (`ClientesController`).
- **DTOs** en `Dtos/`, con subcarpetas por módulo.
- **Models** en `Models/` reflejando tablas de la BD.
- **SPs** siempre se llaman por nombre (`SP_Entidad_Accion`) con parámetros nombrados.
- **Fechas**: formato ISO 8601 (`yyyy-MM-dd` para fechas, `yyyy-MM-ddTHH:mm:ss` para datetime).
- **Respuestas de API**: usar ActionResult genérico. Errores con `{ error: string, codigo: int }`.
- **Borrado lógico**: `Activo = 0`, nunca DELETE físico.
- Los nombres de columnas siguen CamelCase en C# y se mapean a las columnas de la BD vía Dapper (default).

## 9. Compatibilidad con el Frontend Mock

El frontend mock (`despliegue/LexControlDemo/`) usa hooks en `window`:

| Hook | Descripción |
|---|---|
| `window.ExpedientesComun.onGuardarExpediente(datos)` | Se dispara al crear/editar expediente |
| `window.ExpedientesComun.onGuardarNota(nota)` | Se dispara al agregar nota |
| `window.ClientesComun.onCrear(datos)` | Crear cliente |
| `window.ClientesComun.onEditar(datos)` | Editar cliente |

El SPA real debe reemplazar estos mocks con llamadas `fetch()` a los endpoints definidos arriba. La estructura de datos mock define el contrato JSON esperado.

## 10. Riesgos y Consideraciones

- **SHA256 sin salt**: Compatibilidad con seed existente. Se debe usar SHA256 en login pero se recomienda plan de migración a BCrypt.
- **Codificación SQL**: `Proceso_almacenados.sql` está en Windows-1252 (conservar al editar); `Reportes_almacenados.sql` y `Base_Datos.sql` están en UTF-8 con BOM.
- **SPs faltantes**: No todos los CRUDs tienen SPs (ej. actualizar cliente, lista de audiencias). Se deben crear nuevos SPs siguiendo las convenciones de AGENTS.md.
- **Bug en Base_Datos.sql**: El DROP DATABASE usa nombre distinto (`LexControlDB` vs `DBLexControl`). Documentado en AGENTS.md.

---

## 11. Validación de Archivos Subidos (Documentos)

### 11.1 Tipos de archivo permitidos

Solo se permiten documentos de ofimática y texto plano. **No se permiten** ejecutables, hojas de cálculo, imágenes (salvo JPEG/PNG para.documentos adjuntos) ni ningún otro tipo.

| Extensión | Tipo | Magic Bytes |
|---|---|---|
| `.pdf` | PDF | `25 50 44 46` (%PDF) |
| `.doc` | Word 97-2003 (OLE2) | `D0 CF 11 E0` |
| `.docx` | Word OOXML (ZIP) | `50 4B 03 04` (PK) |
| `.jpg` / `.jpeg` | JPEG | `FF D8 FF` |
| `.png` | PNG | `89 50 4E 47` (‰PNG) |
| `.txt` | Texto plano | Sin magic bytes (solo extensión) |

### 11.2 Validación por Magic Bytes (File Signature Validation)

El sistema implementa **validación en 3 capas** para evitar que archivos renombrados (ej. un `.exe` renombrado a `.pdf`) pasen la validación:

1. **HTML** — Atributo `accept` en el input file (filtro UX, bypasseable).
2. **Frontend TS** — Lee los primeros 8 bytes con `FileReader` y compara contra firmas conocidas antes de enviar al backend (error inmediato sin esperar upload).
3. **Backend** — `FileStorageService.GuardarAsync()` lee los primeros 8 bytes del `IFormFile` vía `OpenReadStream()` y valida contra `MagicBytes.Validar()`. Si no coincide → `ExcepcionNegocio` con HTTP 400.

### 11.3 Clase `MagicBytes` (Services/FileStorageService.cs)

```csharp
internal static class MagicBytes
{
    internal static bool Validar(byte[] buffer, int bytesRead, string extension)
    {
        if (bytesRead < 4) return false;
        return extension.ToLowerInvariant() switch
        {
            ".pdf"  => buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46,
            ".doc"  => buffer[0] == 0xD0 && buffer[1] == 0xCF && buffer[2] == 0x11 && buffer[3] == 0xE0,
            ".docx" => buffer[0] == 0x50 && buffer[1] == 0x4B && buffer[2] == 0x03 && buffer[3] == 0x04,
            ".jpg" or ".jpeg" => bytesRead >= 3 && buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF,
            ".png"  => buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47,
            ".txt"  => true,  // TXT no tiene magic bytes fiables
            _       => false
        };
    }
}
```

### 11.4 Flujo de validación en `GuardarAsync()`

```
1. Obtener extensión del nombre del archivo
2. Si extension vacía → buscar en MimeToExtension por ContentType
3. Leer primeros 8 bytes del stream del archivo
4. Llamar MagicBytes.Validar(buffer, bytesRead, extension)
5. Si no es válido → ExcepcionNegocio("El contenido del archivo no coincide con la extension {ext} indicada.", 400)
6. Si es válido → proceder a escribir a disco
```

### 11.5 Mensajes de error

| Capa | Mensaje |
|---|---|
| Backend (extensión) | `Tipo de archivo no permitido: {ext}. Tipos permitidos: .pdf, .doc, .docx, .jpg, .jpeg, .png, .txt` |
| Backend (magic bytes) | `El contenido del archivo no coincide con la extension {ext} indicada.` |
| Frontend (extensión) | `Tipo de archivo no permitido. Solo se aceptan PDF, Word, JPG, PNG y TXT.` |
| Frontend (magic bytes) | `El contenido del archivo no coincide con la extension {ext} indicada.` |
