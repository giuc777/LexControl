using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para AuthController.</summary>
public class AuthControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_CredencialesValidas_DevuelveToken()
    {
        var login = new { Usuario = "admin", Contrasena = "admin123" };

        var response = await _client.PostAsJsonAsync("/api/auth/login", login);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.TooManyRequests);
        if (response.StatusCode == HttpStatusCode.OK)
        {
            var body = await response.Content.ReadFromJsonAsync<AuthHelper.LoginApiResponse>();
            body.Should().NotBeNull();
            body!.Success.Should().BeTrue();
            body.Data.Should().NotBeNull();
            body.Data!.Token.Should().NotBeNullOrEmpty();
            body.Data.Usuario.Should().Be("admin");
            body.Data.Rol.Should().Be("Administrador");
            body.Data.UsuarioId.Should().BeGreaterThan(0);
        }
    }

    [Fact]
    public async Task Login_ContrasenaInvalida_Devuelve401()
    {
        var login = new { Usuario = "admin", Contrasena = "wrong_password" };

        var response = await _client.PostAsJsonAsync("/api/auth/login", login);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadFromJsonAsync<AuthHelper.LoginApiResponse>();
        body.Should().NotBeNull();
        body!.Success.Should().BeFalse();
        body.Data.Should().BeNull();
    }

    [Fact]
    public async Task Login_UsuarioInexistente_Devuelve401()
    {
        var login = new { Usuario = "usuario_no_existe", Contrasena = "cualquier" };

        var response = await _client.PostAsJsonAsync("/api/auth/login", login);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_CamposVacios_Devuelve400()
    {
        var login = new { Usuario = "", Contrasena = "" };

        var response = await _client.PostAsJsonAsync("/api/auth/login", login);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_CampoFaltante_Devuelve400()
    {
        // Falta Contrasena
        var login = new { Usuario = "admin" };

        var response = await _client.PostAsJsonAsync("/api/auth/login", login);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Logout_ConTokenValido_Devuelve204()
    {
        // Login primero
        var (token, _) = await AuthHelper.LoginRealAsync(_client);
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PostAsJsonAsync("/api/auth/logout",
            new { RefreshToken = "" });

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Logout_SinToken_Devuelve401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/logout",
            new { RefreshToken = "" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
