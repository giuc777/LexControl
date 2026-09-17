using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para UsuariosController.</summary>
public class UsuariosControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public UsuariosControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Listar_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/usuarios");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Listar_SinRolAdmin_Devuelve403()
    {
        var token = AuthHelper.GenerarTokenAbogado();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/usuarios");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Listar_ConRolAdmin_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/usuarios");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ListarRoles_ConToken_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/usuarios/roles");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ObtenerPorId_UsuarioExistente_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/usuarios/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ObtenerPorId_UsuarioInexistente_Devuelve404()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/usuarios/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Listar_ConFiltros_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/usuarios?filtroNombre=admin&rolId=1&activo=true");

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
