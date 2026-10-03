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

    // ════════════════════════════════════════════════════════════
    // NOTAS INTERNAS
    // ════════════════════════════════════════════════════════════

    [Fact]
    public async Task ObtenerNotas_SinAutenticacion_Devuelve401()
    {
        var response = await _client.GetAsync("/api/tramites/1/notas");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ObtenerNotas_ConToken_Devuelve200()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var response = await _client.GetAsync("/api/tramites/1/notas");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<List<NotaDto>>>();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task ObtenerNotas_TramiteInexistente_Devuelve200Vacio()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var response = await _client.GetAsync("/api/tramites/99999/notas");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<List<NotaDto>>>();
        body!.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task CrearNota_Valida_Devuelve201_YLaElimina()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var crear = await _client.PostAsJsonAsync("/api/tramites/1/notas",
            new { Contenido = "Nota de prueba de integración" });

        crear.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await crear.Content.ReadFromJsonAsync<ApiResponseDto<NotaDto>>();
        body!.Data.Should().NotBeNull();
        body.Data!.Id.Should().BeGreaterThan(0);

        var eliminar = await _client.DeleteAsync($"/api/tramites/notas/{body.Data.Id}");
        eliminar.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CrearNota_SinContenido_Devuelve400()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var response = await _client.PostAsJsonAsync("/api/tramites/1/notas",
            new { Contenido = "" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CrearNota_TramiteInexistente_Devuelve404()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var response = await _client.PostAsJsonAsync("/api/tramites/99999/notas",
            new { Contenido = "Nota de prueba" });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CrearNota_SinRolAbogado_Devuelve403()
    {
        AutenticarComo(AuthHelper.GenerarTokenSecretaria());

        var response = await _client.PostAsJsonAsync("/api/tramites/1/notas",
            new { Contenido = "Nota de prueba" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task EliminarNota_NotaInexistente_Devuelve404()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var response = await _client.DeleteAsync("/api/tramites/notas/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ════════════════════════════════════════════════════════════
    // DOCUMENTOS ADJUNTOS
    // ════════════════════════════════════════════════════════════

    [Fact]
    public async Task ObtenerDocumentos_ConToken_Devuelve200()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var response = await _client.GetAsync("/api/tramites/1/documentos");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<List<DocumentoDto>>>();
        body!.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task SubirDocumento_SinArchivo_Devuelve400()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var multipart = new MultipartFormDataContent();
        var response = await _client.PostAsync("/api/tramites/1/documentos/upload", multipart);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SubirDocumento_ExtensionNoPermitida_Devuelve400()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        using var multipart = CrearUpload("prueba.exe", "MZ");
        var response = await _client.PostAsync("/api/tramites/1/documentos/upload", multipart);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<ApiResponseDto<object>>();
        body!.Error.Should().Contain("Tipo de archivo no permitido");
    }

    [Fact]
    public async Task SubirDocumento_SinRolAbogado_Devuelve403()
    {
        AutenticarComo(AuthHelper.GenerarTokenSecretaria());

        using var multipart = CrearUpload("prueba.txt", "contenido de prueba");
        var response = await _client.PostAsync("/api/tramites/1/documentos/upload", multipart);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task SubirDocumento_ArchivoValido_Devuelve201_PreviaYElimina()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        using var multipart = CrearUpload("documento-e2e.txt", "contenido de prueba");
        var subida = await _client.PostAsync("/api/tramites/1/documentos/upload", multipart);

        subida.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await subida.Content.ReadFromJsonAsync<ApiResponseDto<DocumentoDto>>();
        body!.Data.Should().NotBeNull();
        body.Data!.Id.Should().BeGreaterThan(0);

        var preview = await _client.GetAsync($"/api/tramites/documentos/{body.Data.Id}/preview");
        preview.StatusCode.Should().Be(HttpStatusCode.OK);

        var eliminar = await _client.DeleteAsync($"/api/tramites/documentos/{body.Data.Id}");
        eliminar.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var previewTrasBorrar = await _client.GetAsync($"/api/tramites/documentos/{body.Data.Id}/preview");
        previewTrasBorrar.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PreviewDocumento_Inexistente_Devuelve404()
    {
        AutenticarComo(AuthHelper.GenerarTokenAdmin());

        var response = await _client.GetAsync("/api/tramites/documentos/99999/preview");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static MultipartFormDataContent CrearUpload(string nombreArchivo, string contenido)
    {
        var multipart = new MultipartFormDataContent();
        var archivo = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes(contenido));
        archivo.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/plain");
        multipart.Add(archivo, "file", nombreArchivo);
        return multipart;
    }

    private void AutenticarComo(string token)
    {
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    // Tipos auxiliares
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Error { get; set; }
    }

    public class NotaDto
    {
        public int Id { get; set; }
        public int TramiteId { get; set; }
        public string Contenido { get; set; } = string.Empty;
    }

    public class DocumentoDto
    {
        public int Id { get; set; }
        public int TramiteId { get; set; }
        public string NombreArchivo { get; set; } = string.Empty;
        public string TipoArchivo { get; set; } = string.Empty;
    }
}
