using LexControlApi.Data;
using LexControlApi.Dtos.Tramites;
using LexControlApi.Excepciones;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Services;

public interface ITramiteService
{
    Task<List<TramiteDto>> ListarAsync(int? expedienteId, int? estadoId, int? tipoId,
        DateTime? fechaInicio, DateTime? fechaFin);
    Task<TramiteDetalleDto?> ObtenerPorIdAsync(int id);
    Task<int> CrearAsync(TramiteCrearDto dto);
    Task ActualizarEstadoAsync(int id, TramiteActualizarEstadoDto dto);
    Task ActualizarAsync(int id, TramiteActualizarDto dto);
    Task<List<NotaTramiteDto>> ObtenerNotasAsync(int tramiteId);
    Task<NotaTramiteDto> CrearNotaAsync(int tramiteId, NotaTramiteCrearDto datos, int usuarioId);
    Task EliminarNotaAsync(int notaId);
    Task<List<DocTramiteDto>> ObtenerDocumentosAsync(int tramiteId);
    Task<DocTramiteDto?> ObtenerDocumentoPorIdAsync(int documentoId);
    Task<DocTramiteDto> CrearDocumentoAsync(int tramiteId, DocTramiteCrearDto datos, int usuarioId);
    Task EliminarDocumentoAsync(int documentoId);
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

    public async Task ActualizarAsync(int id, TramiteActualizarDto dto)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Tramite_Actualizar",
            new
            {
                ID = id,
                Tipo_ID = dto.TipoId,
                Institucion = dto.Institucion,
                FechaIngreso = dto.FechaIngreso,
                Descripcion = dto.Descripcion,
                OficioReferencia = dto.OficioReferencia,
                FechaResolucion = dto.FechaResolucion,
                ResumenResolucion = dto.ResumenResolucion
            });
        VerificarAccion(retorno, "Trámite no encontrado.");
    }

    // ════════════════════════════════════════════════════════════
    // NOTAS
    // ════════════════════════════════════════════════════════════

    public async Task<List<NotaTramiteDto>> ObtenerNotasAsync(int tramiteId)
    {
        var filas = await _repositorio.ConsultarListaAsync<NotaTramiteFila>(
            "SP_NotaTramite_ObtenerPorTramite",
            new { Tramite_ID = tramiteId });
        return filas.Select(NotaTramiteDto.Desde).ToList();
    }

    public async Task<NotaTramiteDto> CrearNotaAsync(int tramiteId, NotaTramiteCrearDto datos, int usuarioId)
    {
        var tramite = await ObtenerPorIdAsync(tramiteId);
        if (tramite is null)
            throw new ExcepcionNegocio(-1, "Trámite no encontrado.",
                StatusCodes.Status404NotFound);

        var nuevoId = await _repositorio.InsertarAsync(
            "SP_NotaTramite_Insertar",
            new
            {
                Tramite_ID = tramiteId,
                datos.Contenido,
                Etiqueta_ID = datos.EtiquetaId,
                datos.Fijado,
                datos.Prioritario,
                Usuario_ID = usuarioId
            },
            "@NuevoID");

        var notas = await ObtenerNotasAsync(tramiteId);
        return notas.FirstOrDefault(n => n.Id == nuevoId)
            ?? throw new ExcepcionNegocio(-1, "Nota no encontrada.",
                StatusCodes.Status404NotFound);
    }

    public async Task EliminarNotaAsync(int notaId)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_NotaTramite_Eliminar", new { ID = notaId });
        VerificarAccion(retorno, "La nota no existe o ya fue eliminada.");
    }

    // ════════════════════════════════════════════════════════════
    // DOCUMENTOS
    // ════════════════════════════════════════════════════════════

    public async Task<List<DocTramiteDto>> ObtenerDocumentosAsync(int tramiteId)
    {
        var filas = await _repositorio.ConsultarListaAsync<DocTramiteFila>(
            "SP_DocTramite_ObtenerPorTramite",
            new { Tramite_ID = tramiteId });
        return filas.Select(DocTramiteDto.Desde).ToList();
    }

    public async Task<DocTramiteDto?> ObtenerDocumentoPorIdAsync(int documentoId)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<DocTramiteFila>(
            "SP_DocTramite_ObtenerPorID", new { ID = documentoId });
        return fila is null ? null : DocTramiteDto.Desde(fila);
    }

    public async Task<DocTramiteDto> CrearDocumentoAsync(int tramiteId, DocTramiteCrearDto datos, int usuarioId)
    {
        var tramite = await ObtenerPorIdAsync(tramiteId);
        if (tramite is null)
            throw new ExcepcionNegocio(-1, "Trámite no encontrado.",
                StatusCodes.Status404NotFound);

        var nuevoId = await _repositorio.InsertarAsync(
            "SP_DocTramite_Insertar",
            new
            {
                Tramite_ID = tramiteId,
                datos.NombreArchivo,
                datos.RutaArchivo,
                datos.TipoArchivo,
                datos.Tamano,
                datos.Descripcion,
                Usuario_ID = usuarioId
            },
            "@NuevoID");

        var docs = await ObtenerDocumentosAsync(tramiteId);
        return docs.FirstOrDefault(d => d.Id == nuevoId)
            ?? throw new ExcepcionNegocio(-1, "Documento no encontrado.",
                StatusCodes.Status404NotFound);
    }

    public async Task EliminarDocumentoAsync(int documentoId)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_DocTramite_Eliminar", new { ID = documentoId });
        VerificarAccion(retorno, "El documento no existe o ya fue eliminado.");
    }

    private static void VerificarAccion(int retorno, string mensajeNoEncontrado)
    {
        switch (retorno)
        {
            case 0:
                return;
            case -1:
                throw new ExcepcionNegocio(-1, mensajeNoEncontrado,
                    StatusCodes.Status404NotFound);
            default:
                throw new ExcepcionNegocio(retorno,
                    "No se pudo completar la operación en la base de datos.",
                    StatusCodes.Status500InternalServerError);
        }
    }
}
