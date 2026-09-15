using LexControlApi.Data;
using LexControlApi.Dtos.Eventos;

namespace LexControlApi.Services;

public interface IEventoService
{
    Task<List<EventoDto>> ObtenerDelDiaAsync(DateTime fecha, int? usuarioId);
    Task<int> CrearAsync(EventoCrearDto dto, int usuarioId);
    Task<int> CrearAudienciaAsync(EventoAudienciaCrearDto dto, int usuarioId);
}

public class EventoService : IEventoService
{
    private readonly IRepositorio _repositorio;

    public EventoService(IRepositorio repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<List<EventoDto>> ObtenerDelDiaAsync(DateTime fecha, int? usuarioId)
    {
        var filas = await _repositorio.ConsultarListaAsync<EventoFila>(
            "SP_Evento_ObtenerDelDia",
            new { Fecha = fecha, Usuario_ID = usuarioId });

        return filas.Select(EventoDto.Desde).ToList();
    }

    public async Task<int> CrearAsync(EventoCrearDto dto, int usuarioId)
    {
        return await _repositorio.InsertarAsync(
            "SP_EventoBase_Insertar",
            new
            {
                Expediente_ID = dto.ExpedienteId,
                Cliente_ID = dto.ClienteId,
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                Fecha = dto.Fecha,
                HoraInicio = dto.HoraInicio,
                HoraFin = dto.HoraFin,
                DiaCompleto = dto.DiaCompleto,
                Ubicacion = dto.Ubicacion,
                Prioridad = dto.Prioridad,
                ColorEvento = dto.ColorEvento,
                Estado_ID = dto.EstadoId,
                TipoEvento = dto.TipoEvento,
                EsInterno = dto.EsInterno,
                CreadoPor = usuarioId
            },
            "@NuevoID");
    }

    public async Task<int> CrearAudienciaAsync(EventoAudienciaCrearDto dto, int usuarioId)
    {
        return await _repositorio.InsertarAsync(
            "SP_EventoAudiencia_Insertar",
            new
            {
                Expediente_ID = dto.ExpedienteId,
                Cliente_ID = dto.ClienteId,
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                Fecha = dto.Fecha,
                HoraInicio = dto.HoraInicio,
                HoraFin = dto.HoraFin,
                Ubicacion = dto.Ubicacion,
                Prioridad = dto.Prioridad,
                ColorEvento = dto.ColorEvento,
                Estado_ID = dto.EstadoId,
                EsInterno = dto.EsInterno,
                CreadoPor = usuarioId,
                TipoAudiencia = dto.TipoAudiencia,
                Juzgado_ID = dto.JuzgadoId,
                Secretario_ID = dto.SecretarioId,
                NumeroExpedienteJudicial = dto.NumeroExpedienteJudicial,
                Resolucion = dto.Resolucion
            },
            "@NuevoID");
    }
}
