using LexControlApi.Data;
using LexControlApi.Dtos.Audiencias;

namespace LexControlApi.Services;

public interface IAudienciaService
{
    Task<List<AudienciaDto>> ListarAsync(int? expedienteId, DateTime? fechaInicio, DateTime? fechaFin,
        int? estadoId, int? tipoId);
    Task<AudienciaDetalleDto?> ObtenerPorIdAsync(int id);
    Task<int> CrearAsync(AudienciaCrearDto dto, int usuarioId);
    Task RegistrarResultadoAsync(int id, AudienciaResultadoDto dto, int usuarioId);
    Task<List<AudienciaDto>> ProximasAsync(int dias, int? usuarioId);
}

public class AudienciaService : IAudienciaService
{
    private readonly IRepositorio _repositorio;

    public AudienciaService(IRepositorio repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<List<AudienciaDto>> ListarAsync(int? expedienteId, DateTime? fechaInicio,
        DateTime? fechaFin, int? estadoId, int? tipoId)
    {
        var filas = await _repositorio.ConsultarListaAsync<AudienciaFila>(
            "SP_Audiencia_Listar",
            new
            {
                Expediente_ID = expedienteId,
                FechaInicio = fechaInicio,
                FechaFin = fechaFin,
                Estado_ID = estadoId,
                Tipo_ID = tipoId
            });

        return filas.Select(AudienciaDto.Desde).ToList();
    }

    public async Task<AudienciaDetalleDto?> ObtenerPorIdAsync(int id)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<AudienciaDetalleFila>(
            "SP_Audiencia_ObtenerPorID", new { ID = id });
        return fila is null ? null : AudienciaDetalleDto.Desde(fila);
    }

    public async Task<int> CrearAsync(AudienciaCrearDto dto, int usuarioId)
    {
        return await _repositorio.InsertarAsync(
            "SP_Audiencia_Insertar",
            new
            {
                Expediente_ID = dto.ExpedienteId,
                Fecha = dto.Fecha,
                HoraInicio = dto.HoraInicio,
                HoraFin = dto.HoraFin,
                Tipo_ID = dto.TipoId,
                Juzgado_ID = dto.JuzgadoId,
                Sala = dto.Sala,
                Estado_ID = dto.EstadoId,
                DescripcionResultado = dto.DescripcionResultado,
                ProximaActuacion = dto.ProximaActuacion,
                Notas = dto.Notas,
                Documentos = dto.Documentos,
                Usuario_Creacion_ID = usuarioId
            },
            "@NuevoID");
    }

    public async Task RegistrarResultadoAsync(int id, AudienciaResultadoDto dto, int usuarioId)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_Audiencia_RegistrarResultado",
            new
            {
                ID = id,
                Resultado_ID = dto.ResultadoId,
                DescripcionResultado = dto.DescripcionResultado,
                ProximaActuacion = dto.ProximaActuacion,
                UsuarioModificacion_ID = usuarioId
            });
    }

    public async Task<List<AudienciaDto>> ProximasAsync(int dias, int? usuarioId)
    {
        var filas = await _repositorio.ConsultarListaAsync<AudienciaProximaFila>(
            "SP_Audiencia_Proximas",
            new { Dias = dias, Usuario_ID = usuarioId });

        return filas.Select(AudienciaDto.DesdeProxima).ToList();
    }
}
