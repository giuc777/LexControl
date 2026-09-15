-- ============================================
-- Fix: Corregir SPs de reportes con errores de agregacion sobre subquery
-- Los SPs usan subqueries dentro de SUM(CASE WHEN ...) lo cual causa
-- error en SQL Server. Solucion: usar variables para los IDs.
-- ============================================

-- ============================================================
-- 1. SP_Reporte_NotificacionesOJ (lineas 70-71 del error)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_Reporte_NotificacionesOJ
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

-- ============================================================
-- 2. SP_Reporte_Diligencias (lineas 16-17 del error)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_Reporte_Diligencias
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Tipo_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoCompletada INT = (SELECT ID FROM ESTADO_DILIGENCIA WHERE Nombre = 'Completada');

        SELECT
            TD.Nombre AS Tipo, TD.Color AS Color,
            COUNT(*) AS Cantidad,
            SUM(CASE WHEN D.Estado_ID = @EstadoCompletada THEN 1 ELSE 0 END) AS Completadas,
            SUM(CASE WHEN D.Estado_ID <> @EstadoCompletada THEN 1 ELSE 0 END) AS Pendientes
        FROM DILIGENCIA D
        INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
        WHERE (@FechaInicio IS NULL OR D.Fecha >= @FechaInicio)
            AND (@FechaFin IS NULL OR D.Fecha <= @FechaFin)
            AND (@Tipo_ID IS NULL OR D.Tipo_ID = @Tipo_ID)
            AND (@Estado_ID IS NULL OR D.Estado_ID = @Estado_ID)
            AND (@Usuario_ID IS NULL OR D.Usuario_ID = @Usuario_ID)
        GROUP BY TD.Nombre, TD.Color, TD.Orden
        ORDER BY TD.Orden;

        SELECT
            D.Titulo, E.NoExpediente, P.NombreCompleto AS Vinculado,
            TD.Nombre AS Tipo, ED.Nombre AS Estado,
            D.Fecha, D.HoraInicio, D.Ubicacion, D.TiempoDedicado,
            UP.NombreCompleto AS Encargado
        FROM DILIGENCIA D
        LEFT JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
        LEFT JOIN CLIENTE C ON D.Cliente_ID = C.ID
        LEFT JOIN PERSONA P ON C.Persona_ID = P.ID
        INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
        INNER JOIN ESTADO_DILIGENCIA ED ON D.Estado_ID = ED.ID
        INNER JOIN USUARIO U ON D.Usuario_ID = U.ID
        INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
        WHERE (@FechaInicio IS NULL OR D.Fecha >= @FechaInicio)
            AND (@FechaFin IS NULL OR D.Fecha <= @FechaFin)
            AND (@Tipo_ID IS NULL OR D.Tipo_ID = @Tipo_ID)
            AND (@Estado_ID IS NULL OR D.Estado_ID = @Estado_ID)
            AND (@Usuario_ID IS NULL OR D.Usuario_ID = @Usuario_ID)
        ORDER BY D.Fecha, D.HoraInicio;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

-- ============================================================
-- 3. SP_Reporte_EventosAgendaMes (linea 21 del error)
-- ============================================================
CREATE OR ALTER PROCEDURE SP_Reporte_EventosAgendaMes
    @Anio INT = NULL,
    @Mes INT = NULL,
    @TipoEvento NVARCHAR(20) = NULL,
    @Estado_ID INT = NULL,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @MesSel INT = ISNULL(@Mes, MONTH(GETDATE()));
        DECLARE @AnioSel INT = ISNULL(@Anio, YEAR(GETDATE()));
        IF @MesSel < 1 OR @MesSel > 12 SET @MesSel = MONTH(GETDATE());
        DECLARE @FechaInicio DATE = DATEFROMPARTS(@AnioSel, @MesSel, 1);
        DECLARE @FechaFin DATE = EOMONTH(@FechaInicio);
        DECLARE @EstadoPendiente INT = (SELECT ID FROM ESTADO_EVENTO WHERE Nombre = 'Pendiente');

        SELECT
            EB.TipoEvento,
            COUNT(*) AS Cantidad,
            SUM(CASE WHEN EB.Estado_ID = @EstadoPendiente THEN 1 ELSE 0 END) AS Pendientes
        FROM EVENTO_BASE EB
        WHERE EB.Fecha BETWEEN @FechaInicio AND @FechaFin
            AND (@TipoEvento IS NULL OR EB.TipoEvento = @TipoEvento)
            AND (@Estado_ID IS NULL OR EB.Estado_ID = @Estado_ID)
            AND (@Usuario_ID IS NULL OR EB.CreadoPor = @Usuario_ID)
        GROUP BY EB.TipoEvento
        ORDER BY Cantidad DESC;

        SELECT
            EB.Titulo, EB.TipoEvento, EE.Nombre AS Estado,
            EB.Fecha, EB.HoraInicio, EB.HoraFin, EB.Ubicacion,
            EB.Prioridad, E.NoExpediente, P.NombreCompleto AS Cliente,
            COALESCE(EA.TipoAudiencia, ED.TipoDiligencia, EP.TipoPlazo, NULL) AS Subtipo,
            EP.FechaVencimiento, EP.DiasRestantes
        FROM EVENTO_BASE EB
        INNER JOIN ESTADO_EVENTO EE ON EB.Estado_ID = EE.ID
        LEFT JOIN EXPEDIENTE E ON EB.Expediente_ID = E.ID
        LEFT JOIN CLIENTE C ON EB.Cliente_ID = C.ID
        LEFT JOIN PERSONA P ON C.Persona_ID = P.ID
        LEFT JOIN EVENTO_AUDIENCIA EA ON EB.ID = EA.Evento_ID
        LEFT JOIN EVENTO_DILIGENCIA ED ON EB.ID = ED.Evento_ID
        LEFT JOIN EVENTO_PLAZO EP ON EB.ID = EP.Evento_ID
        WHERE EB.Fecha BETWEEN @FechaInicio AND @FechaFin
            AND (@TipoEvento IS NULL OR EB.TipoEvento = @TipoEvento)
            AND (@Estado_ID IS NULL OR EB.Estado_ID = @Estado_ID)
            AND (@Usuario_ID IS NULL OR EB.CreadoPor = @Usuario_ID)
        ORDER BY EB.Fecha, EB.HoraInicio;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

PRINT 'SPs de reportes corregidos correctamente.';
PRINT 'Se reemplazaron subqueries dentro de SUM() con variables declaradas.';
