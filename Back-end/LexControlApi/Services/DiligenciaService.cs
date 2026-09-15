using LexControlApi.Data;
using LexControlApi.Dtos.Diligencias;

namespace LexControlApi.Services;

public interface IDiligenciaService
{
    Task<List<DiligenciaDto>> ListarAsync(int? expedienteId, int? clienteId, int? tipoId,
        int? estadoId, int? usuarioId, DateTime? fechaInicio, DateTime? fechaFin);
    Task<DiligenciaDetalleDto?> ObtenerPorIdAsync(int id);
    Task<int> CrearAsync(DiligenciaCrearDto dto, int usuarioId);
    Task ActualizarAsync(int id, DiligenciaActualizarDto dto);
    Task EliminarAsync(int id);
}

public class DiligenciaService : IDiligenciaService
{
    private readonly IRepositorio _repositorio;

    public DiligenciaService(IRepositorio repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<List<DiligenciaDto>> ListarAsync(int? expedienteId, int? clienteId, int? tipoId,
        int? estadoId, int? usuarioId, DateTime? fechaInicio, DateTime? fechaFin)
    {
        var filas = await _repositorio.ConsultarListaAsync<DiligenciaFila>(
            "SP_Diligencia_Listar",
            new
            {
                Expediente_ID = expedienteId,
                Cliente_ID = clienteId,
                Tipo_ID = tipoId,
                Estado_ID = estadoId,
                Usuario_ID = usuarioId,
                FechaInicio = fechaInicio,
                FechaFin = fechaFin
            });

        return filas.Select(DiligenciaDto.Desde).ToList();
    }

    public async Task<DiligenciaDetalleDto?> ObtenerPorIdAsync(int id)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<DiligenciaDetalleFila>(
            "SP_Diligencia_ObtenerPorID", new { ID = id });
        return fila is null ? null : DiligenciaDetalleDto.Desde(fila);
    }

    public async Task<int> CrearAsync(DiligenciaCrearDto dto, int usuarioId)
    {
        TimeSpan? horaInicio = null;
        if (!string.IsNullOrEmpty(dto.HoraInicio))
        {
            if (TimeSpan.TryParse(dto.HoraInicio, out var h))
                horaInicio = h;
        }

        return await _repositorio.InsertarAsync(
            "SP_Diligencia_Insertar",
            new
            {
                Expediente_ID = dto.ExpedienteId,
                Cliente_ID = dto.ClienteId,
                Tipo_ID = dto.TipoId,
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                Fecha = dto.Fecha,
                HoraInicio = horaInicio,
                DiaCompleto = dto.DiaCompleto,
                Ubicacion = dto.Ubicacion,
                Oficina = dto.Oficina,
                Estado_ID = dto.EstadoId,
                Notas = dto.Notas,
                TiempoDedicado = dto.TiempoDedicado,
                RecordatorioMinutos = dto.RecordatorioMinutos,
                Usuario_ID = usuarioId
            },
            "@NuevoID");
    }

    public async Task ActualizarAsync(int id, DiligenciaActualizarDto dto)
    {
        TimeSpan? horaInicio = null;
        if (!string.IsNullOrEmpty(dto.HoraInicio))
        {
            if (TimeSpan.TryParse(dto.HoraInicio, out var h))
                horaInicio = h;
        }

        await _repositorio.EjecutarRetornoAsync(
            "SP_Diligencia_Actualizar",
            new
            {
                ID = id,
                Expediente_ID = dto.ExpedienteId,
                Cliente_ID = dto.ClienteId,
                Tipo_ID = dto.TipoId,
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                Fecha = dto.Fecha,
                HoraInicio = horaInicio,
                DiaCompleto = dto.DiaCompleto,
                Ubicacion = dto.Ubicacion,
                Oficina = dto.Oficina,
                Estado_ID = dto.EstadoId,
                Notas = dto.Notas,
                TiempoDedicado = dto.TiempoDedicado,
                RecordatorioMinutos = dto.RecordatorioMinutos
            });
    }

    public async Task EliminarAsync(int id)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_Diligencia_Eliminar",
            new { ID = id });
    }
}
