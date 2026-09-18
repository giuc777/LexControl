-- ============================================================
-- 16. EVENTOS / AGENDA: consultas del dia y de la semana
--     Corrige la dependencia inexistente USUARIO.CreadoPor:
--     EVENTO_BASE.CreadoPor ya almacena directamente el Usuario_ID.
--     Se usan CREATE OR ALTER para poder reejecutar el script.
-- ============================================================
USE DBLexControl;
GO

-- 16.1 Eventos de un usuario en una fecha especifica.
CREATE OR ALTER PROCEDURE SP_Evento_ObtenerDelDia
    @Usuario_ID INT,
    @Fecha DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.ID,
        e.Titulo,
        e.Fecha,
        e.HoraInicio,
        e.HoraFin,
        e.TipoEvento,
        e.Ubicacion,
        e.Prioridad,
        e.ColorEvento,
        ex.NoExpediente,
        per.NombreCompleto AS Cliente,
        ea.TipoAudiencia,
        ep.TipoPlazo,
        ed.TipoDiligencia,
        ee.Nombre AS EstadoNombre,
        CAST(NULL AS NVARCHAR(400)) AS Asistentes
    FROM EVENTO_BASE e
    LEFT JOIN EXPEDIENTE ex        ON e.Expediente_ID = ex.ID
    LEFT JOIN CLIENTE c            ON e.Cliente_ID = c.ID
    LEFT JOIN PERSONA per          ON c.Persona_ID = per.ID
    LEFT JOIN EVENTO_AUDIENCIA ea  ON e.ID = ea.Evento_ID
    LEFT JOIN EVENTO_PLAZO ep      ON e.ID = ep.Evento_ID
    LEFT JOIN EVENTO_DILIGENCIA ed ON e.ID = ed.Evento_ID
    LEFT JOIN ESTADO_EVENTO ee     ON e.Estado_ID = ee.ID
    WHERE e.CreadoPor = @Usuario_ID
      AND e.Fecha = @Fecha
    ORDER BY e.HoraInicio;
END
GO

-- 16.2 Eventos de un usuario en un rango de fechas (vista semanal).
CREATE OR ALTER PROCEDURE SP_Evento_ObtenerDeLaSemana
    @Usuario_ID INT,
    @FechaInicio DATE,
    @FechaFin DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.ID,
        e.Titulo,
        e.Fecha,
        e.HoraInicio,
        e.HoraFin,
        e.TipoEvento,
        e.Ubicacion,
        e.Prioridad,
        e.ColorEvento,
        ex.NoExpediente,
        per.NombreCompleto AS Cliente,
        ea.TipoAudiencia,
        ep.TipoPlazo,
        ed.TipoDiligencia,
        ee.Nombre AS EstadoNombre,
        CAST(NULL AS NVARCHAR(400)) AS Asistentes
    FROM EVENTO_BASE e
    LEFT JOIN EXPEDIENTE ex        ON e.Expediente_ID = ex.ID
    LEFT JOIN CLIENTE c            ON e.Cliente_ID = c.ID
    LEFT JOIN PERSONA per          ON c.Persona_ID = per.ID
    LEFT JOIN EVENTO_AUDIENCIA ea  ON e.ID = ea.Evento_ID
    LEFT JOIN EVENTO_PLAZO ep      ON e.ID = ep.Evento_ID
    LEFT JOIN EVENTO_DILIGENCIA ed ON e.ID = ed.Evento_ID
    LEFT JOIN ESTADO_EVENTO ee     ON e.Estado_ID = ee.ID
    WHERE e.CreadoPor = @Usuario_ID
      AND e.Fecha >= @FechaInicio
      AND e.Fecha <= @FechaFin
    ORDER BY e.Fecha, e.HoraInicio;
END
GO