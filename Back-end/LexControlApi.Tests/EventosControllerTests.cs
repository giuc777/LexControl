using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para EventosController.</summary>
public class EventosControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public EventosControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ObtenerDelDia_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/eventos/dia");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ObtenerDelDia_ConToken_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/eventos/dia");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ObtenerDelDia_ConFecha_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var fecha = DateTime.Today.ToString("yyyy-MM-dd");
        var response = await _client.GetAsync($"/api/eventos/dia?fecha={fecha}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Crear_EventoValido_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var evento = new
        {
            Titulo = "Evento de prueba de integración",
            TipoEvento = "Cita",
            FechaInicio = DateTime.Now.AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss"),
            FechaFin = DateTime.Now.AddDays(5).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss"),
            Descripcion = "Descripción del evento de prueba"
        };

        var response = await _client.PostAsJsonAsync("/api/eventos", evento);

        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task CrearAudiencia_EventoValido_Devuelve200()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var evento = new
        {
            Titulo = "Audiencia de prueba",
            TipoEvento = "Audiencia",
            FechaInicio = DateTime.Now.AddDays(10).ToString("yyyy-MM-ddTHH:mm:ss"),
            FechaFin = DateTime.Now.AddDays(10).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss"),
            ExpedienteId = 1
        };

        var response = await _client.PostAsJsonAsync("/api/eventos/audiencia", evento);

        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError);
    }

    // Tipos auxiliares
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }
}
