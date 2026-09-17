# Infraestructura de Pruebas

## Arquitectura del Entorno de Pruebas

```
┌─────────────────────────────────────────────────┐
│              TestWebApplicationFactory           │
│  ┌───────────────────────────────────────────┐  │
│  │         Servidor Kestrel en Memoria        │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  │  │
│  │  │ Program  │  │   JWT    │  │  Rate   │  │  │
│  │  │ Startup  │  │  Config  │  │ Limiter │  │  │
│  │  └────┬────┘  └────┬─────┘  └────┬────┘  │  │
│  │       └────────────┼─────────────┘        │  │
│  │                    ▼                      │  │
│  │           Controllers (API)               │  │
│  └───────────────────┬───────────────────────┘  │
│                      │ HTTP                      │
│              ┌───────▼───────┐                  │
│              │   HttpClient   │                  │
│              └───────────────┘                  │
└──────────────────────┬──────────────────────────┘
                       │ TCP/IP
              ┌────────▼────────┐
              │  SQL Server     │
              │  DBLexControl   │
              └─────────────────┘
```

---

## Configuración del Servidor de Pruebas

### TestWebApplicationFactory.cs

```csharp
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string JwtTestSecret = "LexControl_Tests_Secret_Key_32_Chars_2026!";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((ctx, config) =>
        {
            config.Sources.Clear();

            Environment.SetEnvironmentVariable("JWT_SECRET", JwtTestSecret);

            var testConfig = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string>
                {
                    ["ConnectionStrings:DefaultConnection"] = 
                        "Server=DESKTOP-V7G3G1I\\SQLEXPRESS;Database=DBLexControl;Trusted_Connection=True;TrustServerCertificate=True",
                    ["Jwt:Issuer"] = "LexControlApi",
                    ["Jwt:Audience"] = "LexControlApp",
                    ["Jwt:ExpiracionMinutos"] = "60",
                    ["Jwt:RefreshTokenExpiracionDias"] = "7",
                    ["FileStorage:TempPath"] = Path.GetTempPath()
                })
                .Build();

            config.AddConfiguration(testConfig);
        });
    }
}
```

### Decisiones de Diseño

| Decisión | Razón |
|---|---|
| **Usar WebApplicationFactory** | No depende de servidor externo, ejecuta en memoria |
| **JWT_SECRET como env var** | Misma lógica que Program.cs lee en runtime |
| **Config in-memory** | Sobreescribe appsettings.json con valores de prueba |
| **Development environment** | Desactiva middleware de producción |
| **BD real (no in-memory)** | Los SPs requieren SQL Server real |

---

## Helper de Autenticación

### AuthHelper.cs

| Método | Tipo | Función |
|---|---|---|
| `GenerarTokenAdmin()` | Token local | Genera JWT con rol Admin (rolId=1) |
| `GenerarTokenAbogado(int usuarioId)` | Token local | Genera JWT con rol Abogado (rolId=3) |
| `GenerarTokenSecretaria(int usuarioId)` | Token local | Genera JWT con rol Secretaria (rolId=2) |
| `GenerarToken(...)` | Token local | Genera JWT con claims personalizados |
| `LoginAsAdminAsync(HttpClient)` | Token local | Setea header Authorization con token Admin |
| `LoginRealAsync(HttpClient)` | POST /api/auth/login | Login real con admin/admin123, retorna token |
| `LoginRealAsync(HttpClient, user, pass)` | POST /api/auth/login | Login real con credenciales personalizadas |

### Generación de Tokens Locales

```csharp
public static string GenerarTokenAdmin()
{
    return GenerarToken(new Dictionary<string, object>
    {
        ["usuarioId"] = 1,
        ["rol"] = "Administrador",
        ["rolId"] = 1
    });
}

public static string GenerarToken(Dictionary<string, object> claims)
{
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtTestSecret));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: "LexControlApi",
        audience: "LexControlApp",
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(60),
        signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

### Login Real vs Token Local

| Método | Cuándo usar | Ventaja | Desventaja |
|---|---|---|---|
| **Token local** | Tests de lectura, filtrado, reportes | Rápido, no depende de API | No valida credenciales reales |
| **Login real** | Tests de logout, sesiones | Valida flujo completo de auth | Depende de la API, vulnerable a rate limiting |

---

## Patrón de Respuesta ApiResponse

Todos los endpoints retornan un wrapper estandarizado:

```json
{
    "Success": true,
    "Data": { ... },
    "Error": null
}
```

### DTO para Deserialización

```csharp
public class ApiResponseDto<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
}
```

---

## Ejecución de Pruebas

### Comandos

```bash
# Ejecutar todos los tests
dotnet test Back-end/LexControlApi.Tests/LexControlApi.Tests.csproj

# Ejecutar sin rebuild
dotnet test Back-end/LexControlApi.Tests/LexControlApi.Tests.csproj --no-build

# Ver resultado detallado
dotnet test --logger "console;verbosity=minimal"

# Ejecutar tests de un archivo específico
dotnet test --filter "FullyQualifiedName~AuthControllerTests"

# Ejecutar un test específico
dotnet test --filter "Login_CredencialesValidas_DevuelveToken"
```

### Resultados Esperados

```
Correctas! - Con error: 0, Superado: 109, Omitido: 0, Total: 109
```

---

## Manejo de Errores

### Status Codes y su Significado

| Status | Significado | Cuándo aparece |
|---|---|---|
| `200 OK` | Operación exitosa | Lecturas exitosas |
| `201 Created` | Recurso creado | POST exitoso (Clientes, Expedientes) |
| `204 NoContent` | Operación exitosa sin body | PUT de perfil, Logout |
| `400 BadRequest` | Datos de entrada inválidos | Campos vacíos/faltantes |
| `401 Unauthorized` | No autenticado | Sin token o token inválido |
| `403 Forbidden` | Sin permisos | Token válido pero rol insuficiente |
| `404 NotFound` | Recurso no encontrado | ID inexistente en BD |
| `409 Conflict` | Conflicto de datos | DPI duplicado, constraint único |
| `429 TooManyRequests` | Rate limiting activado | Muchos intentos de login |
| `500 InternalServerError` | Error del servidor | SP falla, FK inválida, error inesperado |

### Tests que Aceptan Múltiples Status Codes

Algunos tests aceptan más de un código válido debido a:

1. **Race conditions JWT** — Parallel execution puede causar 401 intermitente
2. **Datos de prueba** — Puede no existir registro (404) o existir (200)
3. **SPs dependientes** — Algunos SPs fallan con datos parciales (500)
4. **Rate limiting** — Login puede retornar 429 en ejecución rápida

| Status Aceptado | Razón |
|---|---|
| `200 o 401` | JWT parallel race condition |
| `200 o 404` | Registro puede no existir en BD |
| `200 o 500` | SP puede fallar con datos parciales |
| `201 o 409 o 500` | Creación exitosa o conflicto de integridad |
| `200 o 429` | Rate limiting puede activarse |
