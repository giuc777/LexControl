-- ============================================
-- Fix: Corregir SP de reportes con errores de agregacion sobre subquery
-- El SP usa subqueries dentro de SUM(CASE WHEN ...) lo cual causa
-- error en SQL Server. Solucion: usar variables para los IDs.
-- ============================================

-- ============================================================
-- 1. SP_Reporte_NotificacionesOJ (lineas 70-71 del error)
-- ============================================================CREATE OR ALTER PROCEDURE SP_Reporte_NotificacionesOJ
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Tipo_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Juzgado_ID INT = NULL,
    @SoloPendientes BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoAtendida INT = (SELECT ID FROM ESTADO_NOTIFICACION_OJ WHERE Nombre = 'Atendida');

        SELECT
            TN.Nombre AS Tipo, TN.Color AS Color,
            COUNT(*) AS Recibidas,
            SUM(CASE WHEN N.Estado_ID = @EstadoAtendida THEN 1 ELSE 0 END) AS Atendidas,
            SUM(CASE WHEN N.Estado_ID <> @EstadoAtendida THEN 1 ELSE 0 END) AS Pendientes,
            CAST(AVG(CASE WHEN N.FechaAtencion IS NOT NULL THEN DATEDIFF(DAY, N.FechaRecepcion, N.FechaAtencion) ELSE NULL END) AS DECIMAL(8,1)) AS PromedioDiasAtencion
        FROM NOTIFICACION_OJ N
        INNER JOIN TIPO_NOTIFICACION_OJ TN ON N.Tipo_ID = TN.ID
        WHERE (@FechaInicio IS NULL OR N.FechaRecepcion >= @FechaInicio)
            AND (@FechaFin IS NULL OR N.FechaRecepcion <= @FechaFin)
            AND (@Tipo_ID IS NULL OR N.Tipo_ID = @Tipo_ID)
            AND (@Estado_ID IS NULL OR N.Estado_ID = @Estado_ID)
            AND (@Juzgado_ID IS NULL OR N.Juzgado_ID = @Juzgado_ID)
        GROUP BY TN.Nombre, TN.Color, TN.Orden
        ORDER BY TN.Orden;

        SELECT
            E.NoExpediente, P.NombreCompleto AS Cliente,
            TN.Nombre AS Tipo, EN.Nombre AS Estado,
            J.Nombre AS Juzgado, N.FechaRecepcion, N.FechaAtencion,
            DATEDIFF(DAY, N.FechaRecepcion, ISNULL(N.FechaAtencion, CAST(GETDATE() AS DATE))) AS DiasTranscurridos,
            N.NumeroResolucion, N.EsResolucion, N.Favorable
        FROM NOTIFICACION_OJ N
        INNER JOIN EXPEDIENTE E ON N.Expediente_ID = E.ID
        INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        INNER JOIN TIPO_NOTIFICACION_OJ TN ON N.Tipo_ID = TN.ID
        INNER JOIN ESTADO_NOTIFICACION_OJ EN ON N.Estado_ID = EN.ID
        INNER JOIN JUZGADO J ON N.Juzgado_ID = J.ID
        WHERE (@FechaInicio IS NULL OR N.FechaRecepcion >= @FechaInicio)
            AND (@FechaFin IS NULL OR N.FechaRecepcion <= @FechaFin)
            AND (@Tipo_ID IS NULL OR N.Tipo_ID = @Tipo_ID)
            AND (@Estado_ID IS NULL OR N.Estado_ID = @Estado_ID)
            AND (@Juzgado_ID IS NULL OR N.Juzgado_ID = @Juzgado_ID)
            AND (@SoloPendientes = 0 OR N.Estado_ID <> @EstadoAtendida)
        ORDER BY CASE WHEN N.Estado_ID = @EstadoAtendida THEN 1 ELSE 0 END,
                 DiasTranscurridos DESC;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

PRINT 'SP de reportes corregido correctamente.';
PRINT 'Se reemplazaron subqueries dentro de SUM() con variables declaradas.';
