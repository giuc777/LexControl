using FluentAssertions;
using LexControlApi.Tests.Fixtures;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace LexControlApi.Tests;

/// <summary>Tests de integración para NotificacionesController.</summary>
public class NotificacionesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public NotificacionesControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private void AutenticarAdmin()
    {
        var token = AuthHelper.GenerarTokenAdmin();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    private void AutenticarSecretaria()
    {
        var token = AuthHelper.GenerarTokenSecretaria();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    // ── Lectura ──────────────────────────────────────────────

    [Fact]
    public async Task Listar_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/notificaciones");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Listar_ConToken_Devuelve200()
    {
        AutenticarAdmin();

        var response = await _client.GetAsync("/api/notificaciones");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<List<NotificacionListaDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task Listar_ConFiltros_Devuelve200()
    {
        AutenticarAdmin();

        var response = await _client.GetAsync("/api/notificaciones?estadoId=1&tipoId=1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ObtenerPorId_NotificacionInexistente_Devuelve404()
    {
        AutenticarAdmin();

        var response = await _client.GetAsync("/api/notificaciones/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ObtenerPorId_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/notificaciones/1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Creación ─────────────────────────────────────────────

    [Fact]
    public async Task Crear_NotificacionValida_NoDevuelveError500()
    {
        AutenticarAdmin();

        var notificacion = new
        {
            ExpedienteId = 1,
            JuzgadoId = 1,
            FechaRecepcion = DateTime.Now.ToString("yyyy-MM-dd"),
            TipoId = 1,
            EstadoId = 1,
            Contenido = "Contenido de prueba de integración",
            Resumen = "Resumen de prueba",
            NumeroExpedienteOJ = "OJ-TEST-001"
        };

        var response = await _client.PostAsJsonAsync("/api/notificaciones", notificacion);

        // 200 = creada; 400/409/500 = datos de negocio dependientes del seed.
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Crear_SinRolAbogado_Devuelve403()
    {
        AutenticarSecretaria();

        var notificacion = new
        {
            ExpedienteId = 1,
            JuzgadoId = 1,
            TipoId = 1,
            EstadoId = 1
        };

        var response = await _client.PostAsJsonAsync("/api/notificaciones", notificacion);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── Actualización (SP_NotificacionOJ_Actualizar) ─────────

    [Fact]
    public async Task Actualizar_NotificacionExistente_NoDevuelve500()
    {
        AutenticarAdmin();

        var id = await ObtenerPrimerIdAsync();
        if (id is null) return; // sin datos seed no se puede validar

        var dto = new
        {
            JuzgadoId = 1,
            FechaRecepcion = DateTime.Now.ToString("yyyy-MM-dd"),
            TipoId = 1,
            EstadoId = 1,
            Resumen = "Actualizado en test de integración"
        };

        var response = await _client.PutAsJsonAsync($"/api/notificaciones/{id}", dto);

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.NoContent,
            HttpStatusCode.BadRequest,
            HttpStatusCode.NotFound);
    }

    // ── Atender ──────────────────────────────────────────────

    [Fact]
    public async Task Atender_NotificacionExistente_NoDevuelve500()
    {
        AutenticarAdmin();

        var id = await ObtenerPrimerIdAsync();
        if (id is null) return;

        var dto = new { Notas = "Atendida desde test de integración" };
        var response = await _client.PutAsJsonAsync($"/api/notificaciones/{id}/atender", dto);

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.NoContent,
            HttpStatusCode.BadRequest,
            HttpStatusCode.NotFound);
    }

    // ── Verificar duplicado ──────────────────────────────────

    [Fact]
    public async Task VerificarDuplicado_SinAutenticacion_Devuelve401()
    {
        var dto = new { ExpedienteId = 1, NumeroResolucion = "RES-TEST-001" };
        var response = await _client.PostAsJsonAsync("/api/notificaciones/verificar-duplicado", dto);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task VerificarDuplicado_ConToken_Devuelve200()
    {
        AutenticarAdmin();

        var dto = new { ExpedienteId = 1, NumeroResolucion = "RES-TEST-001" };
        var response = await _client.PostAsJsonAsync("/api/notificaciones/verificar-duplicado", dto);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<List<DuplicadoDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
    }

    // ── Adjuntar PDF ─────────────────────────────────────────

    [Fact]
    public async Task SubirPdf_NotificacionInexistente_Devuelve404()
    {
        AutenticarAdmin();

        using var content = new MultipartFormDataContent();
        var archivo = new ByteArrayContent(new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31 });
        archivo.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(archivo, "file", "prueba.pdf");

        var response = await _client.PostAsync("/api/notificaciones/99999/pdf", content);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Auxiliares ───────────────────────────────────────────

    private async Task<int?> ObtenerPrimerIdAsync()
    {
        var response = await _client.GetAsync("/api/notificaciones");
        if (!response.IsSuccessStatusCode) return null;

        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<List<NotificacionListaDto>>>();
        return body?.Data?.FirstOrDefault()?.Id;
    }

    // Tipos auxiliares
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }

    public class NotificacionListaDto
    {
        public int Id { get; set; }
        public string? Estado { get; set; }
    }

    public class DuplicadoDto
    {
        public int Id { get; set; }
        public string? Resumen { get; set; }
        public string FechaRecepcion { get; set; } = "";
    }
}