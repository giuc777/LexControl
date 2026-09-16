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
}

public class NotificacionService : INotificacionService
{
    private readonly IRepositorio _repositorio;

    public NotificacionService(IRepositorio repositorio)
    {
        _repositorio = repositorio;
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
        if (dto.JuzgadoId <= 0)
            throw new ExcepcionNegocio(-2, "El juzgado seleccionado no es válido.",
                StatusCodes.Status400BadRequest);
        if (dto.TipoId <= 0)
            throw new ExcepcionNegocio(-2, "El tipo de notificación seleccionado no es válido.",
                StatusCodes.Status400BadRequest);
        if (dto.EstadoId <= 0)
            throw new ExcepcionNegocio(-2, "El estado seleccionado no es válido.",
                StatusCodes.Status400BadRequest);

        return await _repositorio.InsertarAsync(
            "SP_NotificacionOJ_Insertar",
            new
            {
                Expediente_ID = dto.ExpedienteId,
                Juzgado_ID = dto.JuzgadoId,
                FechaRecepcion = dto.FechaRecepcion,
                Tipo_ID = dto.TipoId,
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
        await _repositorio.EjecutarRetornoAsync(
            "SP_NotificacionOJ_Actualizar",
            new
            {
                ID = id,
                Juzgado_ID = dto.JuzgadoId,
                FechaRecepcion = dto.FechaRecepcion,
                Tipo_ID = dto.TipoId,
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
}
