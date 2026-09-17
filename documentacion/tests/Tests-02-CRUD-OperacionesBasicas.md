# Tests de CRUD — Operaciones Básicas

## Resumen

Tests que validan las operaciones fundamentales de cada controlador: **Listar (GET all)**, **Obtener por ID (GET by ID)** y **Crear (POST)**.

---

## 1. Listar Registros (GET /api/{recurso})

Todos los tests verifican que el endpoint retorna `200 OK` con un body válido usando token Admin.

| Controlador | Método | Endpoint | Status | Body Esperado |
|---|---|---|---|---|
| **Clientes** | `Listar_ConToken_Devuelve200` | `GET /api/clientes` | 200 | `{ Success: true, Data: [...] }` |
| **Expedientes** | `Listar_ConToken_Devuelve200` | `GET /api/expedientes` | 200 | `{ Success: true, Data: [...] }` |
| **Audiencias** | `Listar_ConToken_Devuelve200` | `GET /api/audiencias` | 200 | `{ Success: true, Data: [...] }` |
| **Trámites** | `Listar_ConToken_Devuelve200` | `GET /api/tramites` | 200 | `{ Success: true, Data: [...] }` |
| **Diligencias** | `Listar_ConToken_Devuelve200` | `GET /api/diligencias` | 200 | `{ Success: true, Data: [...] }` |
| **Notificaciones** | `Listar_ConToken_Devuelve200` | `GET /api/notificaciones` | 200 | `{ Success: true, Data: [...] }` |
| **Histórico** | `Listar_ConToken_Devuelve200` | `GET /api/historico` | 200 | `{ Success: true, Data: [...] }` |
| **Usuarios** | `Listar_ConRolAdmin_Devuelve200` | `GET /api/usuarios` | 200 | `{ Success: true, Data: [...] }` |
| **Permisos** | `Listar_ConRolAdmin_Devuelve200` | `GET /api/permisos` | 200 | `{ Success: true, Data: [...] }` |
| **Catálogos** | `BuscarCatalogo_ConToken_Devuelve200` | `GET /api/catalogos/RAMA` | 200 | `{ Success: true, Data: [...] }` |

**Total: 10 tests**

### Patrón Común

```csharp
[Fact]
public async Task Listar_ConToken_Devuelve200()
{
    var token = AuthHelper.GenerarTokenAdmin();
    _client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);

    var response = await _client.GetAsync("/api/{recurso}");

    response.StatusCode.Should().Be(HttpStatusCode.OK);
    var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
    body.Should().NotBeNull();
    body!.Success.Should().BeTrue();
    body.Data.Should().NotBeNull();
}
```

---

## 2. Obtener por ID (GET /api/{recurso}/{id})

### Registros que existen en la BD de prueba

| Controlador | Endpoint | ID Válido | Status Esperado |
|---|---|---|---|
| **Clientes** | `GET /api/clientes/1` | 1 | 200 |
| **Expedientes** | `GET /api/expedientes/1` | 1 | 200, 401 o 404 |
| **Audiencias** | `GET /api/audiencias/1` | 1 | 200 |
| **Usuarios** | `GET /api/usuarios/1` | 1 | 200 |
| **Permisos** | `GET /api/permisos/1` | 1 | 200 |
| **Catálogos** | `GET /api/catalogos/RAMA/1` | 1 | 200 |

### Registros inexistentes (404)

| Controlador | Endpoint | ID Inexistente | Status |
|---|---|---|---|
| **Clientes** | `GET /api/clientes/99999` | 99999 | 404 |
| **Expedientes** | `GET /api/expedientes/99999` | 99999 | 404 |
| **Audiencias** | `GET /api/audiencias/99999` | 99999 | 404 |
| **Trámites** | `GET /api/tramites/99999` | 99999 | 404 |
| **Diligencias** | `GET /api/diligencias/99999` | 99999 | 404 |
| **Notificaciones** | `GET /api/notificaciones/99999` | 99999 | 404 |
| **Usuarios** | `GET /api/usuarios/99999` | 99999 | 404 |
| **Catálogos** | `GET /api/catalogos/RAMA/99999` | 99999 | 404 |

### Tests de detalle con existentes

| Controlador | Método | Status | Validación Adicional |
|---|---|---|---|
| **Clientes** | `ObtenerPorId_ClienteExistente_DevuelveDetalle` | 200 | `Success == true`, `Data` no nula |
| **Expedientes** | `ObtenerPorId_ExpedienteExistente_DevuelveDetalle` | 200, 401 o 404 | `Success == true`, `Data` no nula |
| **Audiencias** | `ObtenerPorId_AudienciaExistente_DevuelveDetalle` | 200 | `Success == true`, `Data` no nula |
| **Trámites** | `ObtenerPorId_TramiteExistente_DevuelveDetalle` | 200 o 404 | Puede no existir en BD |
| **Diligencias** | `ObtenerPorId_DiligenciaExistente_Devuelve200` | 200 o 404 | Puede no existir en BD |
| **Notificaciones** | `ObtenerPorId_NotificacionExistente_Devuelve200` | 200 o 404 | Puede no existir en BD |
| **Permisos** | `ObtenerPorRol_RolExistente_Devuelve200` | 200 | Retorna lista por rol |
| **Permisos** | `ObtenerPorRol_RolInexistente_Devuelve200` | 200 o 404 | Lista vacía o 404 |

**Total: 28 tests** (14 existentes + 8 inexistentes + 6 sub-endpoints)

---

## 3. Sub-endpoints de Detalle

| Controlador | Método | Endpoint | Status | Qué Retorna |
|---|---|---|---|---|
| **Clientes** | `ObtenerExpedientes_ClienteExistente_Devuelve200` | `GET /api/clientes/1/expedientes` | 200 | Expedientes del cliente |
| **Expedientes** | `ObtenerPartes_ExpedienteExistente_Devuelve200` | `GET /api/expedientes/1/partes` | 200 | Partes del expediente |
| **Expedientes** | `ObtenerNotas_ExpedienteExistente_Devuelve200` | `GET /api/expedientes/1/notas` | 200 | Notas del expediente |
| **Expedientes** | `ObtenerDocumentos_ExpedienteExistente_Devuelve200` | `GET /api/expedientes/1/documentos` | 200 | Documentos del expediente |
| **Audiencias** | `Proximas_ConToken_Devuelve200` | `GET /api/audiencias/proximas?dias=30` | 200 | Próximas audiencias |
| **Eventos** | `ObtenerDelDia_ConToken_Devuelve200` | `GET /api/eventos/dia` | 200 | Eventos del día |
| **Eventos** | `ObtenerDelDia_ConFecha_Devuelve200` | `GET /api/eventos/dia?fecha=2026-09-16` | 200 | Eventos de fecha específica |
| **Usuarios** | `ListarRoles_ConToken_Devuelve200` | `GET /api/usuarios/roles` | 200 | Lista de roles |
| **Permisos** | `ObtenerPorRol_RolExistente_Devuelve200` | `GET /api/permisos/1` | 200 | Permisos del rol |
| **Permisos** | `ObtenerPorRol_SinAuth_Devuelve401` | `GET /api/permisos/1` | 401 | Sin auth |

**Total: 10 tests**

---

## 4. Crear Registros (POST)

| Controlador | Método | Endpoint | Status Esperado | Payload |
|---|---|---|---|---|
| **Clientes** | `Crear_ClienteValido_Devuelve201` | `POST /api/clientes` | 201, 401, 409 o 500 | `{ NombreCompleto, Dpi, Telefono, Email, Direccion, FechaNacimiento, Genero, TipoCliente }` |
| **Expedientes** | `Crear_ExpedienteValido_Devuelve201` | `POST /api/expedientes` | 201, 401, 409 o 500 | `{ ClienteId, RamaId, TipoProcesoId, JuzgadoId, Descripcion, NoExpediente }` |
| **Expedientes** | `CrearNota_ExpedienteValido_Devuelve201` | `POST /api/expedientes/1/notas` | 201, 401 o 500 | `{ Contenido, EtiquetaId, Prioritario }` |
| **Audiencias** | `Crear_AudienciaValida_Devuelve200` | `POST /api/audiencias` | 200, 401 o 500 | `{ ExpedienteId, TipoId, Fecha, HoraInicio, HoraFin, Lugar }` |
| **Trámites** | `Crear_TramiteValido_Devuelve200` | `POST /api/tramites` | ≠ 500 | `{ ExpedienteId, TipoId, Descripcion, InstitucionDestino }` |
| **Diligencias** | `Crear_DiligenciaValida_Devuelve200` | `POST /api/diligencias` | ≠ 500 | `{ ClienteId, TipoId, Descripcion, FechaVencimiento }` |
| **Notificaciones** | `Crear_NotificacionValida_NoDevuelveError500` | `POST /api/notificaciones` | ≠ 401/403 | `{ ExpedienteId, JuzgadoId, FechaRecepcion, TipoId, EstadoId, Contenido, Resumen, NumeroExpedienteOJ }` |
| **Eventos** | `Crear_EventoValido_Devuelve200` | `POST /api/eventos` | ≠ 500 | `{ Titulo, TipoEvento, FechaInicio, FechaFin, Descripcion }` |
| **Eventos** | `CrearAudiencia_EventoValido_Devuelve200` | `POST /api/eventos/audiencia` | ≠ 500 | `{ Titulo, TipoEvento, FechaInicio, FechaFin, ExpedienteId }` |
| **Catálogos** | `InsertarCatalogo_ConToken_Devuelve201` | `POST /api/catalogos/RAMA` | ≠ 500 | `{ Nombre, Descripcion, Color, Orden }` |

**Total: 10 tests**

### Notas sobre Status Codes de Escritura

- **201 Created**: Clientes, Expedientes, Notas (creación exitosa con entidad retornada)
- **200 OK**: Audiencias (retorna la entidad creada en el body)
- **≠ 500**: Trámites, Diligencias, Notificaciones, Eventos, Catálogos (aceptan cualquier status que no sea error interno, ya que pueden fallar por FK inexistentes)
- **409 Conflict**: Clientes y Expedientes pueden retornar este código si hay duplicidad de datos (DPI único, NoExpediente único)

---

## 5. Actualizar Registros (PUT)

| Controlador | Método | Endpoint | Status | Payload |
|---|---|---|---|---|
| **Perfil** | `Actualizar_ConToken_Devuelve204` | `PUT /api/perfil` | 204 NoContent | `{ NombreCompleto, Email, Telefono }` |
| **Notificaciones** | `Actualizar_NotificacionExistente_NoDevuelve500` | `PUT /api/notificaciones/{id}` | 204, 400 o 404 | `{ JuzgadoId, FechaRecepcion, TipoId, EstadoId, Resumen }` |
| **Notificaciones** | `Atender_NotificacionExistente_NoDevuelve500` | `PUT /api/notificaciones/{id}/atender` | 204, 400 o 404 | `{ Notas }` |

**Total: 3 tests**

> **Nota:** No existen tests de DELETE en la suite actual.

---

## Resumen por Controlador

| Controlador | Listar | Por ID | Sub-endpoints | Crear | Actualizar | Total |
|---|---|---|---|---|---|---|
| **Auth** | — | — | — | — | — | 7 (login/logout) |
| **Clientes** | 1 | 3 | 1 | 1 | — | 11 |
| **Expedientes** | 1 | 3 | 3 | 2 | — | 12 |
| **Audiencias** | 1 | 2 | 1 | 1 | — | 7 |
| **Trámites** | 1 | 2 | — | 1 | — | 7 |
| **Diligencias** | 1 | 2 | — | 1 | — | 7 |
| **Notificaciones** | 1 | 2 | 1 | 1 | 2 | 12 |
| **Eventos** | — | — | 2 | 2 | — | 5 |
| **Histórico** | 1 | — | — | — | — | 5* |
| **Reportes** | — | — | — | — | — | 14 |
| **Catálogos** | 1 | 2 | — | 1 | — | 10 |
| **Usuarios** | 1 | 2 | 1 | — | — | 7 |
| **Permisos** | 1 | 2 | — | — | — | 6 |
| **Perfil** | — | — | — | — | 1 | 4 |

*Incluye tests de filtrado y búsqueda*
