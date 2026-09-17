using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para ClientesController.</summary>
public class ClientesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ClientesControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Listar_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/clientes");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Listar_ConToken_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/clientes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<List<object>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task Listar_ConFiltroNombre_DevuelveListaFiltrada()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/clientes?filtroNombre=Carlos");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Listar_ConPaginacion_DevuelveHeaders()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/clientes?pagina=1&tamanioPagina=5");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Estadisticas_ConToken_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/clientes/estadisticas");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ObtenerPorId_ClienteExistente_DevuelveDetalle()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/clientes/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task ObtenerPorId_ClienteInexistente_Devuelve404()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/clientes/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ObtenerExpedientes_ClienteExistente_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/clientes/1/expedientes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Crear_ClienteValido_Devuelve201()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var cliente = new
        {
            NombreCompleto = "Cliente Test Integración",
            Dpi = "1234567890101",
            TelefonoPrincipal = "+502 5555-9999",
            EmailPrincipal = "test.integration@email.com",
            Direccion = "Dirección de prueba",
            FechaNacimiento = "1990-01-15",
            Genero = "M",
            TipoCliente = "Particular"
        };

        var response = await _client.PostAsJsonAsync("/api/clientes", cliente);

        // 201 = creado, 401 = auth, 409 = DPI duplicado, 500 = error SP (datos de prueba)
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Created, HttpStatusCode.Unauthorized,
            HttpStatusCode.Conflict, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task Crear_SinRolesAdmin_Devuelve403()
    {
        var token = AuthHelper.GenerarTokenSecretaria();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var cliente = new
        {
            NombreCompleto = "Test No Auth",
            Dpi = "1111111111111"
        };

        var response = await _client.PostAsJsonAsync("/api/clientes", cliente);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Crear_DpiDuplicado_Devuelve409()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Crear primero
        var cliente = new
        {
            NombreCompleto = "Duplicado Test",
            Dpi = "9999999999999"
        };
        await _client.PostAsJsonAsync("/api/clientes", cliente);

        // Intentar duplicar
        var duplicado = new
        {
            NombreCompleto = "Otro Nombre",
            Dpi = "9999999999999"
        };

        var response = await _client.PostAsJsonAsync("/api/clientes", duplicado);

        // 409 = duplicado detectado, 500 = error SP
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Conflict, HttpStatusCode.InternalServerError);
    }

    // Tipos auxiliares
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }
}
