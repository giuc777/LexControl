using System.Security.Claims;

namespace LexControlApi.Helpers;

/// <summary>Accesos rápidos a los claims del JWT.</summary>
public static class ClaimsExtension
{
    /// <summary>ID del usuario autenticado (claim NameIdentifier). 0 si no existe.</summary>
    public static int ObtenerUsuarioId(this ClaimsPrincipal usuario)
    {
        var valor = usuario.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(valor, out var id) ? id : 0;
    }

    /// <summary>Cuenta de acceso (claim personalizado "usuario").</summary>
    public static string ObtenerCuenta(this ClaimsPrincipal usuario)
        => usuario.FindFirstValue("usuario") ?? string.Empty;
}
