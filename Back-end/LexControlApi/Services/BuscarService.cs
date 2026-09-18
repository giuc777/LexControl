using LexControlApi.Data;
using LexControlApi.Dtos.Buscar;

namespace LexControlApi.Services;

public interface IBuscarService
{
    Task<BusquedaResultadoDto> BuscarAsync(string query);
}

public class BuscarService : IBuscarService
{
    private readonly IRepositorio _repositorio;

    public BuscarService(IRepositorio repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<BusquedaResultadoDto> BuscarAsync(string query)
    {
        var filas = await _repositorio.ConsultarListaAsync<BusquedaFila>(
            "SP_Buscar_Global",
            new { Busqueda = query });

        var resultado = new BusquedaResultadoDto();

        foreach (var fila in filas)
        {
            var item = new BusquedaItemDto
            {
                Id = fila.Id,
                Titulo = fila.Titulo,
                Subtitulo = fila.Subtitulo,
                Ruta = fila.Ruta
            };

            switch (fila.Tipo)
            {
                case "Expediente": resultado.Expedientes.Add(item); break;
                case "Cliente": resultado.Clientes.Add(item); break;
                case "Audiencia": resultado.Audiencias.Add(item); break;
                case "Tramite": resultado.Tramites.Add(item); break;
                case "Notificacion": resultado.Notificaciones.Add(item); break;
                case "Diligencia": resultado.Diligencias.Add(item); break;
            }
        }

        return resultado;
    }
}
