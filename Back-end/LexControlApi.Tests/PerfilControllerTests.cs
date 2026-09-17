using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para PerfilController.</summary>
public class PerfilControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PerfilControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Obtener_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/perfil");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Obtener_ConToken_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/perfil");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task Obtener_ConTokenAbogado_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAbogado();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/perfil");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Actualizar_ConToken_Devuelve204()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var datos = new
        {
            NombreCompleto = "Administrador Actualizado",
            Email = "admin.updated@email.com",
            Telefono = "+502 5555-0000"
        };

        var response = await _client.PutAsJsonAsync("/api/perfil", datos);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // Tipos auxiliares
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }
}
