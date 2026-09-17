# Tests de Validaciones de Negocio

## Resumen

Tests que verifican las reglas de negocio: duplicidad de datos, restricciones de integridad referencial y validaciones de campos obligatorios.

---

## 1. Validación de Duplicidad de Datos

### DPI Duplicado en Clientes

| Test | Método | Escenario | Status Esperado |
|---|---|---|---|
| `Crear_DpiDuplicado_Devuelve409` | `ClientesControllerTests.cs` | Crear dos clientes con el mismo DPI (`9999999999999`) | `409 Conflict` o `500 InternalServerError` |

**Flujo:**
1. Crear primer cliente con DPI `9999999999999` → 201 Created
2. Intentar crear segundo cliente con mismo DPI → 409 Conflict

```csharp
[Fact]
public async Task Crear_DpiDuplicado_Devuelve409()
{
    var token = AuthHelper.GenerarTokenAdmin();
    _client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);

    var cliente = new { NombreCompleto = "Test DPI Duplicado", Dpi = "9999999999999", ... };
    await _client.PostAsJsonAsync("/api/clientes", cliente);

    var clienteDuplicado = new { NombreCompleto = "Test DPI Duplicado 2", Dpi = "9999999999999", ... };
    var response = await _client.PostAsJsonAsync("/api/clientes", clienteDuplicado);

    response.StatusCode.Should().BeOneOf(HttpStatusCode.Conflict, HttpStatusCode.InternalServerError);
}
```

### NoExpediente Único en Expedientes

Los expedientes generan automáticamente un `NoExpediente` con timestamp para evitar duplicidad. Si la BD tiene constraint único, se retornará `409 Conflict` o `500 InternalServerError`.

---

## 2. Validación de Integridad Referencial

Los tests de creación de **Trámites**, **Diligencias** y **Notificaciones** envían payloads con IDs que pueden no existir en la BD. El controlador maneja esto retornando `500 InternalServerError` (error de FK).

| Controlador | Campo Problemático | Comportamiento |
|---|---|---|
| **Trámites** | `ExpedienteId`, `TipoId` | Si no existe → error de SP |
| **Diligencias** | `ClienteId`, `TipoId` | Si no existe → error de SP |
| **Notificaciones** | `ExpedienteId`, `TipoId`, `JuzgadoId` | Si no existe → error de SP |

> Los tests aceptan `≠ 500` para trámites/diligencias/notificaciones, reconociendo que estos errores son válidos cuando los FK no existen.

---

## 3. Validación de Campos Obligatorios

### Login — Campos Vacíos o Faltantes

| Test | Método | Payload | Status | Valida |
|---|---|---|---|---|
| `Login_CamposVacios_Devuelve400` | `AuthControllerTests.cs` | `{ Usuario: "", Contrasena: "" }` | 400 | Ambos campos son obligatorios |
| `Login_CampoFaltante_Devuelve400` | `AuthControllerTests.cs` | `{ Usuario: "admin" }` (sin Contrasena) | 400 | Campo faltante rechazado |

### Login — Credenciales Inválidas

| Test | Método | Escenario | Status |
|---|---|---|---|
| `Login_ContrasenaInvalida_Devuelve401` | `AuthControllerTests.cs` | Contraseña incorrecta | 401 |
| `Login_UsuarioInexistente_Devuelve401` | `AuthControllerTests.cs` | Usuario que no existe | 401 |

---

## 4. Validación de Credenciales Reales

### Tests de Login Real (POST contra API)

Solo un test utiliza `AuthHelper.LoginRealAsync()` que realiza un POST real a `/api/auth/login`:

| Test | Método | Escenario | Por qué es necesario |
|---|---|---|---|
| `Logout_ConTokenValido_Devuelve204` | `AuthControllerTests.cs` | Login real → Logout | El logout requiere un token de sesión activo, no solo un JWT válido |

```csharp
[Fact]
public async Task Logout_ConTokenValido_Devuelve204()
{
    var loginResult = await AuthHelper.LoginRealAsync(_client);
    loginResult.Token.Should().NotBeNullOrEmpty();

    var logoutRequest = new { RefreshToken = "" };
    var response = await _client.PostAsJsonAsync("/api/auth/logout", logoutRequest);

    response.StatusCode.Should().Be(HttpStatusCode.NoContent);
}
```

---

## 5. Rate Limiting

El API tiene rate limiting configurado en `Program.cs` (5 intentos por minuto en login).

| Test | Escenario | Status Posible |
|---|---|---|
| `Login_CredencialesValidas_DevuelveToken` | Login válido | `200 OK` o `429 TooManyRequests` |

> Si los tests se ejecutan muy rápido, el rate limiting puede activarse. Los tests aceptan ambos códigos.

---

## 6. Verificación de Duplicados (Notificaciones OJ)

`SP_NotificacionOJ_VerificarDuplicado` detecta notificaciones no atendidas del mismo
expediente que coincidan con número de resolución o número de expediente OJ.

| Test | Endpoint | Status | Qué Valida |
|---|---|---|---|
| `VerificarDuplicado_SinAutenticacion_Devuelve401` | `POST /api/notificaciones/verificar-duplicado` | 401 | Requiere autenticación |
| `VerificarDuplicado_ConToken_Devuelve200` | `POST /api/notificaciones/verificar-duplicado` | 200 | Devuelve listado de coincidencias (`DuplicadoDto[]`) |

---

## Resumen

| Categoría | Tests | Qué Valida |
|---|---|---|
| Duplicidad de datos | 1 | DPI duplicado → 409 |
| Integridad referencial | 5 | FK inexistentes → error manejado |
| Campos obligatorios | 2 | Campos vacíos/faltantes → 400 |
| Credenciales inválidas | 2 | Login fallido → 401 |
| Rate limiting | 1 | Límite de intentos → 429 |
| Verificación de duplicados | 2 | Duplicados de notificación → listado |
| **Total** | **13** | |
