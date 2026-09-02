using LexControlApi.Data;
using LexControlApi.Middleware;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- Servicios ---

builder.Services.AddControllers();

// Documentación OpenAPI + Swagger UI (pruebas en desarrollo)
builder.Services.AddOpenApi(opciones =>
{
    // Esquema Bearer para el botón "Authorize" de Swagger UI
    opciones.AddDocumentTransformer((documento, _, _) =>
    {
        documento.Components ??= new OpenApiComponents();
        documento.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        documento.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Pegue el token devuelto por POST /api/auth/login."
        };

        var referencia = new OpenApiSecuritySchemeReference("Bearer", documento);
        documento.Security ??= new List<OpenApiSecurityRequirement>();
        documento.Security.Add(new OpenApiSecurityRequirement
        {
            [referencia] = new List<string>()
        });
        return Task.CompletedTask;
    });
});
builder.Services.AddEndpointsApiExplorer();

// CORS para el frontend SPA
const string PoliticaCors = "LexControlCors";
builder.Services.AddCors(opciones =>
{
    opciones.AddPolicy(PoliticaCors, policy =>
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:4200",
                "http://localhost:3000",
                "http://localhost:8080")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Autenticación JWT
var seccionJwt = builder.Configuration.GetSection("Jwt");
var secreto = seccionJwt["Secret"] ?? Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrEmpty(secreto) || secreto.Length < 32)
    throw new InvalidOperationException("La clave 'Jwt:Secret' es obligatoria (mínimo 32 caracteres).");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opciones =>
    {
        opciones.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = seccionJwt["Issuer"],
            ValidateAudience = true,
            ValidAudience = seccionJwt["Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secreto)),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name
        };
    });
builder.Services.AddAuthorization();

// Errores de validación de DTOs con el formato ApiResponse del API
builder.Services.Configure<ApiBehaviorOptions>(opciones =>
    opciones.InvalidModelStateResponseFactory = contexto =>
    {
        var errores = contexto.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Distinct()
            .ToList();
        return new BadRequestObjectResult(
            new { success = false, error = string.Join(" ", errores) });
    });

// Inyección de dependencias
builder.Services.AddSingleton<IConnectionFactory, SqlConnectionFactory>();
builder.Services.AddScoped<IRepositorio, RepositorioSql>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IPerfilService, PerfilService>();
builder.Services.AddScoped<IPermisoService, PermisoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IExpedienteService, ExpedienteService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();

// Limite de upload: 50 MB
builder.WebHost.ConfigureKestrel(opciones =>
    opciones.Limits.MaxRequestBodySize = 50 * 1024 * 1024);

var app = builder.Build();

// --- Pipeline ---

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(opciones =>
    {
        opciones.SwaggerEndpoint("/openapi/v1.json", "LexControl API v1");
        opciones.DocumentTitle = "LexControl API";
        opciones.DisplayRequestDuration();
    });
}

app.UseMiddleware<ManejadorExcepciones>();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors(PoliticaCors);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
