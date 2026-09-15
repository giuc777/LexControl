using LexControlApi.Data;
using LexControlApi.Dtos.Tramites;

namespace LexControlApi.Services;

public interface ITramiteService
{
    Task<List<TramiteDto>> ListarAsync(int? expedienteId, int? estadoId, int? tipoId,
        DateTime? fechaInicio, DateTime? fechaFin);
    Task<TramiteDetalleDto?> ObtenerPorIdAsync(int id);
    Task<int> CrearAsync(TramiteCrearDto dto);
    Task ActualizarEstadoAsync(int id, TramiteActualizarEstadoDto dto);
}

public class TramiteService : ITramiteService
{
    private readonly IRepositorio _repositorio;

    public TramiteService(IRepositorio repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<List<TramiteDto>> ListarAsync(int? expedienteId, int? estadoId, int? tipoId,
        DateTime? fechaInicio, DateTime? fechaFin)
    {
        var filas = await _repositorio.ConsultarListaAsync<TramiteFila>(
            "SP_Tramite_Listar",
            new
            {
                Expediente_ID = expedienteId,
                Estado_ID = estadoId,
                Tipo_ID = tipoId,
                FechaInicio = fechaInicio,
                FechaFin = fechaFin
            });

        return filas.Select(TramiteDto.Desde).ToList();
    }

    public async Task<TramiteDetalleDto?> ObtenerPorIdAsync(int id)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<TramiteDetalleFila>(
            "SP_Tramite_ObtenerPorID", new { ID = id });
        return fila is null ? null : TramiteDetalleDto.Desde(fila);
    }

    public async Task<int> CrearAsync(TramiteCrearDto dto)
    {
        return await _repositorio.InsertarAsync(
            "SP_Tramite_Insertar",
            new
            {
                Expediente_ID = dto.ExpedienteId,
                Tipo_ID = dto.TipoId,
                Institucion = dto.Institucion,
                FechaIngreso = dto.FechaIngreso,
                Estado_ID = dto.EstadoId,
                Descripcion = dto.Descripcion,
                OficioReferencia = dto.OficioReferencia,
                NotasInternas = dto.NotasInternas,
                DocumentosAdjuntos = dto.DocumentosAdjuntos
            },
            "@NuevoID");
    }

    public async Task ActualizarEstadoAsync(int id, TramiteActualizarEstadoDto dto)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_Tramite_ActualizarEstado",
            new
            {
                ID = id,
                Estado_ID = dto.EstadoId,
                FechaResolucion = dto.FechaResolucion,
                ResumenResolucion = dto.ResumenResolucion
            });
    }
}
