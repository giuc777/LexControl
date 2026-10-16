using LexControlApi.Data;
using LexControlApi.Dtos.Notificaciones;
using LexControlApi.Excepciones;

namespace LexControlApi.Services;

public interface INotificacionService
{
    Task<List<NotificacionDto>> ListarAsync(int? expedienteId, int? estadoId, int? tipoId,
        int? juzgadoId, DateTime? fechaInicio, DateTime? fechaFin);
    Task<NotificacionDetalleDto?> ObtenerPorIdAsync(int id);
    Task<int> CrearAsync(NotificacionCrearDto dto);
    Task ActualizarAsync(int id, NotificacionActualizarDto dto);
    Task AtenderAsync(int id, NotificacionAtenderDto dto);
    Task<List<DuplicadoDto>> VerificarDuplicadoAsync(DuplicadoVerificarDto dto);
    Task AdjuntarPdfAsync(int id, string ruta);
    Task<int> ContarPendientesAsync();
}

public class NotificacionService : INotificacionService
{
    private readonly IRepositorio _repositorio;
    private readonly ICatalogoTextoResolver _resolverTexto;

    public NotificacionService(IRepositorio repositorio, ICatalogoTextoResolver resolverTexto)
    {
        _repositorio = repositorio;
        _resolverTexto = resolverTexto;
    }

    public async Task<List<NotificacionDto>> ListarAsync(int? expedienteId, int? estadoId, int? tipoId,
        int? juzgadoId, DateTime? fechaInicio, DateTime? fechaFin)
    {
        var filas = await _repositorio.ConsultarListaAsync<NotificacionFila>(
            "SP_Notificacion_Listar",
            new
            {
                Expediente_ID = expedienteId,
                Estado_ID = estadoId,
                Tipo_ID = tipoId,
                Juzgado_ID = juzgadoId,
                FechaInicio = fechaInicio,
                FechaFin = fechaFin
            });
        return filas.Select(NotificacionDto.Desde).ToList();
    }

    public async Task<NotificacionDetalleDto?> ObtenerPorIdAsync(int id)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<NotificacionDetalleFila>(
            "SP_Notificacion_ObtenerPorID", new { ID = id });
        return fila is null ? null : NotificacionDetalleDto.Desde(fila);
    }

    public async Task<int> CrearAsync(NotificacionCrearDto dto)
    {
        if (dto.ExpedienteId <= 0)
            throw new ExcepcionNegocio(-2, "El expediente seleccionado no es válido.",
                StatusCodes.Status400BadRequest);
        if (dto.EstadoId <= 0)
            throw new ExcepcionNegocio(-2, "El estado seleccionado no es válido.",
                StatusCodes.Status400BadRequest);

        // Juzgado y tipo aceptan ID existente o texto manual ("Otro...").
        var juzgadoId = await _resolverTexto.ResolverJuzgadoAsync(dto.JuzgadoId, dto.JuzgadoTexto)
            ?? throw new ExcepcionNegocio(-2, "El juzgado es obligatorio.",
                StatusCodes.Status400BadRequest);
        var tipoId = await _resolverTexto.ResolverAsync("TIPO_NOTIFICACION_OJ", dto.TipoId, dto.TipoTexto)
            ?? throw new ExcepcionNegocio(-2, "El tipo de notificación es obligatorio.",
                StatusCodes.Status400BadRequest);

        return await _repositorio.InsertarAsync(
            "SP_NotificacionOJ_Insertar",
            new
            {
                Expediente_ID = dto.ExpedienteId,
                Juzgado_ID = juzgadoId,
                FechaRecepcion = dto.FechaRecepcion,
                Tipo_ID = tipoId,
                Contenido = dto.Contenido,
                Resumen = dto.Resumen,
                Estado_ID = dto.EstadoId,
                NumeroExpedienteOJ = dto.NumeroExpedienteOJ,
                PDF_Ruta = dto.PdfRuta,
                DuplicadoDe_ID = dto.DuplicadoDeId,
                Notas = dto.Notas,
                EsResolucion = dto.EsResolucion,
                NumeroResolucion = dto.NumeroResolucion,
                Favorable = dto.Favorable
            },
            "@NuevoID");
    }

    public async Task ActualizarAsync(int id, NotificacionActualizarDto dto)
    {
        // Si viene texto manual se resuelve a ID (si no hay ni ID ni texto queda null).
        var juzgadoId = await _resolverTexto.ResolverJuzgadoAsync(dto.JuzgadoId, dto.JuzgadoTexto);
        var tipoId = await _resolverTexto.ResolverAsync("TIPO_NOTIFICACION_OJ", dto.TipoId, dto.TipoTexto);

        await _repositorio.EjecutarRetornoAsync(
            "SP_NotificacionOJ_Actualizar",
            new
            {
                ID = id,
                Juzgado_ID = juzgadoId,
                FechaRecepcion = dto.FechaRecepcion,
                Tipo_ID = tipoId,
                Contenido = dto.Contenido,
                Resumen = dto.Resumen,
                Estado_ID = dto.EstadoId,
                NumeroExpedienteOJ = dto.NumeroExpedienteOJ,
                PDF_Ruta = dto.PdfRuta,
                Notas = dto.Notas,
                EsResolucion = dto.EsResolucion,
                NumeroResolucion = dto.NumeroResolucion,
                Favorable = dto.Favorable
            });
    }

    public async Task AtenderAsync(int id, NotificacionAtenderDto dto)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_NotificacionOJ_Atender",
            new { ID = id, Notas = dto.Notas });
    }

    public async Task<List<DuplicadoDto>> VerificarDuplicadoAsync(DuplicadoVerificarDto dto)
    {
        if (dto.ExpedienteId <= 0)
            throw new ExcepcionNegocio(-2, "El expediente seleccionado no es válido.",
                StatusCodes.Status400BadRequest);

        var filas = await _repositorio.ConsultarListaAsync<DuplicadoFila>(
            "SP_NotificacionOJ_VerificarDuplicado",
            new
            {
                Expediente_ID = dto.ExpedienteId,
                NumeroResolucion = dto.NumeroResolucion,
                NumeroExpedienteOJ = dto.NumeroExpedienteOJ
            });
        return filas.Select(DuplicadoDto.Desde).ToList();
    }

    public async Task AdjuntarPdfAsync(int id, string ruta)
    {
        if (string.IsNullOrWhiteSpace(ruta))
            throw new ExcepcionNegocio(-2, "La ruta del archivo no es válida.",
                StatusCodes.Status400BadRequest);

        await _repositorio.EjecutarRetornoAsync(
            "SP_NotificacionOJ_AdjuntarPDF",
            new { ID = id, PDF_Ruta = ruta });
    }

    public async Task<int> ContarPendientesAsync()
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<ConteoFila>(
            "SP_Notificacion_ContarPendientes");
        return fila?.Total ?? 0;
    }
}
