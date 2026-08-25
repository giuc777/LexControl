using LexControlApi.Dtos.Perfil;
using LexControlApi.Excepciones;
using LexControlApi.Helpers;

namespace LexControlApi.Services;

/// <summary>Perfil propio y cambio de contraseña del usuario autenticado.</summary>
public interface IPerfilService
{
    Task<PerfilDto> ObtenerAsync(int usuarioId);
    Task ActualizarAsync(int usuarioId, PerfilActualizarDto datos);
    Task CambiarContrasenaAsync(int usuarioId, CambioContrasenaDto datos);
}

public class PerfilService : IPerfilService
{
    private readonly Data.IRepositorio _repositorio;

    public PerfilService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<PerfilDto> ObtenerAsync(int usuarioId)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<Dtos.Usuarios.UsuarioFila>(
            "SP_Usuario_ObtenerPorID", new { ID = usuarioId });

        if (fila is null)
            throw new ExcepcionNegocio(-1, "Usuario no encontrado.", StatusCodes.Status404NotFound);

        return new PerfilDto
        {
            Id = fila.ID,
            NombreCompleto = fila.NombreCompleto,
            Usuario = fila.Usuario,
            Email = fila.Email,
            Telefono = fila.Telefono,
            RolId = fila.Rol_ID,
            Rol = fila.Rol,
            Activo = fila.Activo
        };
    }

    public async Task ActualizarAsync(int usuarioId, PerfilActualizarDto datos)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Perfil_Actualizar",
            new
            {
                Usuario_ID = usuarioId,
                datos.NombreCompleto,
                EmailPrincipal = datos.Email,
                TelefonoPrincipal = datos.Telefono
            });

        if (retorno != 0)
            throw new ExcepcionNegocio(retorno,
                "No se pudo actualizar el perfil.", StatusCodes.Status500InternalServerError);
    }

    public async Task CambiarContrasenaAsync(int usuarioId, CambioContrasenaDto datos)
    {
        var hashActual = HashHelper.Sha256Hex(datos.ContrasenaActual);
        var hashNuevo = HashHelper.Sha256Hex(datos.ContrasenaNueva);

        // Regla del prototipo: la nueva no puede ser igual a la actual.
        if (hashNuevo == hashActual)
            throw new ExcepcionNegocio(-3,
                "La nueva contraseña no puede ser igual a la actual.",
                StatusCodes.Status400BadRequest);

        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Usuario_CambiarContrasena",
            new { ID = usuarioId, HashActual = hashActual, HashNuevo = hashNuevo });

        switch (retorno)
        {
            case 0:
                return;
            case -1:
                throw new ExcepcionNegocio(-1, "Usuario no encontrado.",
                    StatusCodes.Status404NotFound);
            case -2:
                throw new ExcepcionNegocio(-2, "La contraseña actual no coincide.",
                    StatusCodes.Status400BadRequest);
            default:
                throw new ExcepcionNegocio(retorno,
                    "No se pudo cambiar la contraseña.",
                    StatusCodes.Status500InternalServerError);
        }
    }
}
