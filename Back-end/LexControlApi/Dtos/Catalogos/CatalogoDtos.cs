using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Catalogos;

/// <summary>Fila cruda devuelta por SP_Catalogo_Buscar (catálogos estándar).</summary>
public class CatalogoFila
{
    public int ID { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Valor { get; set; }
    public string? Descripcion { get; set; }
    public string? Color { get; set; }
    public int Orden { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public int Total { get; set; }
}

/// <summary>Fila devuelta por SP_Juzgado_Buscar.</summary>
public class JuzgadoFila
{
    public int ID { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? TipoJuzgado { get; set; }
    public int TipoJuzgadoID { get; set; }
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Municipio { get; set; }
    public int MunicipioID { get; set; }
    public string? Departamento { get; set; }
    public int DepartamentoID { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public int Total { get; set; }
}

/// <summary>Ítem de catálogo estándar expuesto al frontend.</summary>
public class CatalogoDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Valor { get; set; }
    public string? Descripcion { get; set; }
    public string? Color { get; set; }
    public int Orden { get; set; }
    public bool Activo { get; set; }
    public string? FechaCreacion { get; set; }

    public static CatalogoDto Desde(CatalogoFila fila) => new()
    {
        Id = fila.ID,
        Nombre = fila.Nombre,
        Valor = fila.Valor,
        Descripcion = fila.Descripcion,
        Color = fila.Color,
        Orden = fila.Orden,
        Activo = fila.Activo,
        FechaCreacion = fila.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Juzgado expuesto al frontend.</summary>
public class JuzgadoDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? TipoJuzgado { get; set; }
    public int TipoJuzgadoId { get; set; }
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Municipio { get; set; }
    public int MunicipioId { get; set; }
    public string? Departamento { get; set; }
    public int DepartamentoId { get; set; }
    public bool Activo { get; set; }
    public string? FechaCreacion { get; set; }

    public static JuzgadoDto Desde(JuzgadoFila fila) => new()
    {
        Id = fila.ID,
        Nombre = fila.Nombre,
        TipoJuzgado = fila.TipoJuzgado,
        TipoJuzgadoId = fila.TipoJuzgadoID,
        Direccion = fila.Direccion,
        Telefono = fila.Telefono,
        Email = fila.Email,
        Municipio = fila.Municipio,
        MunicipioId = fila.MunicipioID,
        Departamento = fila.Departamento,
        DepartamentoId = fila.DepartamentoID,
        Activo = fila.Activo,
        FechaCreacion = fila.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Datos de entrada para crear/editar un ítem de catálogo estándar.</summary>
public class CatalogoCrearDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(50)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Valor { get; set; }

    [MaxLength(200)]
    public string? Descripcion { get; set; }

    [MaxLength(7)]
    public string? Color { get; set; }

    public int Orden { get; set; }
}

/// <summary>Datos de entrada para crear/editar un juzgado.</summary>
public class JuzgadoCrearDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El tipo de juzgado es obligatorio.")]
    public int TipoJuzgadoId { get; set; }

    [Required(ErrorMessage = "El municipio es obligatorio.")]
    public int MunicipioId { get; set; }

    [MaxLength(200)]
    public string? Direccion { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "El correo electrónico no es válido.")]
    [MaxLength(100)]
    public string? Email { get; set; }
}

/// <summary>Solicitud de cambio de estado genérico.</summary>
public class CatalogoEstadoDto
{
    public bool Activo { get; set; }
}
