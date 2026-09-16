using LexControlApi.Data;
using LexControlApi.Dtos.Historico;

namespace LexControlApi.Services;

public interface IHistoricoService
{
    Task<List<HistoricoDto>> ListarAsync(int? clienteId, int? ramaId, int? usuarioId,
        string? busqueda, DateTime? fechaInicio, DateTime? fechaFin);
}

public class HistoricoService : IHistoricoService
{
    private readonly IRepositorio _repositorio;

    public HistoricoService(IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<HistoricoDto>> ListarAsync(int? clienteId, int? ramaId,
        int? usuarioId, string? busqueda, DateTime? fechaInicio, DateTime? fechaFin)
    {
        var filas = await _repositorio.ConsultarListaAsync<HistoricoFila>(
            "SP_Historico_Listar",
            new
            {
                Cliente_ID = clienteId,
                Rama_ID = ramaId,
                Usuario_ID = usuarioId,
                Busqueda = busqueda,
                FechaInicio = fechaInicio,
                FechaFin = fechaFin
            });

        return filas.Select(HistoricoDto.Desde).ToList();
    }
}
