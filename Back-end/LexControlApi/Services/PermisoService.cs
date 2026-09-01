using System.Text.Json;
using LexControlApi.Dtos.Permisos;
using LexControlApi.Excepciones;

namespace LexControlApi.Services;

/// <summary>Matriz de permisos rol × módulo (visibilidad de módulos del SPA).</summary>
public interface IPermisoService
{
    /// <summary>Matriz completa para la pantalla de administración.</summary>
    Task<List<PermisoRolDto>> ListarMatrizAsync();

    /// <summary>Módulos visibles para un rol (filtro de menú).</summary>
    Task<List<PermisoDto>> ObtenerPorRolAsync(int rolId);

    /// <summary>Guarda la matriz completa de un rol en una transacción.</summary>
    Task GuardarRolAsync(int rolId, PermisoGuardarDto solicitud);
}

public class PermisoService : IPermisoService
{
    private static readonly JsonSerializerOptions OpcionesJson = new(JsonSerializerDefaults.Web);

    private readonly Data.IRepositorio _repositorio;

    public PermisoService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<PermisoRolDto>> ListarMatrizAsync()
    {
        var filas = await _repositorio.ConsultarListaAsync<PermisoFila>("SP_Permiso_Listar");

        return filas
            .GroupBy(f => f.Rol_ID)
            .Select(g => new PermisoRolDto
            {
                RolId = g.Key,
                Rol = g.First().Rol,
                Modulos = g.OrderBy(f => f.Orden).Select(Mapear).ToList()
            })
            .OrderBy(r => r.RolId)
            .ToList();
    }

    public async Task<List<PermisoDto>> ObtenerPorRolAsync(int rolId)
    {
        List<PermisoFila> filas;
        try
        {
            filas = await _repositorio.ConsultarListaAsync<PermisoFila>(
                "SP_Permiso_ObtenerPorRol", new { Rol_ID = rolId });
        }
        catch (ExcepcionNegocio ex) when (ex.Codigo == -1)
        {
            throw new ExcepcionNegocio(-1, "Rol no encontrado.", StatusCodes.Status404NotFound);
        }

        return filas.Select(Mapear).ToList();
    }

    public async Task GuardarRolAsync(int rolId, PermisoGuardarDto solicitud)
    {
        var json = JsonSerializer.Serialize(
            solicitud.Modulos.Select(kv => new { clave = kv.Key, activo = kv.Value }),
            OpcionesJson);

        var retorno = await _repositorio.EjecutarRetornoAsync("SP_Permiso_GuardarRol",
            new { Rol_ID = rolId, PermisosJson = json });

        if (retorno != 0)
            throw MapearRechazo(retorno);
    }

    private static PermisoDto Mapear(PermisoFila fila) => new()
    {
        Clave = fila.ModuloClave,
        Nombre = fila.Modulo,
        Ruta = fila.Ruta,
        Icono = fila.Icono,
        Orden = fila.Orden,
        Activo = fila.Activo
    };

    private static ExcepcionNegocio MapearRechazo(int codigo) => codigo switch
    {
        -1 => new(-1, "Rol no encontrado.", StatusCodes.Status404NotFound),
        -2 => new(-2, "La matriz contiene módulos desconocidos o está vacía.",
            StatusCodes.Status400BadRequest),
        -3 => new(-3, "Hay módulos sin un valor de visibilidad válido.",
            StatusCodes.Status400BadRequest),
        -4 => new(-4, "El módulo Dashboard no puede ocultarse.",
            StatusCodes.Status400BadRequest),
        -5 => new(-5, "El administrador no puede perder el acceso al módulo Ajustes.",
            StatusCodes.Status400BadRequest),
        _ => new(codigo, "No se pudieron guardar los permisos en la base de datos.",
            StatusCodes.Status500InternalServerError)
    };
}
