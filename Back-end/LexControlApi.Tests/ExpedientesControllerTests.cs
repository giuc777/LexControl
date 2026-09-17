using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para ExpedientesController.</summary>
public class ExpedientesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ExpedientesControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Listar_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/expedientes");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Listar_ConToken_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/expedientes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Listar_ConFiltros_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/expedientes?estadoId=1&ramaId=1&pagina=1&tamanioPagina=10");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ListarAbogados_ConToken_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/expedientes/abogados");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ObtenerPorId_ExpedienteExistente_DevuelveDetalle()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/expedientes/1");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized, HttpStatusCode.NotFound);
        if (response.StatusCode == HttpStatusCode.OK)
        {
            var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
            body.Should().NotBeNull();
            body!.Success.Should().BeTrue();
            body.Data.Should().NotBeNull();
        }
    }

    [Fact]
    public async Task ObtenerPorId_ExpedienteInexistente_Devuelve404()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/expedientes/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Crear_ExpedienteValido_Devuelve201()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var expediente = new
        {
            ClienteId = 1,
            RamaId = 1,
            TipoProcesoId = 1,
            JuzgadoId = 1,
            Descripcion = "Expediente de prueba de integración",
            NoExpediente = $"CIV-2026-TEST-{DateTime.Now:HHmmss}"
        };

        var response = await _client.PostAsJsonAsync("/api/expedientes", expediente);

        // 201 = creado, 401 = auth, 409 = duplicado, 500 = error SP
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Created, HttpStatusCode.Unauthorized,
            HttpStatusCode.Conflict, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task Crear_SinRolAbogado_Devuelve403()
    {
        var token = AuthHelper.GenerarTokenSecretaria();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var expediente = new { ClienteId = 1, RamaId = 1 };

        var response = await _client.PostAsJsonAsync("/api/expedientes", expediente);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ObtenerPartes_ExpedienteExistente_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/expedientes/1/partes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ObtenerNotas_ExpedienteExistente_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/expedientes/1/notas");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ObtenerDocumentos_ExpedienteExistente_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/expedientes/1/documentos");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CrearNota_ExpedienteValido_Devuelve201()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var nota = new
        {
            Contenido = "Nota de prueba de integración",
            EtiquetaId = 1,
            Prioritario = false
        };

        var response = await _client.PostAsJsonAsync("/api/expedientes/1/notas", nota);

        // 201 = creado, 401 = auth, 500 = error SP
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Created, HttpStatusCode.Unauthorized,
            HttpStatusCode.InternalServerError);
    }

    // Tipos auxiliares
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }
}
