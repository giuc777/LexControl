using LexControlApi.Dtos.Perfil;
using LexControlApi.Dtos.Usuarios;
using LexControlApi.Excepciones;
using LexControlApi.Helpers;

namespace LexControlApi.Services;

/// <summary>Perfil propio y cambio de contraseña del usuario autenticado.</summary>
public interface IPerfilService
{
    Task<PerfilDto> ObtenerAsync(int usuarioId);
    Task ActualizarAsync(int usuarioId, PerfilActualizarDto datos);
    Task CambiarContrasenaAsync(int usuarioId, string cuenta, CambioContrasenaDto datos);
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

    public async Task CambiarContrasenaAsync(int usuarioId, string cuenta, CambioContrasenaDto datos)
    {
        // Regla del prototipo: la nueva no puede ser igual a la actual.
        if (datos.ContrasenaNueva == datos.ContrasenaActual)
            throw new ExcepcionNegocio(-3,
                "La nueva contraseña no puede ser igual a la actual.",
                StatusCodes.Status400BadRequest);

        // El hash guardado puede ser BCrypt (tras la migracion del primer
        // login) o SHA256 legacy; verificar segun el formato almacenado.
        var candidato = await _repositorio.ConsultarPrimeroAsync<UsuarioAutenticacionFila>(
            "SP_Usuario_ObtenerPorNombre", new { Usuario = cuenta });

        if (candidato is null || candidato.ID != usuarioId)
            throw new ExcepcionNegocio(-1, "Usuario no encontrado.",
                StatusCodes.Status404NotFound);

        var hashGuardado = candidato.ContraseñaHash;
        var actualCoincide = HashHelper.EsHashBcrypt(hashGuardado)
            ? HashHelper.VerifyPassword(datos.ContrasenaActual, hashGuardado)
            : string.Equals(HashHelper.Sha256Hex(datos.ContrasenaActual), hashGuardado,
                StringComparison.OrdinalIgnoreCase);

        if (!actualCoincide)
            throw new ExcepcionNegocio(-2, "La contraseña actual no coincide.",
                StatusCodes.Status400BadRequest);

        // Guardar siempre en BCrypt (formato actual) y limpiar la bandera legacy.
        var hashNuevo = HashHelper.HashPassword(datos.ContrasenaNueva);
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Usuario_ActualizarHash",
            new { ID = usuarioId, ContraseñaHash = hashNuevo, HashLegacy = false });

        if (retorno == -1)
            throw new ExcepcionNegocio(-1, "Usuario no encontrado.",
                StatusCodes.Status404NotFound);

        if (retorno != 0)
            throw new ExcepcionNegocio(retorno,
                "No se pudo cambiar la contraseña.",
                StatusCodes.Status500InternalServerError);
    }
}
