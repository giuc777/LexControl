using FluentAssertions;
using LexControlApi.Data;
using LexControlApi.Excepciones;
using LexControlApi.Services;

namespace LexControlApi.Tests;

/// <summary>
/// Pruebas unitarias del resolver de catálogos con texto manual
/// (select + "Otro (escribir...)"): ID existente, búsqueda por nombre
/// y creación vía SP_*_ResolverPorNombre.
/// </summary>
public class CatalogoTextoResolverTests
{
    [Fact]
    public async Task Resolver_ConIdValido_DevuelveElIdSinConsultar()
    {
        var repositorio = new RepositorioFalso();
        var resolver = new CatalogoTextoResolver(repositorio);

        var resultado = await resolver.ResolverAsync("RAMA", 7, null);

        resultado.Should().Be(7);
        repositorio.UltimoProcedimiento.Should().BeNull();
    }

    [Fact]
    public async Task Resolver_SinIdNiTexto_DevuelveNull()
    {
        var repositorio = new RepositorioFalso();
        var resolver = new CatalogoTextoResolver(repositorio);

        var resultado = await resolver.ResolverAsync("RAMA", null, "   ");

        resultado.Should().BeNull();
        repositorio.UltimoProcedimiento.Should().BeNull();
    }

    [Fact]
    public async Task Resolver_ConTexto_DevuelveIdBuscadoPorNombre()
    {
        var repositorio = new RepositorioFalso
        {
            // Simula que el SP devolvió el ID 42 (fila existente o recién creada).
            AlConsultarPrimero = (_, _) => 42
        };
        var resolver = new CatalogoTextoResolver(repositorio);

        var resultado = await resolver.ResolverAsync("ROL_PROCESAL", null, "  Demandado  ");

        resultado.Should().Be(42);
        repositorio.UltimoProcedimiento.Should().Be("SP_Catalogo_ResolverPorNombre");
        repositorio.UltimoParametro("Nombre").Should().Be("Demandado");
        repositorio.UltimoParametro("Tabla").Should().Be("ROL_PROCESAL");
    }

    [Fact]
    public async Task ResolverJuzgado_ConTexto_DevuelveIdDelJuzgado()
    {
        var repositorio = new RepositorioFalso { AlConsultarPrimero = (_, _) => 15 };
        var resolver = new CatalogoTextoResolver(repositorio);

        var resultado = await resolver.ResolverJuzgadoAsync(null, "Juzgado de Primera Instancia Norte");

        resultado.Should().Be(15);
        repositorio.UltimoProcedimiento.Should().Be("SP_Juzgado_ResolverPorNombre");
        repositorio.UltimoParametro("Nombre").Should().Be("Juzgado de Primera Instancia Norte");
    }

    [Fact]
    public async Task Resolver_SiElSpNoDevuelveId_LanzaExcepcionDeNegocio()
    {
        var repositorio = new RepositorioFalso { AlConsultarPrimero = (_, _) => null };
        var resolver = new CatalogoTextoResolver(repositorio);

        var accion = () => resolver.ResolverAsync("RAMA", null, "Valor Raro");

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .WithMessage("*Valor Raro*");
    }

    [Fact]
    public async Task Resolver_SiElTextoSuperaLaLongitud_LanzaExcepcionDeNegocio()
    {
        var repositorio = new RepositorioFalso();
        var resolver = new CatalogoTextoResolver(repositorio);

        var accion = () => resolver.ResolverAsync(
            "ROL_PROCESAL", null, new string('X', 31));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .WithMessage("*30 caracteres*");
        repositorio.UltimoProcedimiento.Should().BeNull();
    }

    [Fact]
    public async Task ResolverJuzgado_SiElTextoSuperaLaLongitud_LanzaExcepcionDeNegocio()
    {
        var repositorio = new RepositorioFalso();
        var resolver = new CatalogoTextoResolver(repositorio);

        var accion = () => resolver.ResolverJuzgadoAsync(
            null, new string('X', 101));

        await accion.Should().ThrowAsync<ExcepcionNegocio>()
            .WithMessage("*100 caracteres*");
        repositorio.UltimoProcedimiento.Should().BeNull();
    }

    /// <summary>Doble falso mínimo: solo registra las consultas del resolver.</summary>
    private sealed class RepositorioFalso : IRepositorio
    {
        public Func<string, object?, object?> AlConsultarPrimero { get; set; } = (_, _) => null!;
        public string? UltimoProcedimiento { get; private set; }
        private object? _ultimoParametros;

        public object? UltimoParametro(string nombre) =>
            _ultimoParametros?.GetType().GetProperty(nombre)?.GetValue(_ultimoParametros);

        public Task<T?> ConsultarPrimeroAsync<T>(string procedimiento, object? parametros = null)
        {
            UltimoProcedimiento = procedimiento;
            _ultimoParametros = parametros;
            return Task.FromResult((T?)AlConsultarPrimero(procedimiento, parametros));
        }

        public Task<List<T>> ConsultarListaAsync<T>(string procedimiento, object? parametros = null)
            => throw new NotSupportedException();

        public Task<int> EjecutarRetornoAsync(string procedimiento, object? parametros = null)
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
