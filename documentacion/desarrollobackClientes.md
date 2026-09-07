# Desarrollo Backend — Módulo de Clientes

> Documentación del desarrollo del módulo **Clientes** en el backend (`LexControlApi`, .NET 10). Cubre SPs, DTOs, servicio, controlador y pruebas realizadas.
>
> **Fecha de implementación**: 31 de agosto de 2026

---

## 1. Archivos creados/modificados

| Archivo | Acción | Descripción |
|---|---|---|
| `Clientes_SP.sql` | **Nuevo** | 4 procedimientos almacenados nuevos para el módulo |
| `Dtos/Clientes/ClienteDtos.cs` | **Nuevo** | 9 clases DTO para el contrato frontend↔backend |
| `Services/ClienteService.cs` | **Nuevo** | Interface + implementación con 6 métodos |
| `Controllers/ClientesController.cs` | **Nuevo** | 7 endpoints REST |
| `Program.cs` | **Modificado** | Registro de `IClienteService` en DI |
| `Front-end/api.md` | **Modificado** | Documentación de endpoints de clientes agregada |

---

## 2. Procedimientos almacenados

### 2.1 SPs nuevos (Clientes_SP.sql)

| SP | Operación | Parámetros | Retorna |
|---|---|---|---|
| `SP_Cliente_Listar` | SELECT paginado con filtros | `@FiltroNombre`, `@FiltroEstado`, `@FiltroTipo`, `@Pagina`, `@TamanioPagina` | Filas + `@TotalRegistros` |
| `SP_Cliente_Estadisticas` | SELECT conteos | Ninguno | `TotalClientes`, `TotalInactivos`, `TotalExpedientesActivos`, `TotalExpedientes` |
| `SP_Cliente_ObtenerExpedientes` | SELECT expedientes de un cliente | `@ClienteID` | Filas con rama, estado, juzgado, última actuación |
| `SP_Cliente_Reactivar` | UPDATE Activo=1 | `@ID` | RETURN 0 / -1 |

### 2.2 SPs existentes utilizados (Extras_SP.sql + LexControlDB.sql)

| SP | Archivo | Operación |
|---|---|---|
| `SP_Cliente_Insertar` | LexControlDB.sql | CREATE (Persona + Cliente en transacción) |
| `SP_Cliente_ObtenerPorID` | LexControlDB.sql | READ by ID |
| `SP_Cliente_Buscar` | LexControlDB.sql | SEARCH con filtros (solo activos) |
| `SP_Cliente_Actualizar` | Extras_SP.sql | UPDATE (Persona + Cliente en transacción) |
| `SP_Cliente_Desactivar` | Extras_SP.sql | SOFT DELETE (Activo=0) |

### 2.3 Detalle de SP_Cliente_Listar

Este es el SP más complejo del módulo. Características:

- **Paginación server-side**: `OFFSET/FETCH` para no cargar todos los registros
- **Filtros opcionales**: nombre (LIKE), estado (activo/inactivo), tipo de cliente
- **Conteo de expedientes**: subquery LEFT JOIN con `EXPEDIENTE` y `ESTADO_EXPEDIENTE`
- **Última actividad**: `MAX(EX.FechaIngreso)` del último expediente ingresado
- **Total de registros**: variable `@TotalRegistros` para la paginación del frontend

```sql
-- Estructura simplificada del SP
SELECT
    C.ID AS ClienteID,
    P.NombreCompleto,
    P.DPI,
    -- ... campos de PERSONA y CLIENTE ...
    ISNULL(E.TotalExpedientes, 0) AS TotalExpedientes,
    ISNULL(E.ExpedientesActivos, 0) AS ExpedientesActivos,
    E.UltimaActividad,
    @TotalRegistros AS TotalRegistros
FROM CLIENTE C
INNER JOIN PERSONA P ON C.Persona_ID = P.ID
LEFT JOIN (
    SELECT Cliente_ID, COUNT(*), SUM(...), MAX(FechaIngreso)
    FROM EXPEDIENTE
    GROUP BY Cliente_ID
) E ON E.Cliente_ID = C.ID
WHERE -- filtros opcionales
ORDER BY P.NombreCompleto
OFFSET (@Pagina - 1) * @TamanioPagina ROWS
FETCH NEXT @TamanioPagina ROWS ONLY;
```

---

## 3. DTOs (Dtos/Clientes/ClienteDtos.cs)

### 3.1 Fila de mapeo Dapper

```csharp
public class ClienteFila          // Mapeo de SP_Cliente_Listar
public class ClienteDetalleFila   // Mapeo de SP_Cliente_ObtenerPorID
public class ClienteExpedienteFila // Mapeo de SP_Cliente_ObtenerExpedientes
```

### 3.2 DTOs de respuesta

```csharp
public class ClienteDto           // Listado (con conteos de expedientes)
public class ClienteDetalleDto    // Detalle (sin conteos)
public class EstadisticasClienteDto // Bento grid
public class ClienteExpedienteDto // Expedientes del cliente
```

### 3.3 DTOs de entrada

```csharp
public class ClienteCrearDto      // POST (NombreCompleto obligatorio)
public class ClienteActualizarDto // PUT (NombreCompleto obligatorio, resto opcional)
```

### 3.4 Mapeo de fechas

Las fechas se envían como strings ISO:
- `FechaNacimiento`: `"yyyy-MM-dd"` o null
- `FechaCreacion`: `"yyyy-MM-ddTHH:mm:ss"`
- `UltimaActividad`: `"yyyy-MM-dd"` o null

---

## 4. Servicio (Services/ClienteService.cs)

### 4.1 Interface

```csharp
public interface IClienteService
{
    Task<(List<ClienteDto> Clientes, int Total)> ListarAsync(
        string? filtroNombre, bool? filtroEstado, string? filtroTipo, int pagina, int tamanioPagina);
    Task<ClienteDetalleDto> ObtenerPorIdAsync(int id);
    Task<ClienteDto> CrearAsync(ClienteCrearDto datos);
    Task<ClienteDto> ActualizarAsync(int id, ClienteActualizarDto datos);
    Task ActivarDesactivarAsync(int id, bool activo);
    Task<EstadisticasClienteDto> ObtenerEstadisticasAsync();
    Task<List<ClienteExpedienteDto>> ObtenerExpedientesAsync(int clienteId);
}
```

### 4.2 Métodos implementados

| Método | SP utilizado | Lógica |
|---|---|---|
| `ListarAsync` | `SP_Cliente_Listar` | Retorna tupla (lista, total) para paginación |
| `ObtenerPorIdAsync` | `SP_Cliente_ObtenerPorID` | Excepción 404 si no existe |
| `CrearAsync` | `SP_Cliente_Insertar` | Llama a `InsertarAsync` con OUTPUT, luego `ObtenerClienteListadoAsync` |
| `ActualizarAsync` | `SP_Cliente_Actualizar` | Retorna 0=OK, -1=no existe, 2627=duplicado |
| `ActivarDesactivarAsync` | `SP_Cliente_Desactivar` o `SP_Cliente_Reactivar` | Decide SP según parámetro `activo` |
| `ObtenerEstadisticasAsync` | `SP_Cliente_Estadisticas` | Retorna primer fila |
| `ObtenerExpedientesAsync` | `SP_Cliente_ObtenerExpedientes` | Lista de expedientes del cliente |

### 4.3 Manejo de errores

| Retorno SP | Excepción | Código HTTP |
|---|---|---|
| 0 | Ninguno (éxito) | 200/204 |
| -1 | `ExcepcionNegocio` "Cliente no encontrado" | 404 |
| 2601 / 2627 | `ExcepcionNegocio` "Ya existe un cliente con esos datos" | 409 |
| Otro | `ExcepcionNegocio` "No se pudo completar la operación" | 500 |

---

## 5. Controlador (Controllers/ClientesController.cs)

### 5.1 Endpoints

| Método | Ruta | Auth | Body | Retorna |
|---|---|---|---|---|
| GET | `/api/clientes` | Token | — | 200 + `X-Total-Count` |
| GET | `/api/clientes/estadisticas` | Token | — | 200 |
| GET | `/api/clientes/{id}` | Token | — | 200 / 404 |
| GET | `/api/clientes/{id}/expedientes` | Token | — | 200 |
| POST | `/api/clientes` | Admin | `ClienteCrearDto` | 201 |
| PUT | `/api/clientes/{id}` | Admin | `ClienteActualizarDto` | 200 / 404 |
| PUT | `/api/clientes/{id}/estado` | Admin | `{ "activo": bool }` | 204 / 404 |

### 5.2 Autorización

- **Lectura** (GET): cualquier usuario autenticado
- **Escritura** (POST, PUT): solo rol `Administrador`
- `[Authorize]` a nivel de controller, `[Authorize(Roles = "Administrador")]` en métodos de escritura

---

## 6. Registro en Program.cs

```csharp
// Agregado en la sección de Inyección de dependencias
builder.Services.AddScoped<IClienteService, ClienteService>();
```

---

## 7. Pruebas realizadas

Todas las pruebas se ejecutaron con PowerShell contra `http://localhost:5181`.

### 7.1 Resultados

| # | Endpoint | Método | Resultado |
|---|---|---|---|
| 1 | `POST /api/auth/login` | Login admin | ✅ Token JWT |
| 2 | `GET /api/clientes` | Listar (vacío) | ✅ Array vacío |
| 3 | `POST /api/clientes` | Crear "Carlos Morales Ortiz" | ✅ ID 1 |
| 4 | `GET /api/clientes` | Listar (1 cliente) | ✅ 1 registro |
| 5 | `GET /api/clientes/1` | Obtener por ID | ✅ Detalle completo |
| 6 | `GET /api/clientes/estadisticas` | Estadísticas | ✅ totalClientes: 1 |
| 7 | `GET /api/clientes/1/expedientes` | Expedientes | ✅ Array vacío |
| 8 | `PUT /api/clientes/1` | Actualizar datos | ✅ Datos modificados |
| 9 | `PUT /api/clientes/1/estado` | Desactivar (activo=false) | ✅ 204 No Content |
| 10 | `GET /api/clientes?filtroEstado=true` | Filtrar activos | ✅ 0 resultados |
| 11 | `GET /api/clientes?filtroEstado=false` | Filtrar inactivos | ✅ 1 resultado |
| 12 | `GET /api/clientes?filtroNombre=Maria` | Buscar por nombre | ✅ 1 resultado |
| 13 | `POST /api/clientes` | Crear "Maria Fernanda Lopez" | ✅ ID 2 |
| 14 | `PUT /api/clientes/1/estado` | Reactivar (activo=true) | ✅ 204 No Content |
| 15 | `GET /api/clientes?filtroTipo=Empresa` | Filtrar por tipo | ✅ 1 resultado |
| 16 | `GET /api/clientes/estadisticas` | Estadísticas finales | ✅ 2 clientes, 0 inactivos |

### 7.2 Scripts SQL ejecutados

1. `Clientes_SP.sql` — 4 SPs nuevos (Listar, Estadísticas, ObtenerExpedientes, Reactivar)
2. `Extras_SP.sql` — 2 SPs existentes (Actualizar, Desactivar)

### 7.3 Issues encontrados y resueltos

| Issue | Causa | Solución |
|---|---|---|
| PUT y DELETE retornaban 500 | `SP_Cliente_Actualizar` y `SP_Cliente_Desactivar` no existían en la BD | Ejecutar `Extras_SP.sql` |
| Reactivar cliente retornaba 400 | No existía `SP_Cliente_Reactivar` | Crear SP + actualizar `ClienteService` |
| POST desde PowerShell fallaba 400 | `ConvertTo-Json` de PowerShell generaba encoding incorrecto | Usar `[System.Text.Encoding]::UTF8.GetBytes($json)` |

---

## 8. Próximos pasos

1. **Frontend**: Crear `cliente.model.ts`, `clientes-service.ts` y componentes `features/clientes/`
2. **Seed de datos**: Insertar clientes de prueba para desarrollo
3. **Notas de cliente**: Crear SP `SP_NotaCliente_Listar` y endpoints anidados
4. **Reactivar desde frontend**: El botón "Activar" en la tabla de clientes debe llamar `PUT /api/clientes/{id}/estado { "activo": true }`
5. **Paginación**: El frontend debe leer el header `X-Total-Count` para renderizar la paginación
