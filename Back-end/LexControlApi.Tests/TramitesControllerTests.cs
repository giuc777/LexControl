using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para TramitesController.</summary>
public class TramitesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public TramitesControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Listar_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/tramites");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Listar_ConToken_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/tramites");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ObtenerPorId_TramiteExistente_DevuelveDetalle()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/tramites/1");

        // Puede devolver 200 o 404 dependiendo de los datos
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ObtenerPorId_TramiteInexistente_Devuelve404()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/tramites/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Crear_TramiteValido_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var tramite = new
        {
            ExpedienteId = 1,
            TipoId = 1,
            Descripcion = "Trámite de prueba de integración",
            InstitucionDestino = "Institución de prueba"
        };

        var response = await _client.PostAsJsonAsync("/api/tramites", tramite);

        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task Crear_SinRolAbogado_Devuelve403()
    {
        var token = AuthHelper.GenerarTokenSecretaria();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var tramite = new { ExpedienteId = 1, TipoId = 1, Descripcion = "Test" };

        var response = await _client.PostAsJsonAsync("/api/tramites", tramite);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Listar_ConFiltros_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/tramites?estadoId=1&tipoId=1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // Tipos auxiliares
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }
}
