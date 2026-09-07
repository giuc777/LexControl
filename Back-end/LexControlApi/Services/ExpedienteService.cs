using Dapper;
using LexControlApi.Dtos.Expedientes;
using LexControlApi.Excepciones;
using System.Data;

using LexControlApi.Dtos.Usuarios;

namespace LexControlApi.Services;

/// <summary>Gestión del módulo principal de expedientes.</summary>
public interface IExpedienteService
{
    // ── Expediente ──────────────────────────────────────────────
    Task<List<AbogadoDto>> ListarAbogadosAsync();
    Task<(List<ExpedienteDto> Expedientes, int Total)> ListarAsync(
        int? clienteId, int? estadoId, int? ramaId, int? usuarioId,
        DateTime? fechaInicio, DateTime? fechaFin, string? noExpediente,
        int pagina, int tamanioPagina);

    Task<ExpedienteDetalleDto> ObtenerPorIdAsync(int id);
    Task<ExpedienteDto> CrearAsync(ExpedienteCrearDto datos, int usuarioId);
    Task<ExpedienteDto> ActualizarAsync(int id, ExpedienteActualizarDto datos);
    Task CambiarEstadoAsync(int id, ExpedienteEstadoDto datos);
    Task EliminarAsync(int id, int usuarioId);

    // ── Partes procesales ───────────────────────────────────────
    Task<List<ParteProcesalDto>> ObtenerPartesAsync(int expedienteId);
    Task<ParteProcesalDto> CrearParteAsync(int expedienteId, ParteProcesalCrearDto datos);
    Task ActualizarParteAsync(int parteId, ParteProcesalActualizarDto datos);
    Task EliminarParteAsync(int parteId);

    // ── Notas ───────────────────────────────────────────────────
    Task<List<NotaExpedienteDto>> ObtenerNotasAsync(int expedienteId);
    Task<NotaExpedienteDto> CrearNotaAsync(int expedienteId, NotaExpedienteCrearDto datos, int usuarioId);
    Task ActualizarNotaAsync(int notaId, NotaExpedienteActualizarDto datos);
    Task EliminarNotaAsync(int notaId);

    // ── Documentos ──────────────────────────────────────────────
    Task<List<DocExpedienteDto>> ObtenerDocumentosAsync(int expedienteId);
    Task<DocExpedienteDto> CrearDocumentoAsync(int expedienteId, DocExpedienteCrearDto datos, int usuarioId);
    Task EliminarDocumentoAsync(int documentoId);
}

public class ExpedienteService : IExpedienteService
{
    private readonly Data.IRepositorio _repositorio;

    public ExpedienteService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<List<AbogadoDto>> ListarAbogadosAsync()
    {
        var filas = await _repositorio.ConsultarListaAsync<UsuarioFila>(
            "SP_Usuario_Listar", new { FiltroNombre = (string?)null, Rol_ID = (int?)3, Activo = (bool?)true });
        return filas.Select(f => new AbogadoDto { Id = f.ID, NombreCompleto = f.NombreCompleto }).ToList();
    }

    // ════════════════════════════════════════════════════════════
    // EXPEDIENTE
    // ════════════════════════════════════════════════════════════

    public async Task<(List<ExpedienteDto> Expedientes, int Total)> ListarAsync(
        int? clienteId, int? estadoId, int? ramaId, int? usuarioId,
        DateTime? fechaInicio, DateTime? fechaFin, string? noExpediente,
        int pagina, int tamanioPagina)
    {
        var dp = new DynamicParameters();
        dp.Add("@Cliente_ID", clienteId);
        dp.Add("@Estado_ID", estadoId);
        dp.Add("@Rama_ID", ramaId);
        dp.Add("@Usuario_ID", usuarioId);
        dp.Add("@FechaInicio", fechaInicio);
        dp.Add("@FechaFin", fechaFin);
        dp.Add("@NoExpediente", noExpediente);
        dp.Add("@Pagina", pagina);
        dp.Add("@TamanioPagina", tamanioPagina);
        dp.Add("@TotalRegistros", dbType: DbType.Int32, direction: ParameterDirection.Output);

        var filas = await _repositorio.ConsultarListaAsync<ExpedienteFila>(
            "SP_Expediente_ListarPaginado", dp);

        var total = dp.Get<int?>("@TotalRegistros") ?? 0;
        var expedientes = filas.Select(ExpedienteDto.Desde).ToList();
        return (expedientes, total);
    }

    public async Task<ExpedienteDetalleDto> ObtenerPorIdAsync(int id)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<ExpedienteDetalleFila>(
            "SP_Expediente_ObtenerPorID", new { ID = id });
        if (fila is null)
            throw new ExcepcionNegocio(-1, "Expediente no encontrado.", StatusCodes.Status404NotFound);
        return ExpedienteDetalleDto.Desde(fila);
    }

    public async Task<ExpedienteDto> CrearAsync(ExpedienteCrearDto datos, int usuarioId)
    {
        int nuevoId;
        try
        {
            nuevoId = await _repositorio.InsertarAsync(
                "SP_Expediente_Insertar",
                new
                {
                    Cliente_ID = datos.ClienteId,
                    Rol_Procesal_ID = datos.RolProcesalId,
                    datos.NoExpediente,
                    Rama_ID = datos.RamaId,
                    datos.TipoProceso,
                    Juzgado_ID = datos.JuzgadoId,
                    datos.FechaIngreso,
                    Estado_ID = datos.EstadoId,
                    datos.Descripcion,
                    datos.NotasInternas,
                    Usuario_ID = datos.AbogadoId
                },
                "@NuevoID");
        }
        catch (ExcepcionNegocio ex) when (EsDuplicado(ex.Codigo))
        {
            throw new ExcepcionNegocio(2627, "Ya existe un expediente con ese número.",
                StatusCodes.Status409Conflict);
        }

        return await ObtenerExpedienteListadoAsync(nuevoId);
    }

    public async Task<ExpedienteDto> ActualizarAsync(int id, ExpedienteActualizarDto datos)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Expediente_Actualizar",
            new
            {
                ID = id,
                Cliente_ID = datos.ClienteId,
                Rol_Procesal_ID = datos.RolProcesalId,
                Rama_ID = datos.RamaId,
                datos.TipoProceso,
                Juzgado_ID = datos.JuzgadoId,
                Estado_ID = datos.EstadoId,
                datos.Descripcion,
                datos.NotasInternas,
                datos.FechaCierre,
                UsuarioModificacion_ID = (int?)null
            });

        VerificarAccion(retorno);
        return await ObtenerExpedienteListadoAsync(id);
    }

    public async Task CambiarEstadoAsync(int id, ExpedienteEstadoDto datos)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Expediente_CambiarEstado",
            new { ID = id, NuevoEstado_ID = datos.NuevoEstadoId, datos.FechaCierre });

        VerificarAccion(retorno);
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Expediente_Eliminar", new { ID = id, Usuario_ID = usuarioId });

        switch (retorno)
        {
            case 0:
                return;
            case -1:
                throw new ExcepcionNegocio(-1,
                    "No se puede eliminar: el expediente tiene audiencias, trámites o diligencias pendientes.",
                    StatusCodes.Status409Conflict);
            default:
                throw new ExcepcionNegocio(retorno,
                    "No se pudo eliminar el expediente.",
                    StatusCodes.Status500InternalServerError);
        }
    }

    // ════════════════════════════════════════════════════════════
    // PARTES PROCESALES
    // ════════════════════════════════════════════════════════════

    public async Task<List<ParteProcesalDto>> ObtenerPartesAsync(int expedienteId)
    {
        var filas = await _repositorio.ConsultarListaAsync<ParteProcesalFila>(
            "SP_ParteProcesal_ObtenerPorExpediente",
            new { Expediente_ID = expedienteId });
        return filas.Select(ParteProcesalDto.Desde).ToList();
    }

    public async Task<ParteProcesalDto> CrearParteAsync(int expedienteId, ParteProcesalCrearDto datos)
    {
        var nuevoId = await _repositorio.InsertarAsync(
            "SP_ParteProcesal_Insertar",
            new
            {
                Expediente_ID = expedienteId,
                datos.Tipo,
                datos.NombreCompleto,
                datos.DPI,
                datos.Telefono,
                datos.AbogadoDefensor,
                datos.Rol,
                datos.Descripcion
            },
            "@NuevoID");

        var fila = await _repositorio.ConsultarPrimeroAsync<ParteProcesalFila>(
            "SP_ParteProcesal_ObtenerPorExpediente", new { Expediente_ID = expedienteId });

        var todas = await ObtenerPartesAsync(expedienteId);
        return todas.FirstOrDefault(p => p.Id == nuevoId)
            ?? throw new ExcepcionNegocio(-1, "Parte procesal no encontrada.", StatusCodes.Status404NotFound);
    }

    public async Task ActualizarParteAsync(int parteId, ParteProcesalActualizarDto datos)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_ParteProcesal_Actualizar",
            new
            {
                ID = parteId,
                datos.Tipo,
                datos.NombreCompleto,
                datos.DPI,
                datos.Telefono,
                datos.AbogadoDefensor,
                datos.Rol,
                datos.Descripcion
            });

        VerificarAccion(retorno);
    }

    public async Task EliminarParteAsync(int parteId)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_ParteProcesal_Eliminar", new { ID = parteId });
        VerificarAccion(retorno);
    }

    // ════════════════════════════════════════════════════════════
    // NOTAS
    // ════════════════════════════════════════════════════════════

    public async Task<List<NotaExpedienteDto>> ObtenerNotasAsync(int expedienteId)
    {
        var filas = await _repositorio.ConsultarListaAsync<NotaExpedienteFila>(
            "SP_NotaExpediente_ObtenerPorExpediente",
            new { Expediente_ID = expedienteId });
        return filas.Select(NotaExpedienteDto.Desde).ToList();
    }

    public async Task<NotaExpedienteDto> CrearNotaAsync(int expedienteId, NotaExpedienteCrearDto datos, int usuarioId)
    {
        var nuevoId = await _repositorio.InsertarAsync(
            "SP_NotaExpediente_Insertar",
            new
            {
                Expediente_ID = expedienteId,
                datos.Contenido,
                Etiqueta_ID = datos.EtiquetaId,
                datos.Fijado,
                datos.Prioritario,
                Usuario_ID = usuarioId
            },
            "@NuevoID");

        var notas = await ObtenerNotasAsync(expedienteId);
        return notas.FirstOrDefault(n => n.Id == nuevoId)
            ?? throw new ExcepcionNegocio(-1, "Nota no encontrada.", StatusCodes.Status404NotFound);
    }

    public async Task ActualizarNotaAsync(int notaId, NotaExpedienteActualizarDto datos)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_NotaExpediente_Actualizar",
            new
            {
                ID = notaId,
                datos.Contenido,
                Etiqueta_ID = datos.EtiquetaId,
                datos.Fijado,
                datos.Prioritario
            });

        VerificarAccion(retorno);
    }

    public async Task EliminarNotaAsync(int notaId)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_NotaExpediente_Eliminar", new { ID = notaId });
        VerificarAccion(retorno);
    }

    // ════════════════════════════════════════════════════════════
    // DOCUMENTOS
    // ════════════════════════════════════════════════════════════

    public async Task<List<DocExpedienteDto>> ObtenerDocumentosAsync(int expedienteId)
    {
        var filas = await _repositorio.ConsultarListaAsync<DocExpedienteFila>(
            "SP_DocExpediente_ObtenerPorExpediente",
            new { Expediente_ID = expedienteId });
        return filas.Select(DocExpedienteDto.Desde).ToList();
    }

    public async Task<DocExpedienteDto> CrearDocumentoAsync(int expedienteId, DocExpedienteCrearDto datos, int usuarioId)
    {
        var nuevoId = await _repositorio.InsertarAsync(
            "SP_DocExpediente_Insertar",
            new
            {
                Expediente_ID = expedienteId,
                datos.NombreArchivo,
                datos.RutaArchivo,
                datos.TipoArchivo,
                datos.Tamano,
                datos.Descripcion,
                Usuario_ID = usuarioId
            },
            "@NuevoID");

        var docs = await ObtenerDocumentosAsync(expedienteId);
        return docs.FirstOrDefault(d => d.Id == nuevoId)
            ?? throw new ExcepcionNegocio(-1, "Documento no encontrado.", StatusCodes.Status404NotFound);
    }

    public async Task EliminarDocumentoAsync(int documentoId)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_DocExpediente_Eliminar", new { ID = documentoId });
        VerificarAccion(retorno);
    }

    // ════════════════════════════════════════════════════════════
    // HELPERS PRIVADOS
    // ════════════════════════════════════════════════════════════

    private async Task<ExpedienteDto> ObtenerExpedienteListadoAsync(int id)
    {
        var dp = new DynamicParameters();
        dp.Add("@Cliente_ID", (int?)null);
        dp.Add("@Estado_ID", (int?)null);
        dp.Add("@Rama_ID", (int?)null);
        dp.Add("@Usuario_ID", (int?)null);
        dp.Add("@FechaInicio", (DateTime?)null);
        dp.Add("@FechaFin", (DateTime?)null);
        dp.Add("@NoExpediente", (string?)null);
        dp.Add("@Pagina", 1);
        dp.Add("@TamanioPagina", 10000);
        dp.Add("@TotalRegistros", dbType: DbType.Int32, direction: ParameterDirection.Output);

        var filas = await _repositorio.ConsultarListaAsync<ExpedienteFila>(
            "SP_Expediente_ListarPaginado", dp);

        var fila = filas.FirstOrDefault(f => f.ID == id);
        if (fila is null)
            throw new ExcepcionNegocio(-1, "Expediente no encontrado.", StatusCodes.Status404NotFound);
        return ExpedienteDto.Desde(fila);
    }

    private void VerificarAccion(int retorno)
    {
        switch (retorno)
        {
            case 0:
                return;
            case -1:
                throw new ExcepcionNegocio(-1, "Registro no encontrado.",
                    StatusCodes.Status404NotFound);
            case 2601 or 2627:
                throw new ExcepcionNegocio(2627, "Ya existe un registro con esos datos.",
                    StatusCodes.Status409Conflict);
            default:
                throw new ExcepcionNegocio(retorno, "No se pudo completar la operación en la base de datos.",
                    StatusCodes.Status500InternalServerError);
        }
    }

    private static bool EsDuplicado(int codigo) => codigo is 2601 or 2627;
}
