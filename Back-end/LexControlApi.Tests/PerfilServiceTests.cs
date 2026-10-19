using FluentAssertions;
using LexControlApi.Data;
using LexControlApi.Dtos.Perfil;
using LexControlApi.Dtos.Usuarios;
using LexControlApi.Excepciones;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Http;

namespace LexControlApi.Tests;

/// <summary>
/// Pruebas unitarias de PerfilService.CambiarContrasenaAsync: verificación de la
/// contraseña actual en formato BCrypt (tras la migración del primer login) y en
/// formato SHA256 legacy (hash del seed), y persistencia siempre en BCrypt.
/// </summary>
public class PerfilServiceTests
{
    private const string ContrasenaActual = "admin123";
    private const string ContrasenaNueva = "NuevaClave1!";

    [Fact]
    public async Task CambiarContrasena_ConHashBcryptGuardado_GuardaEnBcryptYBorraLegacy()
    {
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => FilaUsuario(1, HashHelper.HashPassword(ContrasenaActual)),
            AlEjecutarRetorno = (_, _) => 0
        };
        var servicio = new PerfilService(repositorio);

        await servicio.CambiarContrasenaAsync(1, "admin", Datos(ContrasenaActual, ContrasenaNueva));

        repositorio.UltimoProcedimiento.Should().Be("SP_Usuario_ActualizarHash");
        repositorio.UltimoParametro("ID").Should().Be(1);
        var hashNuevo = (string)repositorio.UltimoParametro("ContraseñaHash")!;
        HashHelper.EsHashBcrypt(hashNuevo).Should().BeTrue("la nueva contraseña se guarda en BCrypt");
        HashHelper.VerifyPassword(ContrasenaNueva, hashNuevo).Should().BeTrue();
        repositorio.UltimoParametro("HashLegacy").Should().Be(false);
    }

    [Fact]
    public async Task CambiarContrasena_ConHashSha256Legacy_VerificaYGuardaBcrypt()
    {
        // Regresión del bug: el hash del seed es SHA256 y el primer login lo
        // migra a BCrypt; la verificación debe soportar ambos formatos.
#pragma warning disable CS0618
        var hashLegacy = HashHelper.Sha256Hex(ContrasenaActual);
#pragma warning restore CS0618
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => FilaUsuario(1, hashLegacy),
            AlEjecutarRetorno = (_, _) => 0
        };
        var servicio = new PerfilService(repositorio);

        await servicio.CambiarContrasenaAsync(1, "admin", Datos(ContrasenaActual, ContrasenaNueva));

        repositorio.UltimoProcedimiento.Should().Be("SP_Usuario_ActualizarHash");
        var hashNuevo = (string)repositorio.UltimoParametro("ContraseñaHash")!;
        HashHelper.EsHashBcrypt(hashNuevo).Should().BeTrue();
        HashHelper.VerifyPassword(ContrasenaNueva, hashNuevo).Should().BeTrue();
    }

    [Fact]
    public async Task CambiarContrasena_Lookup_PorCuentaDelClaim()
    {
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => FilaUsuario(1, HashHelper.HashPassword(ContrasenaActual)),
            AlEjecutarRetorno = (_, _) => 0
        };
        var servicio = new PerfilService(repositorio);

        await servicio.CambiarContrasenaAsync(1, "mi.cuenta", Datos(ContrasenaActual, ContrasenaNueva));

        repositorio.UltimoProcedimientoConsultado.Should().Be("SP_Usuario_ObtenerPorNombre");
        repositorio.ParametroConsultado("Usuario").Should().Be("mi.cuenta");
    }

    [Fact]
    public async Task CambiarContrasena_ConHashBcryptYActualIncorrecta_Lanza400()
    {
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => FilaUsuario(1, HashHelper.HashPassword(ContrasenaActual))
        };
        var servicio = new PerfilService(repositorio);

        var accion = () => servicio.CambiarContrasenaAsync(
            1, "admin", Datos("otra-clave", ContrasenaNueva));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .Where(e => e.Codigo == -2 && e.EstatusHttp == StatusCodes.Status400BadRequest)
            .WithMessage("*no coincide*");
        repositorio.CambiosRealizados.Should().Be(0, "no se debe persistir nada si la actual no coincide");
    }

    [Fact]
    public async Task CambiarContrasena_ConHashLegacyYActualIncorrecta_Lanza400()
    {
#pragma warning disable CS0618
        var hashLegacy = HashHelper.Sha256Hex(ContrasenaActual);
#pragma warning restore CS0618
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => FilaUsuario(1, hashLegacy)
        };
        var servicio = new PerfilService(repositorio);

        var accion = () => servicio.CambiarContrasenaAsync(
            1, "admin", Datos("otra-clave", ContrasenaNueva));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .Where(e => e.Codigo == -2)
            .WithMessage("*no coincide*");
        repositorio.CambiosRealizados.Should().Be(0);
    }

    [Fact]
    public async Task CambiarContrasena_NuevaIgualAActual_Lanza400SinConsultarBd()
    {
        var repositorio = new RepositorioFalso();
        var servicio = new PerfilService(repositorio);

        var accion = () => servicio.CambiarContrasenaAsync(
            1, "admin", Datos(ContrasenaActual, ContrasenaActual));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .Where(e => e.Codigo == -3 && e.EstatusHttp == StatusCodes.Status400BadRequest)
            .WithMessage("*igual*");
        repositorio.UltimoProcedimientoConsultado.Should().BeNull();
    }

    [Fact]
    public async Task CambiarContrasena_UsuarioInexistente_Lanza404()
    {
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => null
        };
        var servicio = new PerfilService(repositorio);

        var accion = () => servicio.CambiarContrasenaAsync(
            99, "fantasma", Datos(ContrasenaActual, ContrasenaNueva));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .Where(e => e.Codigo == -1 && e.EstatusHttp == StatusCodes.Status404NotFound)
            .WithMessage("*no encontrado*");
    }

    [Fact]
    public async Task CambiarContrasena_CuentaNoCorrespondeAlId_Lanza404()
    {
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => FilaUsuario(2, HashHelper.HashPassword(ContrasenaActual))
        };
        var servicio = new PerfilService(repositorio);

        var accion = () => servicio.CambiarContrasenaAsync(
            1, "otro.usuario", Datos(ContrasenaActual, ContrasenaNueva));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .Where(e => e.Codigo == -1)
            .WithMessage("*no encontrado*");
    }

    [Fact]
    public async Task CambiarContrasena_SpRetornaMenosUno_Lanza404()
    {
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => FilaUsuario(1, HashHelper.HashPassword(ContrasenaActual)),
            AlEjecutarRetorno = (_, _) => -1
        };
        var servicio = new PerfilService(repositorio);

        var accion = () => servicio.CambiarContrasenaAsync(
            1, "admin", Datos(ContrasenaActual, ContrasenaNueva));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .Where(e => e.Codigo == -1 && e.EstatusHttp == StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task CambiarContrasena_SpRetornaErrorSql_Lanza500()
    {
        var repositorio = new RepositorioFalso
        {
            AlConsultarPrimero = (_, _) => FilaUsuario(1, HashHelper.HashPassword(ContrasenaActual)),
            AlEjecutarRetorno = (_, _) => 2627
        };
        var servicio = new PerfilService(repositorio);

        var accion = () => servicio.CambiarContrasenaAsync(
            1, "admin", Datos(ContrasenaActual, ContrasenaNueva));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .Where(e => e.Codigo == 2627 && e.EstatusHttp == StatusCodes.Status500InternalServerError)
            .WithMessage("*No se pudo cambiar*");
    }

    private static CambioContrasenaDto Datos(string actual, string nueva) => new()
    {
        ContrasenaActual = actual,
        ContrasenaNueva = nueva,
        Confirmacion = nueva
    };

    private static UsuarioAutenticacionFila FilaUsuario(int id, string hash) => new()
    {
        ID = id,
        Usuario = "admin",
        ContraseñaHash = hash
    };

    /// <summary>Doble falso mínimo: registra consultas y cambios del servicio.</summary>
    private sealed class RepositorioFalso : IRepositorio
    {
        public Func<string, object?, object?> AlConsultarPrimero { get; set; } = (_, _) => null!;
        public Func<string, object?, int>? AlEjecutarRetorno { get; set; }

        public string? UltimoProcedimientoConsultado { get; private set; }
        public string? UltimoProcedimiento { get; private set; }
        public int CambiosRealizados { get; private set; }
        private object? _parametrosConsultados;
        private object? _ultimosParametros;

        public object? ParametroConsultado(string nombre) =>
            _parametrosConsultados?.GetType().GetProperty(nombre)?.GetValue(_parametrosConsultados);

        public object? UltimoParametro(string nombre) =>
            _ultimosParametros?.GetType().GetProperty(nombre)?.GetValue(_ultimosParametros);

        public Task<T?> ConsultarPrimeroAsync<T>(string procedimiento, object? parametros = null)
        {
            UltimoProcedimientoConsultado = procedimiento;
            _parametrosConsultados = parametros;
            return Task.FromResult((T?)AlConsultarPrimero(procedimiento, parametros));
        }

        public Task<int> EjecutarRetornoAsync(string procedimiento, object? parametros = null)
        {
            UltimoProcedimiento = procedimiento;
            _ultimosParametros = parametros;
            CambiosRealizados++;
            var retorno = AlEjecutarRetorno?.Invoke(procedimiento, parametros) ?? 0;
            return Task.FromResult(retorno);
        }

        public Task<List<T>> ConsultarListaAsync<T>(string procedimiento, object? parametros = null)
            => throw new NotSupportedException();

        public Task<(int Retorno, string? Mensaje)> EjecutarRetornoConMensajeAsync(
            string procedimiento, object? parametros = null)
            => throw new NotSupportedException();

        public Task<int> InsertarAsync(string procedimiento, object parametros, string parametroNuevoId)
            => throw new NotSupportedException();

        public Task<Dapper.SqlMapper.GridReader> ConsultarMultiplesAsync(
            string procedimiento, object? parametros = null)
            => throw new NotSupportedException();
    }
}
