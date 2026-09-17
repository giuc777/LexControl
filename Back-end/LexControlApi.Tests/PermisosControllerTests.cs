using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para PermisosController.</summary>
public class PermisosControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PermisosControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Listar_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/permisos");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Listar_SinRolAdmin_Devuelve403()
    {
        var token = AuthHelper.GenerarTokenAbogado();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/permisos");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Listar_ConRolAdmin_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/permisos");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ObtenerPorRol_RolExistente_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/permisos/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ObtenerPorRol_RolInexistente_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/permisos/99999");

        // Puede devolver 200 con lista vacía o 404
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ObtenerPorRol_SinAuth_Devuelve401()
    {
        var response = await _client.GetAsync("/api/permisos/1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // Tipos auxiliares
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }
}
