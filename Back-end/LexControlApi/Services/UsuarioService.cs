using LexControlApi.Dtos.Usuarios;
using LexControlApi.Excepciones;
using LexControlApi.Helpers;

namespace LexControlApi.Services;

/// <summary>Gestión de usuarios del sistema (submódulo Ajustes del prototipo).</summary>
public interface IUsuarioService
{
    Task<List<UsuarioDto>> ListarAsync(string? filtroNombre, int? rolId, bool? activo);
    Task<UsuarioDto> ObtenerPorIdAsync(int id);
    Task<UsuarioDto> CrearAsync(UsuarioCrearDto datos);
    Task<UsuarioDto> ActualizarAsync(int id, UsuarioActualizarDto datos);
    Task ActivarDesactivarAsync(int id, bool activo);
    Task DesbloquearAsync(int id);
    Task<List<Dtos.Roles.RolDto>> ListarRolesAsync();
}

public class UsuarioService : IUsuarioService
{
    private readonly Data.IRepositorio _repositorio;

    public UsuarioService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<UsuarioDto>> ListarAsync(string? filtroNombre, int? rolId, bool? activo)
    {
        var filas = await _repositorio.ConsultarListaAsync<UsuarioFila>(
            "SP_Usuario_Listar",
            new { FiltroNombre = filtroNombre, Rol_ID = rolId, Activo = activo });
        return filas.Select(UsuarioDto.Desde).ToList();
    }

    public async Task<UsuarioDto> ObtenerPorIdAsync(int id)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<UsuarioFila>(
            "SP_Usuario_ObtenerPorID", new { ID = id });
        if (fila is null)
            throw new ExcepcionNegocio(-1, "Usuario no encontrado.", StatusCodes.Status404NotFound);
        return UsuarioDto.Desde(fila);
    }

    public async Task<UsuarioDto> CrearAsync(UsuarioCrearDto datos)
    {
        var parametros = new
        {
            datos.NombreCompleto,
            EmailPrincipal = datos.Email,
            TelefonoPrincipal = datos.Telefono,
            Usuario = datos.Cuenta,
            Rol_ID = datos.RolId,
            ContraseñaHash = HashHelper.Sha256Hex(datos.Contrasena)
        };

        int nuevoId;
        try
        {
            nuevoId = await _repositorio.InsertarAsync(
                "SP_Usuario_CrearCompleto", parametros, "@NuevoID");
        }
        catch (ExcepcionNegocio ex) when (EsDuplicado(ex.Codigo))
        {
            throw LanzarCuentaDuplicada();
        }

        return await ObtenerPorIdAsync(nuevoId);
    }

    public async Task<UsuarioDto> ActualizarAsync(int id, UsuarioActualizarDto datos)
    {
        // Contraseña vacía o nula = conservar la actual (el SP ignora NULL).
        var hash = string.IsNullOrEmpty(datos.Contrasena)
            ? null
            : HashHelper.Sha256Hex(datos.Contrasena);

        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Usuario_Actualizar",
            new
            {
                ID = id,
                datos.NombreCompleto,
                EmailPrincipal = datos.Email,
                TelefonoPrincipal = datos.Telefono,
                Usuario = datos.Cuenta,
                Rol_ID = datos.RolId,
                ContraseñaHash = hash
            });

        VerificarAccion(retorno);

        return await ObtenerPorIdAsync(id);
    }

    public async Task ActivarDesactivarAsync(int id, bool activo)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Usuario_CambiarEstado", new { ID = id, Activo = activo });

        switch (retorno)
        {
            case 0:
                return;
            case -1:
                throw new ExcepcionNegocio(-1, "Usuario no encontrado.",
                    StatusCodes.Status404NotFound);
            case -2:
                throw new ExcepcionNegocio(-2, "No se puede desactivar la cuenta de administrador.",
                    StatusCodes.Status409Conflict);
            default:
                throw ErrorGenerico(retorno);
        }
    }

    public async Task DesbloquearAsync(int id)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Usuario_Desbloquear", new { ID = id });
        VerificarAccion(retorno);
    }

    public async Task<List<Dtos.Roles.RolDto>> ListarRolesAsync()
        => await _repositorio.ConsultarListaAsync<Dtos.Roles.RolDto>("SP_Rol_Listar");

    private void VerificarAccion(int retorno)
    {
        switch (retorno)
        {
            case 0:
                return;
            case -1:
                throw new ExcepcionNegocio(-1, "Usuario no encontrado.",
                    StatusCodes.Status404NotFound);
            case 2601 or 2627:
                throw LanzarCuentaDuplicada();
            default:
                throw ErrorGenerico(retorno);
        }
    }

    private static bool EsDuplicado(int codigo) => codigo is 2601 or 2627;

    private static ExcepcionNegocio LanzarCuentaDuplicada()
        => new(2627, "El nombre de usuario ya está en uso.", StatusCodes.Status409Conflict);

    private static ExcepcionNegocio ErrorGenerico(int codigo)
        => new(codigo, "No se pudo completar la operación en la base de datos.",
            StatusCodes.Status500InternalServerError);
}
