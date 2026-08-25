namespace LexControlApi.Excepciones;

/// <summary>
/// Error de negocio o de datos con código del SP, mensaje para el
/// cliente y estatus HTTP asociado.
/// </summary>
public class ExcepcionNegocio : Exception
{
    /// <summary>Código devuelto por el SP o identificador interno del error.</summary>
    public int Codigo { get; }

    /// <summary>Estatus HTTP sugerido para la respuesta.</summary>
    public int EstatusHttp { get; }

    public ExcepcionNegocio(int codigo, string mensaje, int estatusHttp)
        : base(mensaje)
    {
        Codigo = codigo;
        EstatusHttp = estatusHttp;
    }
}
