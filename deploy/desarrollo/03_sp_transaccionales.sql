-- ============================================================
-- LEXCONTROL - 03_sp_transaccionales.sql
-- Procedimientos TRANSACCIONALES / multi-tabla
--
-- Criterio: el SP referencia DOS o mas tablas (joins, DML multiple o transaccion explicita).
-- Total: 72 procedimientos almacenados (definicion
-- consolidada: cuando un SP se redefine en varios scripts de
-- ScriptsDB/ se conserva la ULTIMA definicion por orden numerico).
-- Requiere ejecutar antes 01_schema.sql.
-- ============================================================

USE DBLexControl;
GO
SET ANSI_NULLS ON;
GO
-- sqlcmd arranca con QUOTED_IDENTIFIER OFF: obligatorio ON
-- (PERSONA tiene el indice filtrado UX_PERSONA_DPI).
SET QUOTED_IDENTIFIER ON;
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Cliente_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_ObtenerPorID @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        C.ID AS ClienteID, P.*,
        C.TelefonoSecundario, C.EmailSecundario, C.TipoCliente,
        C.Notas AS ClienteNotas, C.Activo AS ClienteActivo
    FROM CLIENTE C
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    WHERE C.ID = @ID;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Cliente_Buscar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_Buscar
    @Nombre NVARCHAR(100) = NULL,
    @DPI NVARCHAR(20) = NULL,
    @Telefono NVARCHAR(20) = NULL,
    @Email NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        C.ID AS ClienteID, P.NombreCompleto, P.DPI, P.TelefonoPrincipal,
        P.EmailPrincipal, C.TelefonoSecundario, C.EmailSecundario,
        C.TipoCliente, C.Notas
    FROM CLIENTE C
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    WHERE (@Nombre IS NULL OR P.NombreCompleto LIKE '%' + @Nombre + '%')
      AND (@DPI IS NULL OR P.DPI = @DPI)
      AND (@Telefono IS NULL OR P.TelefonoPrincipal = @Telefono OR C.TelefonoSecundario = @Telefono)
      AND (@Email IS NULL OR P.EmailPrincipal = @Email OR C.EmailSecundario = @Email)
      AND C.Activo = 1;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Expediente_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Expediente_ObtenerPorID @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        E.*,
        P.NombreCompleto AS ClienteNombre,
        RP.Nombre AS RolProcesal,
        R.Nombre AS RamaNombre,
        R.Color AS RamaColor,
        ES.Nombre AS EstadoNombre,
        ES.Color AS EstadoColor,
        J.Nombre AS JuzgadoNombre,
        UP.NombreCompleto AS AbogadoNombre
    FROM EXPEDIENTE E
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN ROL_PROCESAL RP ON E.Rol_Procesal_ID = RP.ID
    INNER JOIN RAMA R ON E.Rama_ID = R.ID
    INNER JOIN ESTADO_EXPEDIENTE ES ON E.Estado_ID = ES.ID
    INNER JOIN JUZGADO J ON E.Juzgado_ID = J.ID
    INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE E.ID = @ID;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Expediente_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Expediente_Listar
    @Cliente_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Rama_ID INT = NULL,
    @Usuario_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @NoExpediente NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        E.ID, E.NoExpediente,
        P.NombreCompleto AS Cliente,
        RP.Nombre AS RolProcesal,
        R.Nombre AS Rama,
        ES.Nombre AS Estado,
        ES.Color AS EstadoColor,
        E.FechaIngreso,
        UP.NombreCompleto AS Abogado
    FROM EXPEDIENTE E
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN ROL_PROCESAL RP ON E.Rol_Procesal_ID = RP.ID
    INNER JOIN RAMA R ON E.Rama_ID = R.ID
    INNER JOIN ESTADO_EXPEDIENTE ES ON E.Estado_ID = ES.ID
    INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE (@Cliente_ID IS NULL OR E.Cliente_ID = @Cliente_ID)
      AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
      AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
      AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
      AND (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
      AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
      AND (@NoExpediente IS NULL OR E.NoExpediente LIKE '%' + @NoExpediente + '%')
    ORDER BY E.FechaIngreso DESC;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Expediente_CambiarEstado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Expediente_CambiarEstado
    @ID INT,
    @NuevoEstado_ID INT,
    @FechaCierre DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE EXPEDIENTE
        SET Estado_ID = @NuevoEstado_ID,
            FechaCierre = CASE WHEN @NuevoEstado_ID = (SELECT ID FROM ESTADO_EXPEDIENTE WHERE Nombre = 'Cerrado')
                               THEN ISNULL(@FechaCierre, GETDATE())
                               ELSE FechaCierre END,
            FechaModificacion = GETDATE()
        WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Expediente_Eliminar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Expediente_Eliminar
    @ID INT,
    @Usuario_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @Audiencias INT, @Tramites INT, @Diligencias INT;
        SELECT @Audiencias = COUNT(*) FROM AUDIENCIA WHERE Expediente_ID = @ID AND Estado_ID = (SELECT ID FROM ESTADO_AUDIENCIA WHERE Nombre = 'Programada');
        SELECT @Tramites = COUNT(*) FROM TRAMITE WHERE Expediente_ID = @ID AND Estado_ID = (SELECT ID FROM ESTADO_TRAMITE WHERE Nombre = 'Ingresado');
        SELECT @Diligencias = COUNT(*) FROM DILIGENCIA WHERE Expediente_ID = @ID AND Estado_ID = (SELECT ID FROM ESTADO_DILIGENCIA WHERE Nombre = 'Pendiente');
        IF @Audiencias > 0 OR @Tramites > 0 OR @Diligencias > 0
        BEGIN
            ROLLBACK;
            RETURN -1;
        END
        DELETE FROM EXPEDIENTE WHERE ID = @ID;
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Audiencia_RegistrarResultado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Audiencia_RegistrarResultado
    @ID INT,
    @Resultado_ID INT,
    @DescripcionResultado NVARCHAR(1000),
    @ProximaActuacion NVARCHAR(200) = NULL,
    @UsuarioModificacion_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE AUDIENCIA
        SET Resultado_ID = @Resultado_ID,
            DescripcionResultado = @DescripcionResultado,
            ProximaActuacion = @ProximaActuacion,
            Estado_ID = (SELECT ID FROM ESTADO_AUDIENCIA WHERE Nombre = 'Realizada')
        WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Audiencia_Proximas
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Audiencia_Proximas
    @Dias INT = 30,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @FechaFin DATE = DATEADD(DAY, @Dias, GETDATE());
    SELECT
        A.ID, A.Fecha, A.HoraInicio,
        E.NoExpediente, P.NombreCompleto AS Cliente,
        TA.Nombre AS Tipo, J.Nombre AS Juzgado, A.Sala, EA.Nombre AS Estado
    FROM AUDIENCIA A
    INNER JOIN EXPEDIENTE E ON A.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_AUDIENCIA TA ON A.Tipo_ID = TA.ID
    INNER JOIN ESTADO_AUDIENCIA EA ON A.Estado_ID = EA.ID
    INNER JOIN JUZGADO J ON A.Juzgado_ID = J.ID
    WHERE A.Fecha BETWEEN CAST(GETDATE() AS DATE) AND @FechaFin
      AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
      AND A.Estado_ID = (SELECT ID FROM ESTADO_AUDIENCIA WHERE Nombre = 'Programada')
    ORDER BY A.Fecha ASC, A.HoraInicio ASC;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_NotificacionOJ_Atender
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotificacionOJ_Atender
    @ID INT,
    @FechaAtencion DATE = NULL,
    @Notas NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @FechaAtencion IS NULL SET @FechaAtencion = GETDATE();
        UPDATE NOTIFICACION_OJ
        SET Estado_ID = (SELECT ID FROM ESTADO_NOTIFICACION_OJ WHERE Nombre = 'Atendida'),
            FechaAtencion = @FechaAtencion,
            Notas = ISNULL(@Notas, Notas)
        WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [13-NotificacionesOJ-Completar.sql] SP_NotificacionOJ_VerificarDuplicado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotificacionOJ_VerificarDuplicado
    @Expediente_ID INT,
    @NumeroResolucion NVARCHAR(50) = NULL,
    @NumeroExpedienteOJ NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ID, Resumen, FechaRecepcion
    FROM NOTIFICACION_OJ
    WHERE Expediente_ID = @Expediente_ID
      AND (@NumeroResolucion IS NULL OR NumeroResolucion = @NumeroResolucion)
      AND (@NumeroExpedienteOJ IS NULL OR NumeroExpedienteOJ = @NumeroExpedienteOJ)
      AND Estado_ID <> (SELECT ID FROM ESTADO_NOTIFICACION_OJ WHERE Nombre = 'Atendida');
END
GO

-- ------------------------------------------------------------
-- [16-Eventos-Agenda-Semanal.sql] SP_Evento_ObtenerDelDia
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_NotaExpediente_ObtenerPorExpediente
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotaExpediente_ObtenerPorExpediente @Expediente_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        NE.*,
        EN.Nombre AS EtiquetaNombre,
        EN.Color AS EtiquetaColor,
        UP.NombreCompleto AS UsuarioNombre
    FROM NOTA_EXPEDIENTE NE
    LEFT JOIN ETIQUETA_NOTA EN ON NE.Etiqueta_ID = EN.ID
    INNER JOIN USUARIO U ON NE.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE NE.Expediente_ID = @Expediente_ID
    ORDER BY NE.Prioritario DESC, NE.Fijado DESC, NE.FechaCreacion DESC;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Reporte_ExpedientesPorEstado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_ExpedientesPorEstado
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- Resumen
    SELECT
        ES.Nombre AS Estado, ES.Color AS Color,
        COUNT(*) AS Cantidad,
        CAST(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0) AS DECIMAL(5,2)) AS Porcentaje
    FROM EXPEDIENTE E
    INNER JOIN ESTADO_EXPEDIENTE ES ON E.Estado_ID = ES.ID
    WHERE (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
        AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
        AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
    GROUP BY ES.Nombre, ES.Color, ES.Orden
    ORDER BY ES.Orden;
    -- Detalle
    SELECT
        E.NoExpediente, P.NombreCompleto AS Cliente, RP.Nombre AS RolProcesal,
        R.Nombre AS Rama, ES.Nombre AS Estado, ES.Color AS EstadoColor,
        E.FechaIngreso, E.FechaCierre, UP.NombreCompleto AS Abogado
    FROM EXPEDIENTE E
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN ROL_PROCESAL RP ON E.Rol_Procesal_ID = RP.ID
    INNER JOIN RAMA R ON E.Rama_ID = R.ID
    INNER JOIN ESTADO_EXPEDIENTE ES ON E.Estado_ID = ES.ID
    INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
        AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
        AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
    ORDER BY ES.Orden, E.FechaIngreso DESC;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Reporte_PlazosVencimiento
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_PlazosVencimiento
    @Usuario_ID INT = NULL,
    @DiasAnticipacion INT = 15
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @FechaActual DATE = GETDATE();
    DECLARE @FechaLimite DATE = DATEADD(DAY, @DiasAnticipacion, @FechaActual);
    SELECT
        EB.ID, EB.Titulo, EP.FechaVencimiento, EP.DiasRestantes, EP.TipoPlazo,
        E.NoExpediente, P.NombreCompleto AS Cliente, EB.Prioridad, EB.ColorEvento,
        CASE
            WHEN EP.FechaVencimiento < @FechaActual THEN 'VENCIDO'
            WHEN EP.FechaVencimiento = @FechaActual THEN 'VENCE HOY'
            WHEN EP.FechaVencimiento <= DATEADD(DAY, 3, @FechaActual) THEN 'URGENTE'
            ELSE 'PRÓXIMO'
        END AS NivelUrgencia
    FROM EVENTO_BASE EB
    INNER JOIN EVENTO_PLAZO EP ON EB.ID = EP.Evento_ID
    INNER JOIN EXPEDIENTE E ON EB.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    WHERE EB.TipoEvento = 'Plazo'
      AND EP.FechaVencimiento <= @FechaLimite
      AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
      AND EB.Estado_ID = (SELECT ID FROM ESTADO_EVENTO WHERE Nombre = 'Pendiente')
    ORDER BY
        CASE WHEN EP.FechaVencimiento < @FechaActual THEN 0 ELSE 1 END,
        EP.FechaVencimiento ASC;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Reporte_ExpedientesPorRama
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_ExpedientesPorRama
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Estado_ID INT = NULL,
    @Rama_ID INT = NULL,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            R.Nombre AS Rama, R.Color AS Color,
            COUNT(*) AS Cantidad,
            CAST(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0) AS DECIMAL(5,2)) AS Porcentaje
        FROM EXPEDIENTE E
        INNER JOIN RAMA R ON E.Rama_ID = R.ID
        WHERE (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
            AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
            AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
            AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
            AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
        GROUP BY R.Nombre, R.Color, R.Orden
        ORDER BY R.Orden;
        SELECT
            E.NoExpediente, P.NombreCompleto AS Cliente,
            R.Nombre AS Rama, R.Color AS RamaColor,
            ES.Nombre AS Estado, ES.Color AS EstadoColor,
            J.Nombre AS Juzgado, E.FechaIngreso,
            UP.NombreCompleto AS Abogado
        FROM EXPEDIENTE E
        INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        INNER JOIN RAMA R ON E.Rama_ID = R.ID
        INNER JOIN ESTADO_EXPEDIENTE ES ON E.Estado_ID = ES.ID
        INNER JOIN JUZGADO J ON E.Juzgado_ID = J.ID
        INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
        INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
        WHERE (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
            AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
            AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
            AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
            AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
        ORDER BY R.Orden, E.FechaIngreso DESC;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Reporte_ExpedientesPorJuzgado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_ExpedientesPorJuzgado
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Estado_ID INT = NULL,
    @Juzgado_ID INT = NULL,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            J.Nombre AS Juzgado, TJ.Nombre AS TipoJuzgado,
            COUNT(*) AS Cantidad,
            CAST(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0) AS DECIMAL(5,2)) AS Porcentaje
        FROM EXPEDIENTE E
        INNER JOIN JUZGADO J ON E.Juzgado_ID = J.ID
        INNER JOIN TIPO_JUZGADO TJ ON J.Tipo_Juzgado_ID = TJ.ID
        WHERE (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
            AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
            AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
            AND (@Juzgado_ID IS NULL OR E.Juzgado_ID = @Juzgado_ID)
            AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
        GROUP BY J.Nombre, TJ.Nombre, J.FechaCreacion
        ORDER BY Cantidad DESC;
        SELECT
            E.NoExpediente, P.NombreCompleto AS Cliente,
            J.Nombre AS Juzgado, TJ.Nombre AS TipoJuzgado,
            ES.Nombre AS Estado, R.Nombre AS Rama,
            E.FechaIngreso, UP.NombreCompleto AS Abogado
        FROM EXPEDIENTE E
        INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        INNER JOIN JUZGADO J ON E.Juzgado_ID = J.ID
        INNER JOIN TIPO_JUZGADO TJ ON J.Tipo_Juzgado_ID = TJ.ID
        INNER JOIN ESTADO_EXPEDIENTE ES ON E.Estado_ID = ES.ID
        INNER JOIN RAMA R ON E.Rama_ID = R.ID
        INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
        INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
        WHERE (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
            AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
            AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
            AND (@Juzgado_ID IS NULL OR E.Juzgado_ID = @Juzgado_ID)
            AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
        ORDER BY J.Nombre, E.FechaIngreso DESC;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Reporte_AntiguedadExpedientes
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_AntiguedadExpedientes
    @Estado_ID INT = NULL,
    @Rama_ID INT = NULL,
    @Juzgado_ID INT = NULL,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @FechaActual DATE = CAST(GETDATE() AS DATE);
        SELECT
            Rango AS RangoAntiguedad,
            COUNT(*) AS Cantidad,
            CAST(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0) AS DECIMAL(5,2)) AS Porcentaje
        FROM (
            SELECT
                CASE
                    WHEN DATEDIFF(DAY, E.FechaIngreso, @FechaActual) <= 30 THEN '<= 30 dias'
                    WHEN DATEDIFF(DAY, E.FechaIngreso, @FechaActual) <= 90 THEN '31 - 90 dias'
                    WHEN DATEDIFF(DAY, E.FechaIngreso, @FechaActual) <= 180 THEN '91 - 180 dias'
                    ELSE 'mas de 180 dias'
                END AS Rango
            FROM EXPEDIENTE E
            WHERE (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
                AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
                AND (@Juzgado_ID IS NULL OR E.Juzgado_ID = @Juzgado_ID)
                AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
        ) A
        GROUP BY Rango
        ORDER BY
            CASE Rango
                WHEN '<= 30 dias' THEN 1
                WHEN '31 - 90 dias' THEN 2
                WHEN '91 - 180 dias' THEN 3
                ELSE 4
            END;
        SELECT
            E.NoExpediente, P.NombreCompleto AS Cliente,
            R.Nombre AS Rama, J.Nombre AS Juzgado,
            ES.Nombre AS Estado, E.FechaIngreso,
            DATEDIFF(DAY, E.FechaIngreso, @FechaActual) AS DiasTranscurridos,
            CASE
                WHEN DATEDIFF(DAY, E.FechaIngreso, @FechaActual) <= 30 THEN '<= 30 dias'
                WHEN DATEDIFF(DAY, E.FechaIngreso, @FechaActual) <= 90 THEN '31 - 90 dias'
                WHEN DATEDIFF(DAY, E.FechaIngreso, @FechaActual) <= 180 THEN '91 - 180 dias'
                ELSE 'mas de 180 dias'
            END AS RangoAntiguedad,
            UP.NombreCompleto AS Abogado
        FROM EXPEDIENTE E
        INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        INNER JOIN RAMA R ON E.Rama_ID = R.ID
        INNER JOIN JUZGADO J ON E.Juzgado_ID = J.ID
        INNER JOIN ESTADO_EXPEDIENTE ES ON E.Estado_ID = ES.ID
        INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
        INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
        WHERE (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
            AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
            AND (@Juzgado_ID IS NULL OR E.Juzgado_ID = @Juzgado_ID)
            AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
        ORDER BY DiasTranscurridos DESC;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Reporte_ActividadAudiencias
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_ActividadAudiencias
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Tipo_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Juzgado_ID INT = NULL,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT EA.Nombre AS Estado, EA.Color AS Color,
               COUNT(*) AS Cantidad,
               CAST(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0) AS DECIMAL(5,2)) AS Porcentaje
        FROM AUDIENCIA A
        INNER JOIN ESTADO_AUDIENCIA EA ON A.Estado_ID = EA.ID
        WHERE (@FechaInicio IS NULL OR A.Fecha >= @FechaInicio)
            AND (@FechaFin IS NULL OR A.Fecha <= @FechaFin)
            AND (@Tipo_ID IS NULL OR A.Tipo_ID = @Tipo_ID)
            AND (@Estado_ID IS NULL OR A.Estado_ID = @Estado_ID)
            AND (@Juzgado_ID IS NULL OR A.Juzgado_ID = @Juzgado_ID)
            AND (@Usuario_ID IS NULL OR A.Usuario_Creacion_ID = @Usuario_ID)
        GROUP BY EA.Nombre, EA.Color, EA.Orden
        ORDER BY EA.Orden;
        SELECT RA.Nombre AS Resultado, RA.Color AS Color, COUNT(*) AS Cantidad
        FROM AUDIENCIA A
        INNER JOIN RESULTADO_AUDIENCIA RA ON A.Resultado_ID = RA.ID
        WHERE A.Estado_ID = (SELECT ID FROM ESTADO_AUDIENCIA WHERE Nombre = 'Realizada')
            AND (@FechaInicio IS NULL OR A.Fecha >= @FechaInicio)
            AND (@FechaFin IS NULL OR A.Fecha <= @FechaFin)
            AND (@Tipo_ID IS NULL OR A.Tipo_ID = @Tipo_ID)
            AND (@Juzgado_ID IS NULL OR A.Juzgado_ID = @Juzgado_ID)
            AND (@Usuario_ID IS NULL OR A.Usuario_Creacion_ID = @Usuario_ID)
        GROUP BY RA.Nombre, RA.Color, RA.Orden
        ORDER BY Cantidad DESC;
        SELECT
            E.NoExpediente, P.NombreCompleto AS Cliente,
            TA.Nombre AS Tipo, EA.Nombre AS Estado,
            RA.Nombre AS Resultado, A.Fecha, A.HoraInicio,
            J.Nombre AS Juzgado, A.Sala, A.ProximaActuacion
        FROM AUDIENCIA A
        INNER JOIN EXPEDIENTE E ON A.Expediente_ID = E.ID
        INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        INNER JOIN TIPO_AUDIENCIA TA ON A.Tipo_ID = TA.ID
        INNER JOIN ESTADO_AUDIENCIA EA ON A.Estado_ID = EA.ID
        LEFT JOIN RESULTADO_AUDIENCIA RA ON A.Resultado_ID = RA.ID
        INNER JOIN JUZGADO J ON A.Juzgado_ID = J.ID
        WHERE (@FechaInicio IS NULL OR A.Fecha >= @FechaInicio)
            AND (@FechaFin IS NULL OR A.Fecha <= @FechaFin)
            AND (@Tipo_ID IS NULL OR A.Tipo_ID = @Tipo_ID)
            AND (@Estado_ID IS NULL OR A.Estado_ID = @Estado_ID)
            AND (@Juzgado_ID IS NULL OR A.Juzgado_ID = @Juzgado_ID)
            AND (@Usuario_ID IS NULL OR A.Usuario_Creacion_ID = @Usuario_ID)
        ORDER BY A.Fecha, A.HoraInicio;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

-- ------------------------------------------------------------
-- [14-Reportes-Completar.sql] SP_Reporte_GestionTramites
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_GestionTramites
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Tipo_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Institucion NVARCHAR(100) = NULL,
    @Usuario_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Resuelto INT = (SELECT ID FROM ESTADO_TRAMITE WHERE Nombre = 'Resuelto');
        DECLARE @Rechazado INT = (SELECT ID FROM ESTADO_TRAMITE WHERE Nombre = 'Rechazado');

        -- Resumen por tipo
        SELECT
            TT.Nombre AS Tipo,
            TT.Color AS Color,
            COUNT(*) AS Ingresados,
            SUM(CASE WHEN T.Estado_ID = @Resuelto THEN 1 ELSE 0 END) AS Resueltos,
            SUM(CASE WHEN T.Estado_ID <> @Resuelto AND T.Estado_ID <> @Rechazado THEN 1 ELSE 0 END) AS Pendientes,
            CAST(AVG(CASE WHEN T.FechaResolucion IS NOT NULL
                          THEN DATEDIFF(DAY, T.FechaIngreso, T.FechaResolucion) END) AS DECIMAL(8,1)) AS PromedioDiasResolucion
        FROM TRAMITE T
        INNER JOIN TIPO_TRAMITE TT ON T.Tipo_ID = TT.ID
        WHERE (@FechaInicio IS NULL OR T.FechaIngreso >= @FechaInicio)
          AND (@FechaFin IS NULL OR T.FechaIngreso <= @FechaFin)
          AND (@Tipo_ID IS NULL OR T.Tipo_ID = @Tipo_ID)
          AND (@Estado_ID IS NULL OR T.Estado_ID = @Estado_ID)
          AND (@Institucion IS NULL OR T.Institucion = @Institucion)
          AND (@Usuario_ID IS NULL OR EXISTS (SELECT 1 FROM EXPEDIENTE EE WHERE EE.ID = T.Expediente_ID AND EE.Usuario_ID = @Usuario_ID))
        GROUP BY TT.Nombre, TT.Color, TT.Orden
        ORDER BY TT.Orden;

        -- Detalle
        SELECT
            E.NoExpediente,
            P.NombreCompleto AS Cliente,
            TT.Nombre AS Tipo,
            T.Institucion,
            ET.Nombre AS Estado,
            T.FechaIngreso,
            T.FechaResolucion,
            DATEDIFF(DAY, T.FechaIngreso, ISNULL(T.FechaResolucion, GETDATE())) AS DiasGestion,
            T.OficioReferencia,
            T.ResumenResolucion
        FROM TRAMITE T
        INNER JOIN EXPEDIENTE E ON T.Expediente_ID = E.ID
        INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        INNER JOIN TIPO_TRAMITE TT ON T.Tipo_ID = TT.ID
        INNER JOIN ESTADO_TRAMITE ET ON T.Estado_ID = ET.ID
        WHERE (@FechaInicio IS NULL OR T.FechaIngreso >= @FechaInicio)
          AND (@FechaFin IS NULL OR T.FechaIngreso <= @FechaFin)
          AND (@Tipo_ID IS NULL OR T.Tipo_ID = @Tipo_ID)
          AND (@Estado_ID IS NULL OR T.Estado_ID = @Estado_ID)
          AND (@Institucion IS NULL OR T.Institucion = @Institucion)
          AND (@Usuario_ID IS NULL OR EXISTS (SELECT 1 FROM EXPEDIENTE EE WHERE EE.ID = T.Expediente_ID AND EE.Usuario_ID = @Usuario_ID))
        ORDER BY ET.Orden, T.FechaIngreso;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [10-Reportes-FixSubquery.sql] SP_Reporte_NotificacionesOJ
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [10-Reportes-FixSubquery.sql] SP_Reporte_Diligencias
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Reporte_AlertasPendientes
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_AlertasPendientes
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @TipoAlerta NVARCHAR(30) = NULL,
    @SoloNoLeidas BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            A.TipoAlerta,
            COUNT(*) AS Cantidad,
            SUM(CASE WHEN A.Leida = 0 THEN 1 ELSE 0 END) AS NoLeidas
        FROM ALERTA A
        WHERE A.Estado = 'Activa'
            AND (@FechaInicio IS NULL OR A.FechaAlerta >= @FechaInicio)
            AND (@FechaFin IS NULL OR A.FechaAlerta <= @FechaFin)
            AND (@TipoAlerta IS NULL OR A.TipoAlerta = @TipoAlerta)
        GROUP BY A.TipoAlerta
        ORDER BY Cantidad DESC;
        SELECT
            A.Titulo, A.TipoAlerta, A.Descripcion, A.FechaAlerta,
            DATEDIFF(DAY, A.FechaAlerta, CAST(GETDATE() AS DATE)) AS DiasTranscurridos,
            A.Referencia_Tabla, A.Referencia_ID, A.Leida, E.NoExpediente
        FROM ALERTA A
        INNER JOIN EXPEDIENTE E ON A.Expediente_ID = E.ID
        WHERE A.Estado = 'Activa'
            AND (@FechaInicio IS NULL OR A.FechaAlerta >= @FechaInicio)
            AND (@FechaFin IS NULL OR A.FechaAlerta <= @FechaFin)
            AND (@TipoAlerta IS NULL OR A.TipoAlerta = @TipoAlerta)
            AND (@SoloNoLeidas = 0 OR A.Leida = 0)
        ORDER BY CASE WHEN A.Leida = 0 THEN 0 ELSE 1 END, A.FechaAlerta;
    END TRY
    BEGIN CATCH THROW; END CATCH
END
GO

-- ------------------------------------------------------------
-- [10-Reportes-FixSubquery.sql] SP_Reporte_EventosAgendaMes
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Catalogo_ObtenerTodos
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Catalogo_ObtenerTodos
AS
BEGIN
    SET NOCOUNT ON;
    -- 1. Ramas
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM RAMA WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 2. Estados Expediente
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM ESTADO_EXPEDIENTE WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 3. Tipos Audiencia
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM TIPO_AUDIENCIA WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 4. Estados Audiencia
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM ESTADO_AUDIENCIA WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 5. Resultados Audiencia
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM RESULTADO_AUDIENCIA WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 6. Tipos Trámite
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM TIPO_TRAMITE WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 7. Estados Trámite
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM ESTADO_TRAMITE WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 8. Tipos Diligencia
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM TIPO_DILIGENCIA WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 9. Estados Diligencia
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM ESTADO_DILIGENCIA WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 10. Tipos Notificación OJ
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM TIPO_NOTIFICACION_OJ WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 11. Estados Notificación OJ
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM ESTADO_NOTIFICACION_OJ WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 12. Tipos Proceso
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM TIPO_PROCESO WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 13. Etiquetas Nota
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM ETIQUETA_NOTA WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 14. Estados Evento
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM ESTADO_EVENTO WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 15. Tipos Juzgado
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM TIPO_JUZGADO WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 16. Roles Procesales
    SELECT ID, Nombre, Valor, Descripcion, Color, Orden
    FROM ROL_PROCESAL WHERE Activo = 1 ORDER BY Orden, Nombre;
    -- 17. Juzgados con ubicación
    SELECT
        J.ID, J.Nombre, TJ.Nombre AS TipoJuzgado,
        M.Nombre AS Municipio, D.Nombre AS Departamento
    FROM JUZGADO J
    INNER JOIN TIPO_JUZGADO TJ ON J.Tipo_Juzgado_ID = TJ.ID
    INNER JOIN MUNICIPIO M ON J.Municipio_ID = M.ID
    INNER JOIN DEPARTAMENTO D ON M.Departamento_ID = D.ID
    WHERE J.Activo = 1
    ORDER BY D.Nombre, J.Nombre;
    -- 18. Usuarios activos con su rol
    SELECT
        U.ID, P.NombreCompleto, U.Usuario,
        R.Nombre AS Rol, R.ID AS RolId
    FROM USUARIO U
    INNER JOIN PERSONA P ON U.Persona_ID = P.ID
    INNER JOIN ROL R ON U.Rol_ID = R.ID
    WHERE U.Bloqueado = 0 AND P.Activo = 1
    ORDER BY P.NombreCompleto;
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Usuario_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_Listar
    @FiltroNombre NVARCHAR(100) = NULL,
    @Rol_ID INT = NULL,
    @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            U.ID,
            P.NombreCompleto,
            U.Usuario,
            P.EmailPrincipal AS Email,
            P.TelefonoPrincipal AS Telefono,
            U.Rol_ID,
            R.Nombre AS Rol,
            P.Activo,
            U.Bloqueado,
            P.FechaCreacion
        FROM USUARIO U
        INNER JOIN PERSONA P ON U.Persona_ID = P.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE (@FiltroNombre IS NULL OR P.NombreCompleto LIKE '%' + @FiltroNombre + '%')
          AND (@Rol_ID IS NULL OR U.Rol_ID = @Rol_ID)
          AND (@Activo IS NULL OR P.Activo = @Activo)
        ORDER BY P.NombreCompleto;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Usuario_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            U.ID,
            P.NombreCompleto,
            U.Usuario,
            P.EmailPrincipal AS Email,
            P.TelefonoPrincipal AS Telefono,
            U.Rol_ID,
            R.Nombre AS Rol,
            P.Activo,
            U.Bloqueado,
            U.UltimoAcceso,
            P.FechaCreacion
        FROM USUARIO U
        INNER JOIN PERSONA P ON U.Persona_ID = P.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE U.ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Usuario_CrearCompleto
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_CrearCompleto
    @NombreCompleto NVARCHAR(100),
    @EmailPrincipal NVARCHAR(100) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL,
    @Usuario NVARCHAR(50),
    @Rol_ID INT,
    @ContraseñaHash NVARCHAR(255),
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;

        -- 1) Crear la persona base
        INSERT INTO PERSONA (
            NombreCompleto,
            EmailPrincipal,
            TelefonoPrincipal,
            Activo
        ) VALUES (
            @NombreCompleto,
            @EmailPrincipal,
            @TelefonoPrincipal,
            1
        );
        SET @PersonaID = SCOPE_IDENTITY();

        -- 2) Crear la cuenta de usuario asociada
        INSERT INTO USUARIO (
            Persona_ID,
            Rol_ID,
            Usuario,
            ContraseñaHash
        ) VALUES (
            @PersonaID,
            @Rol_ID,
            @Usuario,
            @ContraseñaHash
        );

        SET @NuevoID = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @NuevoID = -1;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Usuario_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_Actualizar
    @ID INT,
    @NombreCompleto NVARCHAR(100),
    @EmailPrincipal NVARCHAR(100) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL,
    @Usuario NVARCHAR(50),
    @Rol_ID INT,
    @ContraseñaHash NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;

        SELECT @PersonaID = Persona_ID
        FROM USUARIO
        WHERE ID = @ID;

        IF @PersonaID IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1; -- Usuario no encontrado
        END;

        -- 1) Actualizar cuenta y rol (contraseña solo si se envía)
        UPDATE USUARIO SET
            Usuario = @Usuario,
            Rol_ID = @Rol_ID,
            ContraseñaHash = ISNULL(@ContraseñaHash, ContraseñaHash)
        WHERE ID = @ID;

        -- 2) Actualizar datos personales. EmailPrincipal es obligatorio
        -- en el DTO, por lo que se asigna directo. TelefonoPrincipal es
        -- opcional: NULL conserva el valor actual (ISNULL).
        UPDATE PERSONA SET
            NombreCompleto = @NombreCompleto,
            EmailPrincipal = @EmailPrincipal,
            TelefonoPrincipal = ISNULL(@TelefonoPrincipal, TelefonoPrincipal),
            FechaModificacion = GETDATE()
        WHERE ID = @PersonaID;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Usuario_CambiarEstado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_CambiarEstado
    @ID INT,
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;
        DECLARE @RolNombre NVARCHAR(30);

        SELECT
            @PersonaID = U.Persona_ID,
            @RolNombre = R.Nombre
        FROM USUARIO U
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE U.ID = @ID;

        IF @PersonaID IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1; -- Usuario no encontrado
        END;

        IF @Activo = 0 AND @RolNombre = N'Administrador'
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -2; -- No se puede desactivar la cuenta de administrador
        END;

        UPDATE PERSONA SET
            Activo = @Activo,
            FechaModificacion = GETDATE(),
            UsuarioModificacion_ID = @ID
        WHERE ID = @PersonaID;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Perfil_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Perfil_Actualizar
    @Usuario_ID INT,
    @NombreCompleto NVARCHAR(100),
    @EmailPrincipal NVARCHAR(100) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE P SET
            NombreCompleto = @NombreCompleto,
            EmailPrincipal = @EmailPrincipal,
            TelefonoPrincipal = @TelefonoPrincipal,
            FechaModificacion = GETDATE(),
            UsuarioModificacion_ID = @Usuario_ID
        FROM PERSONA P
        INNER JOIN USUARIO U ON P.ID = U.Persona_ID
        WHERE U.ID = @Usuario_ID;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [99-migracion-modulo-clave.sql] SP_Permiso_ObtenerPorRol
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Permiso_ObtenerPorRol
    @Rol_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        M.Clave AS ModuloClave,
        M.Nombre AS Modulo,
        M.Ruta,
        M.Icono,
        ISNULL(PR.Activo, 0) AS Activo
    FROM MODULO M
    LEFT JOIN PERMISO_ROL PR ON M.ID = PR.Modulo_ID AND PR.Rol_ID = @Rol_ID
    WHERE M.Activo = 1
    ORDER BY M.Orden;
END
GO

-- ------------------------------------------------------------
-- [99-migracion-modulo-clave.sql] SP_Permiso_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Permiso_Actualizar
    @Rol_ID INT,
    @Modulo_Clave NVARCHAR(50),
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Modulo_ID INT = (SELECT ID FROM MODULO WHERE Clave = @Modulo_Clave);
        IF @Modulo_ID IS NULL
            THROW 50000, 'Módulo no encontrado', 1;

        IF EXISTS (SELECT 1 FROM PERMISO_ROL WHERE Rol_ID = @Rol_ID AND Modulo_ID = @Modulo_ID)
        BEGIN
            UPDATE PERMISO_ROL SET Activo = @Activo WHERE Rol_ID = @Rol_ID AND Modulo_ID = @Modulo_ID;
        END
        ELSE
        BEGIN
            INSERT INTO PERMISO_ROL (Rol_ID, Modulo_ID, Activo) VALUES (@Rol_ID, @Modulo_ID, @Activo);
        END
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_Usuario_Autenticar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_Autenticar
    @Usuario NVARCHAR(50),
    @ContraseñaHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            U.ID,
            P.NombreCompleto,
            U.Usuario,
            U.Rol_ID,
            R.Nombre AS RolNombre,
            CAST(U.Bloqueado AS BIT) AS Bloqueado,
            ISNULL(U.HashLegacy, 0) AS HashLegacy
        FROM USUARIO U
        INNER JOIN PERSONA P ON U.Persona_ID = P.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE U.Usuario = @Usuario
          AND U.ContraseñaHash = @ContraseñaHash
          AND P.Activo = 1
          AND U.Bloqueado = 0;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [99-migracion-modulo-clave.sql] SP_Permiso_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Permiso_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        R.ID AS Rol_ID,
        R.Nombre AS Rol,
        M.Clave AS ModuloClave,
        M.Nombre AS Modulo,
        M.Ruta,
        M.Icono,
        M.Orden,
        CAST(ISNULL(PR.Activo, 0) AS BIT) AS Activo
    FROM ROL R
    CROSS JOIN MODULO M
    LEFT JOIN PERMISO_ROL PR ON PR.Rol_ID = R.ID AND PR.Modulo_ID = M.ID
    WHERE R.Activo = 1 AND M.Activo = 1
    ORDER BY R.ID, M.Orden;
END
GO

-- ------------------------------------------------------------
-- [99-migracion-modulo-clave.sql] SP_Permiso_GuardarRol
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Permiso_GuardarRol
    @Rol_ID INT,
    @PermisosJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM ROL WHERE ID = @Rol_ID AND Activo = 1)
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1;
        END;

        IF @PermisosJson IS NULL OR LTRIM(RTRIM(@PermisosJson)) = ''
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -2;
        END;

        DECLARE @Conocidas TABLE (Clave NVARCHAR(50) PRIMARY KEY);
        INSERT INTO @Conocidas (Clave) SELECT Clave FROM MODULO WHERE Activo = 1;

        DECLARE @Recibidas TABLE (Clave NVARCHAR(50), Activo BIT);
        INSERT INTO @Recibidas (Clave, Activo)
        SELECT
            LTRIM(RTRIM(JSON_VALUE(value, '$.clave'))),
            CASE WHEN JSON_VALUE(value, '$.activo') = 'true' THEN 1 ELSE 0 END
        FROM OPENJSON(@PermisosJson);

        IF NOT EXISTS (SELECT 1 FROM @Recibidas)
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -2;
        END;

        IF EXISTS (
            SELECT 1 FROM @Recibidas r
            WHERE NOT EXISTS (SELECT 1 FROM @Conocidas c WHERE c.Clave = r.Clave)
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -3;
        END;

        DECLARE @NombreRol NVARCHAR(30) = (SELECT Nombre FROM ROL WHERE ID = @Rol_ID);
        IF EXISTS (
            SELECT 1 FROM @Recibidas WHERE Clave = 'dashboard' AND Activo = 0
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -4;
        END;

        IF @NombreRol = N'Administrador'
           AND EXISTS (
                SELECT 1 FROM @Recibidas
                WHERE Clave = N'ajustes' AND Activo = 0
           )
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -5;
        END;

        MERGE PERMISO_ROL AS destino
        USING (
            SELECT
                @Rol_ID AS Rol_ID,
                M.ID AS Modulo_ID,
                r.Activo
            FROM @Recibidas r
            INNER JOIN MODULO M ON M.Clave = r.Clave
        ) AS origen
        ON destino.Rol_ID = origen.Rol_ID AND destino.Modulo_ID = origen.Modulo_ID
        WHEN MATCHED THEN UPDATE SET Activo = origen.Activo
        WHEN NOT MATCHED THEN INSERT (Rol_ID, Modulo_ID, Activo)
            VALUES (origen.Rol_ID, origen.Modulo_ID, origen.Activo);

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_Usuario_ObtenerPorNombre
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_ObtenerPorNombre
    @Usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            U.ID,
            U.Persona_ID,
            U.Rol_ID,
            U.Usuario,
            U.ContraseñaHash,
            ISNULL(U.HashLegacy, 0) AS HashLegacy,
            ISNULL(U.IntentosFallidos, 0) AS IntentosFallidos,
            CAST(U.Bloqueado AS BIT) AS Bloqueado,
            P.NombreCompleto,
            P.EmailPrincipal,
            P.TelefonoPrincipal,
            R.Nombre AS Rol
        FROM USUARIO U
        INNER JOIN PERSONA P ON U.Persona_ID = P.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE U.Usuario = @Usuario
          AND P.Activo = 1;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_RefreshToken_Crear
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_RefreshToken_Crear
    @Usuario_ID INT,
    @TokenHash NVARCHAR(255),
    @FechaExpiracion DATETIME,
    @UserAgent NVARCHAR(500) = NULL,
    @IPAddress NVARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE ID = @Usuario_ID)
            RETURN -1;

        INSERT INTO REFRESH_TOKEN
            (Usuario_ID, TokenHash, FechaExpiracion, UserAgent, IPAddress)
        VALUES
            (@Usuario_ID, @TokenHash, @FechaExpiracion, @UserAgent, @IPAddress);

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_RefreshToken_Validar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_RefreshToken_Validar
    @TokenHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            RT.ID,
            RT.Usuario_ID,
            RT.FechaExpiracion,
            RT.Revocado,
            U.Usuario,
            U.Rol_ID,
            P.NombreCompleto,
            R.Nombre AS Rol
        FROM REFRESH_TOKEN RT
        INNER JOIN USUARIO U ON RT.Usuario_ID = U.ID
        INNER JOIN PERSONA P ON U.Persona_ID = P.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE RT.TokenHash = @TokenHash
          AND RT.Revocado = 0
          AND RT.FechaExpiracion > GETDATE()
          AND U.Bloqueado = 0
          AND P.Activo = 1;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [03-Expedientes.sql] SP_Expediente_ListarPaginado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Expediente_ListarPaginado
    @Cliente_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Rama_ID INT = NULL,
    @Usuario_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @NoExpediente NVARCHAR(50) = NULL,
    @Pagina INT = 1,
    @TamanioPagina INT = 20,
    @TotalRegistros INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Conteo total de registros que cumplen los filtros
    SELECT @TotalRegistros = COUNT(*)
    FROM EXPEDIENTE E
    WHERE (@Cliente_ID IS NULL OR E.Cliente_ID = @Cliente_ID)
      AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
      AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
      AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
      AND (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
      AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
      AND (@NoExpediente IS NULL OR E.NoExpediente LIKE '%' + @NoExpediente + '%');

    -- Resultados paginados
    SELECT
        E.ID,
        E.NoExpediente,
        P.NombreCompleto AS Cliente,
        E.Cliente_ID,
        RP.ID AS RolProcesalId,
        RP.Nombre AS RolProcesal,
        R.ID AS RamaId,
        R.Nombre AS Rama,
        R.Color AS RamaColor,
        E.TipoProceso,
        J.ID AS JuzgadoId,
        J.Nombre AS Juzgado,
        E.FechaIngreso,
        ES.ID AS EstadoId,
        ES.Nombre AS Estado,
        ES.Color AS EstadoColor,
        E.Descripcion,
        E.NotasInternas,
        E.FechaCierre,
        U.ID AS AbogadoId,
        UP.NombreCompleto AS Abogado,
        E.FechaCreacion,
        E.FechaModificacion,
        @TotalRegistros AS TotalRegistros
    FROM EXPEDIENTE E
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN ROL_PROCESAL RP ON E.Rol_Procesal_ID = RP.ID
    INNER JOIN RAMA R ON E.Rama_ID = R.ID
    INNER JOIN ESTADO_EXPEDIENTE ES ON E.Estado_ID = ES.ID
    INNER JOIN JUZGADO J ON E.Juzgado_ID = J.ID
    INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE (@Cliente_ID IS NULL OR E.Cliente_ID = @Cliente_ID)
      AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
      AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
      AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
      AND (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
      AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
      AND (@NoExpediente IS NULL OR E.NoExpediente LIKE '%' + @NoExpediente + '%')
    ORDER BY E.FechaIngreso DESC
    OFFSET (@Pagina - 1) * @TamanioPagina ROWS
    FETCH NEXT @TamanioPagina ROWS ONLY;
END
GO

-- ------------------------------------------------------------
-- [03-Expedientes.sql] SP_DocExpediente_ObtenerPorExpediente
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DocExpediente_ObtenerPorExpediente
    @Expediente_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        DE.ID,
        DE.Expediente_ID,
        DE.NombreArchivo,
        DE.RutaArchivo,
        DE.TipoArchivo,
        DE.Tamano,
        DE.Descripcion,
        DE.Usuario_ID,
        UP.NombreCompleto AS UsuarioNombre,
        DE.FechaSubida
    FROM DOC_EXPEDIENTE DE
    INNER JOIN USUARIO U ON DE.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE DE.Expediente_ID = @Expediente_ID
    ORDER BY DE.FechaSubida DESC;
END
GO

-- ------------------------------------------------------------
-- [04-Clientes.sql] SP_Cliente_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_Listar
    @FiltroNombre NVARCHAR(100) = NULL,
    @FiltroEstado BIT = NULL,
    @FiltroTipo NVARCHAR(20) = NULL,
    @Pagina INT = 1,
    @TamanioPagina INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Conteo total (para el frontend paginación)
        DECLARE @TotalRegistros INT;
        SELECT @TotalRegistros = COUNT(*)
        FROM CLIENTE C
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        WHERE (@FiltroNombre IS NULL OR P.NombreCompleto LIKE '%' + @FiltroNombre + '%')
          AND (@FiltroEstado IS NULL OR C.Activo = @FiltroEstado)
          AND (@FiltroTipo IS NULL OR C.TipoCliente = @FiltroTipo);

        -- Resultado principal
        SELECT
            C.ID AS ClienteID,
            P.NombreCompleto,
            P.DPI,
            P.TelefonoPrincipal,
            P.EmailPrincipal,
            P.Direccion,
            P.FechaNacimiento,
            P.Genero,
            C.TelefonoSecundario,
            C.EmailSecundario,
            C.TipoCliente,
            C.Notas AS ClienteNotas,
            C.Activo AS ClienteActivo,
            C.FechaCreacion,
            -- Conteo de expedientes del cliente
            ISNULL(E.TotalExpedientes, 0) AS TotalExpedientes,
            ISNULL(E.ExpedientesActivos, 0) AS ExpedientesActivos,
            -- Última actividad (último expediente ingresado)
            E.UltimaActividad,
            -- Para paginación: total de registros
            @TotalRegistros AS TotalRegistros
        FROM CLIENTE C
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        -- Subquery de expedientes por cliente
        LEFT JOIN (
            SELECT
                Cliente_ID,
                COUNT(*) AS TotalExpedientes,
                SUM(CASE WHEN EE.Nombre IN ('Activo', 'En Trámite') THEN 1 ELSE 0 END) AS ExpedientesActivos,
                MAX(EX.FechaIngreso) AS UltimaActividad
            FROM EXPEDIENTE EX
            LEFT JOIN ESTADO_EXPEDIENTE EE ON EX.Estado_ID = EE.ID
            GROUP BY Cliente_ID
        ) E ON E.Cliente_ID = C.ID
        WHERE (@FiltroNombre IS NULL OR P.NombreCompleto LIKE '%' + @FiltroNombre + '%')
          AND (@FiltroEstado IS NULL OR C.Activo = @FiltroEstado)
          AND (@FiltroTipo IS NULL OR C.TipoCliente = @FiltroTipo)
        ORDER BY P.NombreCompleto
        OFFSET (@Pagina - 1) * @TamanioPagina ROWS
        FETCH NEXT @TamanioPagina ROWS ONLY;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [04-Clientes.sql] SP_Cliente_Estadisticas
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_Estadisticas
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            (SELECT COUNT(*) FROM CLIENTE WHERE Activo = 1) AS TotalClientes,
            (SELECT COUNT(*) FROM CLIENTE WHERE Activo = 0) AS TotalInactivos,
            (SELECT COUNT(*) FROM EXPEDIENTE EX
             INNER JOIN ESTADO_EXPEDIENTE EE ON EX.Estado_ID = EE.ID
             WHERE EE.Nombre IN ('Activo', 'En Trámite')) AS TotalExpedientesActivos,
            (SELECT COUNT(*) FROM EXPEDIENTE) AS TotalExpedientes;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [04-Clientes.sql] SP_Cliente_ObtenerExpedientes
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_ObtenerExpedientes
    @ClienteID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            EX.ID AS ExpedienteID,
            EX.NoExpediente,
            EX.FechaIngreso,
            EX.Descripcion,
            R.Nombre AS Rama,
            EE.Nombre AS Estado,
            EE.Color AS EstadoColor,
            J.Nombre AS Juzgado,
            -- Última actuación (nota más reciente)
            NOTA.Contenido AS UltimaActuacion,
            NOTA.FechaCreacion AS FechaUltimaActuacion
        FROM EXPEDIENTE EX
        INNER JOIN RAMA R ON EX.Rama_ID = R.ID
        INNER JOIN ESTADO_EXPEDIENTE EE ON EX.Estado_ID = EE.ID
        LEFT JOIN JUZGADO J ON EX.Juzgado_ID = J.ID
        -- Subquery para obtener la última nota de cada expediente
        LEFT JOIN (
            SELECT
                Expediente_ID,
                Contenido,
                FechaCreacion,
                ROW_NUMBER() OVER (PARTITION BY Expediente_ID ORDER BY FechaCreacion DESC) AS rn
            FROM NOTA_EXPEDIENTE
        ) NOTA ON NOTA.Expediente_ID = EX.ID AND NOTA.rn = 1
        WHERE EX.Cliente_ID = @ClienteID
        ORDER BY EX.FechaIngreso DESC;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [04-Clientes.sql] SP_Cliente_Reactivar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_Reactivar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;
        SELECT @PersonaID = Persona_ID FROM CLIENTE WHERE ID = @ID;
        IF @PersonaID IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1;
        END;

        UPDATE CLIENTE SET Activo = 1 WHERE ID = @ID;
        UPDATE PERSONA SET Activo = 1, FechaModificacion = GETDATE()
        WHERE ID = @PersonaID;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Cliente_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_Actualizar
    @ID INT,
    @NombreCompleto NVARCHAR(100),
    @DPI NVARCHAR(20) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL,
    @EmailPrincipal NVARCHAR(100) = NULL,
    @TelefonoSecundario NVARCHAR(20) = NULL,
    @EmailSecundario NVARCHAR(100) = NULL,
    @Direccion NVARCHAR(200) = NULL,
    @FechaNacimiento DATE = NULL,
    @Genero CHAR(1) = NULL,
    @TipoCliente NVARCHAR(20) = NULL,
    @Notas NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;
        SELECT @PersonaID = Persona_ID FROM CLIENTE WHERE ID = @ID;
        IF @PersonaID IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1;
        END;

        UPDATE PERSONA SET
            NombreCompleto = @NombreCompleto,
            DPI = ISNULL(@DPI, DPI),
            TelefonoPrincipal = ISNULL(@TelefonoPrincipal, TelefonoPrincipal),
            EmailPrincipal = ISNULL(@EmailPrincipal, EmailPrincipal),
            Direccion = ISNULL(@Direccion, Direccion),
            FechaNacimiento = ISNULL(@FechaNacimiento, FechaNacimiento),
            Genero = ISNULL(@Genero, Genero),
            FechaModificacion = GETDATE()
        WHERE ID = @PersonaID;

        UPDATE CLIENTE SET
            TelefonoSecundario = ISNULL(@TelefonoSecundario, TelefonoSecundario),
            EmailSecundario = ISNULL(@EmailSecundario, EmailSecundario),
            TipoCliente = ISNULL(@TipoCliente, TipoCliente),
            Notas = ISNULL(@Notas, Notas)
        WHERE ID = @ID;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Cliente_Desactivar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_Desactivar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;
        SELECT @PersonaID = Persona_ID FROM CLIENTE WHERE ID = @ID;
        IF @PersonaID IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1;
        END;

        UPDATE CLIENTE SET Activo = 0 WHERE ID = @ID;
        UPDATE PERSONA SET Activo = 0, FechaModificacion = GETDATE()
        WHERE ID = @PersonaID;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Audiencia_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Audiencia_Listar
    @Expediente_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @Estado_ID INT = NULL,
    @Tipo_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        A.ID,
        A.Expediente_ID,
        E.NoExpediente,
        P.NombreCompleto AS Cliente,
        A.Fecha,
        A.HoraInicio,
        A.HoraFin,
        TA.Nombre AS Tipo,
        J.Nombre AS Juzgado,
        A.Sala,
        EA.Nombre AS Estado,
        RA.Nombre AS Resultado
    FROM AUDIENCIA A
    INNER JOIN EXPEDIENTE E ON A.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_AUDIENCIA TA ON A.Tipo_ID = TA.ID
    INNER JOIN ESTADO_AUDIENCIA EA ON A.Estado_ID = EA.ID
    LEFT JOIN RESULTADO_AUDIENCIA RA ON A.Resultado_ID = RA.ID
    INNER JOIN JUZGADO J ON A.Juzgado_ID = J.ID
    WHERE (@Expediente_ID IS NULL OR A.Expediente_ID = @Expediente_ID)
      AND (@FechaInicio IS NULL OR A.Fecha >= @FechaInicio)
      AND (@FechaFin IS NULL OR A.Fecha <= @FechaFin)
      AND (@Estado_ID IS NULL OR A.Estado_ID = @Estado_ID)
      AND (@Tipo_ID IS NULL OR A.Tipo_ID = @Tipo_ID)
    ORDER BY A.Fecha DESC, A.HoraInicio DESC;
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Audiencia_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Audiencia_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        A.*,
        E.NoExpediente,
        P.NombreCompleto AS Cliente,
        TA.Nombre AS Tipo,
        EA.Nombre AS Estado,
        RA.Nombre AS Resultado,
        J.Nombre AS Juzgado,
        UP.NombreCompleto AS UsuarioCreacionNombre
    FROM AUDIENCIA A
    INNER JOIN EXPEDIENTE E ON A.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_AUDIENCIA TA ON A.Tipo_ID = TA.ID
    INNER JOIN ESTADO_AUDIENCIA EA ON A.Estado_ID = EA.ID
    LEFT JOIN RESULTADO_AUDIENCIA RA ON A.Resultado_ID = RA.ID
    INNER JOIN JUZGADO J ON A.Juzgado_ID = J.ID
    INNER JOIN USUARIO U ON A.Usuario_Creacion_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE A.ID = @ID;
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Tramite_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Tramite_Listar
    @Expediente_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Tipo_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        T.ID,
        T.Expediente_ID,
        E.NoExpediente,
        P.NombreCompleto AS Cliente,
        TT.Nombre AS Tipo,
        T.Institucion,
        T.FechaIngreso,
        T.FechaResolucion,
        ET.Nombre AS Estado,
        T.OficioReferencia
    FROM TRAMITE T
    INNER JOIN EXPEDIENTE E ON T.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_TRAMITE TT ON T.Tipo_ID = TT.ID
    INNER JOIN ESTADO_TRAMITE ET ON T.Estado_ID = ET.ID
    WHERE (@Expediente_ID IS NULL OR T.Expediente_ID = @Expediente_ID)
      AND (@Estado_ID IS NULL OR T.Estado_ID = @Estado_ID)
      AND (@Tipo_ID IS NULL OR T.Tipo_ID = @Tipo_ID)
      AND (@FechaInicio IS NULL OR T.FechaIngreso >= @FechaInicio)
      AND (@FechaFin IS NULL OR T.FechaIngreso <= @FechaFin)
    ORDER BY T.FechaIngreso DESC;
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Tramite_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Tramite_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        T.*,
        E.NoExpediente,
        P.NombreCompleto AS Cliente,
        TT.Nombre AS Tipo,
        ET.Nombre AS Estado
    FROM TRAMITE T
    INNER JOIN EXPEDIENTE E ON T.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_TRAMITE TT ON T.Tipo_ID = TT.ID
    INNER JOIN ESTADO_TRAMITE ET ON T.Estado_ID = ET.ID
    WHERE T.ID = @ID;
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Notificacion_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Notificacion_Listar
    @Expediente_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Tipo_ID INT = NULL,
    @Juzgado_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        N.ID,
        N.Expediente_ID,
        E.NoExpediente,
        P.NombreCompleto AS Cliente,
        TN.Nombre AS Tipo,
        EN.Nombre AS Estado,
        J.Nombre AS Juzgado,
        N.FechaRecepcion,
        N.FechaAtencion,
        N.NumeroResolucion,
        N.EsResolucion,
        N.Favorable
    FROM NOTIFICACION_OJ N
    INNER JOIN EXPEDIENTE E ON N.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_NOTIFICACION_OJ TN ON N.Tipo_ID = TN.ID
    INNER JOIN ESTADO_NOTIFICACION_OJ EN ON N.Estado_ID = EN.ID
    INNER JOIN JUZGADO J ON N.Juzgado_ID = J.ID
    WHERE (@Expediente_ID IS NULL OR N.Expediente_ID = @Expediente_ID)
      AND (@Estado_ID IS NULL OR N.Estado_ID = @Estado_ID)
      AND (@Tipo_ID IS NULL OR N.Tipo_ID = @Tipo_ID)
      AND (@Juzgado_ID IS NULL OR N.Juzgado_ID = @Juzgado_ID)
      AND (@FechaInicio IS NULL OR N.FechaRecepcion >= @FechaInicio)
      AND (@FechaFin IS NULL OR N.FechaRecepcion <= @FechaFin)
    ORDER BY N.FechaRecepcion DESC;
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Notificacion_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Notificacion_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        N.*,
        E.NoExpediente,
        P.NombreCompleto AS Cliente,
        TN.Nombre AS Tipo,
        EN.Nombre AS Estado,
        J.Nombre AS Juzgado
    FROM NOTIFICACION_OJ N
    INNER JOIN EXPEDIENTE E ON N.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_NOTIFICACION_OJ TN ON N.Tipo_ID = TN.ID
    INNER JOIN ESTADO_NOTIFICACION_OJ EN ON N.Estado_ID = EN.ID
    INNER JOIN JUZGADO J ON N.Juzgado_ID = J.ID
    WHERE N.ID = @ID;
END
GO

-- ------------------------------------------------------------
-- [05-Complementarios.sql] SP_Abogado_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Abogado_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        U.ID,
        P.NombreCompleto,
        U.Usuario,
        R.Nombre AS Rol
    FROM USUARIO U
    INNER JOIN PERSONA P ON U.Persona_ID = P.ID
    INNER JOIN ROL R ON U.Rol_ID = R.ID
    WHERE R.Nombre IN (N'Abogado', N'Administrador')
      AND U.Bloqueado = 0
      AND P.Activo = 1
    ORDER BY P.NombreCompleto;
END
GO

-- ------------------------------------------------------------
-- [06-Mantenimiento_Catalogos.sql] SP_Catalogo_CambiarEstado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Catalogo_CambiarEstado
    @Tabla NVARCHAR(50),
    @ID INT,
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Tabla NOT IN (
            'RAMA', 'ESTADO_EXPEDIENTE', 'TIPO_AUDIENCIA',
            'ESTADO_AUDIENCIA', 'RESULTADO_AUDIENCIA',
            'TIPO_TRAMITE', 'ESTADO_TRAMITE',
            'TIPO_DILIGENCIA', 'ESTADO_DILIGENCIA', 'RESULTADO_DILIGENCIA',
            'TIPO_NOTIFICACION_OJ', 'ESTADO_NOTIFICACION_OJ',
            'TIPO_PROCESO', 'ETIQUETA_NOTA', 'ESTADO_EVENTO',
            'TIPO_JUZGADO', 'ROL_PROCESAL'
        )
        BEGIN
            RAISERROR('Nombre de tabla no permitido: %s', 16, 1, @Tabla);
            RETURN;
        END

        -- Si se va a desactivar, verificar integridad referencial
        IF @Activo = 0
        BEGIN
            DECLARE @UsosActivos INT = 0;
            DECLARE @Detalle VARCHAR(MAX) = '';

            -- RAMA → EXPEDIENTE (usando Rama_ID)
            IF @Tabla = 'RAMA'
            BEGIN
                SELECT @UsosActivos = COUNT(*)
                FROM EXPEDIENTE
                WHERE Rama_ID = @ID;
                
                IF @UsosActivos > 0
                    SET @Detalle = CAST(@UsosActivos AS VARCHAR) + ' expediente(s) referencia(n) esta rama.';
            END

            -- ESTADO_EXPEDIENTE → EXPEDIENTE (usando Estado_ID)
            ELSE IF @Tabla = 'ESTADO_EXPEDIENTE'
            BEGIN
                SELECT @UsosActivos = COUNT(*)
                FROM EXPEDIENTE
                WHERE Estado_ID = @ID;
                
                IF @UsosActivos > 0
                    SET @Detalle = CAST(@UsosActivos AS VARCHAR) + ' expediente(s) tiene(n) este estado.';
            END

            -- TIPO_PROCESO → EXPEDIENTE (usa campo de texto TipoProceso)
            ELSE IF @Tabla = 'TIPO_PROCESO'
            BEGIN
                DECLARE @NombreTipo NVARCHAR(50);
                SELECT @NombreTipo = Nombre FROM TIPO_PROCESO WHERE ID = @ID;

                SELECT @UsosActivos = COUNT(*)
                FROM EXPEDIENTE
                WHERE TipoProceso = @NombreTipo;

                IF @UsosActivos > 0
                    SET @Detalle = CAST(@UsosActivos AS VARCHAR) + ' expediente(s) usa(n) este tipo de proceso.';
            END

            -- ROL_PROCESAL → PARTE_PROCESAL (usando columna Rol)
            ELSE IF @Tabla = 'ROL_PROCESAL'
            BEGIN
                DECLARE @NombreRol NVARCHAR(30);
                SELECT @NombreRol = Nombre FROM ROL_PROCESAL WHERE ID = @ID;

                SELECT @UsosActivos = COUNT(*)
                FROM PARTE_PROCESAL
                WHERE Rol = @NombreRol;

                IF @UsosActivos > 0
                    SET @Detalle = CAST(@UsosActivos AS VARCHAR) + ' parte(s) procesal(es) usa(n) este rol.';
            END

            -- TIPO_JUZGADO → JUZGADO (usando Tipo_Juzgado_ID)
            ELSE IF @Tabla = 'TIPO_JUZGADO'
            BEGIN
                SELECT @UsosActivos = COUNT(*)
                FROM JUZGADO
                WHERE Tipo_Juzgado_ID = @ID;

                IF @UsosActivos > 0
                    SET @Detalle = CAST(@UsosActivos AS VARCHAR) + ' juzgado(s) tiene(n) este tipo.';
            END

            -- ETIQUETA_NOTA → NOTA_EXPEDIENTE (usando Etiqueta_ID)
            ELSE IF @Tabla = 'ETIQUETA_NOTA'
            BEGIN
                SELECT @UsosActivos = COUNT(*)
                FROM NOTA_EXPEDIENTE
                WHERE Etiqueta_ID = @ID;

                IF @UsosActivos > 0
                    SET @Detalle = CAST(@UsosActivos AS VARCHAR) + ' nota(s) usa(n) esta etiqueta.';
            END

            -- Si hay referencias, bloquear desactivación
            IF @UsosActivos > 0
            BEGIN
                RAISERROR('No se puede desactivar: %s', 16, 1, @Detalle);
                RETURN;
            END
        END

        -- Cambiar estado
        DECLARE @SqlEstado NVARCHAR(MAX) = N'
            UPDATE ' + QUOTENAME(@Tabla) + N'
            SET Activo = @Activo
            WHERE ID = @ID';

        EXEC sp_executesql @SqlEstado, N'@ID INT, @Activo BIT', @ID, @Activo;

        SELECT @ID AS ID, @Activo AS Activo;
    END TRY
    BEGIN CATCH
        SELECT ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [06-Mantenimiento_Catalogos.sql] SP_Juzgado_CambiarEstado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Juzgado_CambiarEstado
    @ID INT,
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Verificar que el juzgado existe
        IF NOT EXISTS (SELECT 1 FROM JUZGADO WHERE ID = @ID)
        BEGIN
            RAISERROR('No se encontró el juzgado con ID %d.', 16, 1, @ID);
            RETURN;
        END

        -- Si se va a desactivar, verificar si tiene expedientes asociados
        IF @Activo = 0
        BEGIN
            DECLARE @UsosActivos INT;
            
            SELECT @UsosActivos = COUNT(*)
            FROM EXPEDIENTE
            WHERE Juzgado_ID = @ID;
            
            IF @UsosActivos > 0
            BEGIN
                RAISERROR('No se puede desactivar: %d expediente(s) referencia(n) este juzgado.', 16, 1, @UsosActivos);
                RETURN;
            END
        END

        -- Actualizar el estado del juzgado
        UPDATE JUZGADO
        SET Activo = @Activo
        WHERE ID = @ID;

        SELECT @ID AS ID, @Activo AS Activo;
    END TRY
    BEGIN CATCH
        SELECT ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [07-Catalogos_Juzgados.sql] SP_Juzgado_Buscar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Juzgado_Buscar
    @Busqueda NVARCHAR(200) = NULL,
    @IncluirInactivos BIT = 0,
    @Pagina INT = 1,
    @TamanoPagina INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            J.ID, J.Nombre, J.Direccion, J.Telefono, J.Email,
            J.Tipo_Juzgado_ID, TJ.Nombre AS TipoJuzgado,
            J.Municipio_ID, M.Nombre AS Municipio,
            D.Nombre AS Departamento,
            J.Activo, J.FechaCreacion,
            COUNT(*) OVER() AS Total
        FROM JUZGADO J
        INNER JOIN TIPO_JUZGADO TJ ON J.Tipo_Juzgado_ID = TJ.ID
        LEFT JOIN MUNICIPIO M ON J.Municipio_ID = M.ID
        LEFT JOIN DEPARTAMENTO D ON M.Departamento_ID = D.ID
        WHERE (@Busqueda IS NULL OR J.Nombre LIKE '%' + @Busqueda + '%')
          AND (@IncluirInactivos = 1 OR J.Activo = 1)
        ORDER BY J.Nombre
        OFFSET (@Pagina - 1) * @TamanoPagina ROWS
        FETCH NEXT @TamanoPagina ROWS ONLY;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [07-Catalogos_Juzgados.sql] SP_Juzgado_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Juzgado_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            J.ID, J.Nombre, J.Direccion, J.Telefono, J.Email,
            J.Tipo_Juzgado_ID, TJ.Nombre AS TipoJuzgado,
            J.Municipio_ID, M.Nombre AS Municipio,
            D.Nombre AS Departamento,
            J.Activo, J.FechaCreacion
        FROM JUZGADO J
        INNER JOIN TIPO_JUZGADO TJ ON J.Tipo_Juzgado_ID = TJ.ID
        LEFT JOIN MUNICIPIO M ON J.Municipio_ID = M.ID
        LEFT JOIN DEPARTAMENTO D ON M.Departamento_ID = D.ID
        WHERE J.ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [19-Diligencias-Resultado.sql] SP_Diligencia_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Diligencia_Listar
    @Expediente_ID INT = NULL,
    @Cliente_ID INT = NULL,
    @Tipo_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Usuario_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        D.ID,
        D.Expediente_ID,
        E.NoExpediente,
        D.Cliente_ID,
        PC.NombreCompleto AS Cliente,
        TD.Nombre AS Tipo,
        D.Titulo,
        D.Fecha,
        D.HoraInicio,
        D.DiaCompleto,
        D.Ubicacion,
        D.Oficina,
        ED.Nombre AS Estado,
        RD.Nombre AS Resultado,
        D.Resultado_ID,
        D.DescripcionResultado,
        D.TiempoDedicado,
        D.RecordatorioMinutos,
        D.Usuario_ID,
        PU.NombreCompleto AS Abogado,
        D.FechaCreacion
    FROM DILIGENCIA D
    LEFT JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
    LEFT JOIN CLIENTE C ON D.Cliente_ID = C.ID
    LEFT JOIN PERSONA PC ON C.Persona_ID = PC.ID
    LEFT JOIN RESULTADO_DILIGENCIA RD ON D.Resultado_ID = RD.ID
    INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
    INNER JOIN ESTADO_DILIGENCIA ED ON D.Estado_ID = ED.ID
    INNER JOIN USUARIO U ON D.Usuario_ID = U.ID
    INNER JOIN PERSONA PU ON U.Persona_ID = PU.ID
    WHERE (@Expediente_ID IS NULL OR D.Expediente_ID = @Expediente_ID)
      AND (@Cliente_ID IS NULL OR D.Cliente_ID = @Cliente_ID)
      AND (@Tipo_ID IS NULL OR D.Tipo_ID = @Tipo_ID)
      AND (@Estado_ID IS NULL OR D.Estado_ID = @Estado_ID)
      AND (@Usuario_ID IS NULL OR D.Usuario_ID = @Usuario_ID)
      AND (@FechaInicio IS NULL OR D.Fecha >= @FechaInicio)
      AND (@FechaFin IS NULL OR D.Fecha <= @FechaFin)
      AND ED.Nombre != N'Cancelada'
    ORDER BY D.Fecha DESC, D.HoraInicio DESC;
END
GO

-- ------------------------------------------------------------
-- [19-Diligencias-Resultado.sql] SP_Diligencia_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Diligencia_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        D.ID,
        D.Expediente_ID,
        E.NoExpediente,
        D.Cliente_ID,
        PC.NombreCompleto AS Cliente,
        TD.ID AS Tipo_ID,
        TD.Nombre AS Tipo,
        TD.Color AS TipoColor,
        D.Titulo,
        D.Descripcion,
        D.Fecha,
        D.HoraInicio,
        D.DiaCompleto,
        D.Ubicacion,
        D.Oficina,
        ED.ID AS Estado_ID,
        ED.Nombre AS Estado,
        ED.Color AS EstadoColor,
        RD.ID AS Resultado_ID,
        RD.Nombre AS Resultado,
        D.DescripcionResultado,
        D.Notas,
        D.TiempoDedicado,
        D.RecordatorioMinutos,
        D.Usuario_ID,
        PU.NombreCompleto AS Abogado,
        D.FechaCreacion
    FROM DILIGENCIA D
    LEFT JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
    LEFT JOIN CLIENTE C ON D.Cliente_ID = C.ID
    LEFT JOIN PERSONA PC ON C.Persona_ID = PC.ID
    LEFT JOIN RESULTADO_DILIGENCIA RD ON D.Resultado_ID = RD.ID
    INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
    INNER JOIN ESTADO_DILIGENCIA ED ON D.Estado_ID = ED.ID
    INNER JOIN USUARIO U ON D.Usuario_ID = U.ID
    INNER JOIN PERSONA PU ON U.Persona_ID = PU.ID
    WHERE D.ID = @ID;
END
GO

-- ------------------------------------------------------------
-- [11-Diligencias-CRUD.sql] SP_Diligencia_Eliminar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Diligencia_Eliminar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoCancelada INT;
        SELECT @EstadoCancelada = ID FROM ESTADO_DILIGENCIA WHERE Nombre = N'Cancelada';

        IF @EstadoCancelada IS NULL
        BEGIN
            SET @EstadoCancelada = 4; -- Fallback: ID 4 en el seed
        END

        UPDATE DILIGENCIA SET Estado_ID = @EstadoCancelada WHERE ID = @ID;

        IF @@ROWCOUNT = 0
            RETURN -2; -- No encontrado
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [12-HistoricoLegal.sql] SP_Historico_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Historico_Listar
    @Cliente_ID INT = NULL,
    @Rama_ID INT = NULL,
    @Usuario_ID INT = NULL,
    @Busqueda NVARCHAR(100) = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        E.ID,
        E.NoExpediente,
        PC.NombreCompleto AS Cliente,
        R.Nombre AS Rama,
        E.TipoProceso,
        J.Nombre AS Juzgado,
        E.FechaIngreso,
        EE.Nombre AS Estado,
        EE.Color AS EstadoColor,
        PU.NombreCompleto AS Abogado,
        E.FechaCierre
    FROM EXPEDIENTE E
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA PC ON C.Persona_ID = PC.ID
    INNER JOIN RAMA R ON E.Rama_ID = R.ID
    INNER JOIN ESTADO_EXPEDIENTE EE ON E.Estado_ID = EE.ID
    LEFT JOIN JUZGADO J ON E.Juzgado_ID = J.ID
    LEFT JOIN USUARIO U ON E.Usuario_ID = U.ID
    LEFT JOIN PERSONA PU ON U.Persona_ID = PU.ID
    WHERE EE.Nombre IN (N'Cerrado', N'Archivado')
      AND (@Cliente_ID IS NULL OR E.Cliente_ID = @Cliente_ID)
      AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
      AND (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
      AND (@Busqueda IS NULL
           OR E.NoExpediente LIKE '%' + @Busqueda + '%'
           OR PC.NombreCompleto LIKE '%' + @Busqueda + '%')
      AND (@FechaInicio IS NULL OR E.FechaIngreso >= @FechaInicio)
      AND (@FechaFin IS NULL OR E.FechaIngreso <= @FechaFin)
    ORDER BY E.FechaCierre DESC, E.FechaIngreso DESC;
END
GO

-- ------------------------------------------------------------
-- [14-Reportes-Completar.sql] SP_Reporte_ClientesPorTipo
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_ClientesPorTipo
    @TipoCliente NVARCHAR(50) = NULL,
    @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            ISNULL(C.TipoCliente, 'Sin tipo') AS Tipo,
            COUNT(*) AS Total,
            SUM(CASE WHEN C.Activo = 1 THEN 1 ELSE 0 END) AS Activos,
            SUM(CASE WHEN C.Activo = 0 THEN 1 ELSE 0 END) AS Inactivos,
            CAST(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0) AS DECIMAL(5,2)) AS Porcentaje
        FROM CLIENTE C
        WHERE (@TipoCliente IS NULL OR C.TipoCliente = @TipoCliente)
          AND (@Activo IS NULL OR C.Activo = @Activo)
        GROUP BY C.TipoCliente
        ORDER BY Total DESC;

        SELECT
            P.NombreCompleto AS Cliente,
            ISNULL(C.TipoCliente, 'Sin tipo') AS Tipo,
            C.Activo AS Activo,
            C.FechaCreacion AS FechaCreacion,
            (SELECT COUNT(1) FROM EXPEDIENTE E WHERE E.Cliente_ID = C.ID) AS Expedientes
        FROM CLIENTE C
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        WHERE (@TipoCliente IS NULL OR C.TipoCliente = @TipoCliente)
          AND (@Activo IS NULL OR C.Activo = @Activo)
        ORDER BY P.NombreCompleto;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [14-Reportes-Completar.sql] SP_Reporte_CargaPorAbogado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Reporte_CargaPorAbogado
    @Usuario_ID INT = NULL,
    @Rama_ID INT = NULL,
    @Estado_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Activo INT    = (SELECT ID FROM ESTADO_EXPEDIENTE WHERE Nombre = 'Activo');
        DECLARE @EnEspera INT  = (SELECT ID FROM ESTADO_EXPEDIENTE WHERE Nombre = 'En Espera');
        DECLARE @Urgente INT   = (SELECT ID FROM ESTADO_EXPEDIENTE WHERE Nombre = 'Urgente');
        DECLARE @Cerrado INT   = (SELECT ID FROM ESTADO_EXPEDIENTE WHERE Nombre = 'Cerrado');
        DECLARE @Archivado INT = (SELECT ID FROM ESTADO_EXPEDIENTE WHERE Nombre = 'Archivado');

        SELECT
            P.NombreCompleto AS Abogado,
            R.Nombre AS Rol,
            COUNT(*) AS Total,
            SUM(CASE WHEN E.Estado_ID = @Activo THEN 1 ELSE 0 END) AS Activos,
            SUM(CASE WHEN E.Estado_ID = @EnEspera THEN 1 ELSE 0 END) AS EnEspera,
            SUM(CASE WHEN E.Estado_ID = @Urgente THEN 1 ELSE 0 END) AS Urgentes,
            SUM(CASE WHEN E.Estado_ID IN (@Cerrado, @Archivado) THEN 1 ELSE 0 END) AS Cerrados
        FROM EXPEDIENTE E
        INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
        INNER JOIN PERSONA P ON U.Persona_ID = P.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
          AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
          AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
        GROUP BY P.NombreCompleto, R.Nombre
        ORDER BY Total DESC, P.NombreCompleto;

        SELECT
            E.NoExpediente,
            P.NombreCompleto AS Cliente,
            RA.Nombre AS Rama,
            EE.Nombre AS Estado,
            EE.Color AS EstadoColor,
            E.FechaIngreso,
            UP.NombreCompleto AS Abogado,
            R.Nombre AS Rol
        FROM EXPEDIENTE E
        INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
        INNER JOIN PERSONA P ON C.Persona_ID = P.ID
        INNER JOIN RAMA RA ON E.Rama_ID = RA.ID
        INNER JOIN ESTADO_EXPEDIENTE EE ON E.Estado_ID = EE.ID
        INNER JOIN USUARIO U ON E.Usuario_ID = U.ID
        INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE (@Usuario_ID IS NULL OR E.Usuario_ID = @Usuario_ID)
          AND (@Rama_ID IS NULL OR E.Rama_ID = @Rama_ID)
          AND (@Estado_ID IS NULL OR E.Estado_ID = @Estado_ID)
        ORDER BY UP.NombreCompleto, E.FechaIngreso;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [16-Eventos-Agenda-Semanal.sql] SP_Evento_ObtenerDeLaSemana
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [17-Topbar-Busqueda-Notificaciones.sql] SP_Notificacion_ContarPendientes
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Notificacion_ContarPendientes
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EstadoAtendida INT = (
        SELECT ID FROM ESTADO_NOTIFICACION_OJ WHERE Nombre = N'Atendida'
    );

    SELECT COUNT(*) AS Total
    FROM NOTIFICACION_OJ
    WHERE Estado_ID <> @EstadoAtendida;
END
GO

-- ------------------------------------------------------------
-- [17-Topbar-Busqueda-Notificaciones.sql] SP_Buscar_Global
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Buscar_Global
    @Busqueda NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Patron NVARCHAR(210) = N'%' + @Busqueda + N'%';

    -- Expedientes
    SELECT 'Expediente' AS Tipo, E.ID AS Id,
           E.NoExpediente AS Titulo,
           P.NombreCompleto AS Subtitulo,
           '/expedientes/' + CAST(E.ID AS NVARCHAR(10)) AS Ruta
    FROM EXPEDIENTE E
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    WHERE E.NoExpediente LIKE @Patron
       OR P.NombreCompleto LIKE @Patron

    UNION ALL

    -- Clientes
    SELECT 'Cliente' AS Tipo, C.ID AS Id,
           P.NombreCompleto AS Titulo,
           P.DPI AS Subtitulo,
           '/clientes/' + CAST(C.ID AS NVARCHAR(10)) AS Ruta
    FROM CLIENTE C
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    WHERE C.Activo = 1
      AND (P.NombreCompleto LIKE @Patron OR P.DPI LIKE @Patron)

    UNION ALL

    -- Audiencias
    SELECT 'Audiencia' AS Tipo, A.ID AS Id,
           E.NoExpediente AS Titulo,
           TA.Nombre + ' - ' + P.NombreCompleto AS Subtitulo,
           '/agenda/' + CAST(A.ID AS NVARCHAR(10)) AS Ruta
    FROM AUDIENCIA A
    INNER JOIN EXPEDIENTE E ON A.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_AUDIENCIA TA ON A.Tipo_ID = TA.ID
    WHERE E.NoExpediente LIKE @Patron
       OR P.NombreCompleto LIKE @Patron

    UNION ALL

    -- Tramites
    SELECT 'Tramite' AS Tipo, T.ID AS Id,
           E.NoExpediente AS Titulo,
           TT.Nombre + ' - ' + ISNULL(T.Institucion, '') AS Subtitulo,
           '/tramites/' + CAST(T.ID AS NVARCHAR(10)) AS Ruta
    FROM TRAMITE T
    INNER JOIN EXPEDIENTE E ON T.Expediente_ID = E.ID
    INNER JOIN TIPO_TRAMITE TT ON T.Tipo_ID = TT.ID
    WHERE E.NoExpediente LIKE @Patron
       OR T.Institucion LIKE @Patron
       OR T.OficioReferencia LIKE @Patron

    UNION ALL

    -- Notificaciones OJ
    SELECT 'Notificacion' AS Tipo, N.ID AS Id,
           ISNULL(N.NumeroResolucion, E.NoExpediente) AS Titulo,
           EN.Nombre + ' - ' + P.NombreCompleto AS Subtitulo,
           '/notificaciones-oj/' + CAST(N.ID AS NVARCHAR(10)) AS Ruta
    FROM NOTIFICACION_OJ N
    INNER JOIN EXPEDIENTE E ON N.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN ESTADO_NOTIFICACION_OJ EN ON N.Estado_ID = EN.ID
    WHERE N.NumeroResolucion LIKE @Patron
       OR E.NoExpediente LIKE @Patron

    UNION ALL

    -- Diligencias
    SELECT 'Diligencia' AS Tipo, D.ID AS Id,
           D.Titulo AS Titulo,
           TD.Nombre + ' - ' + ISNULL(P.NombreCompleto, '') AS Subtitulo,
           '/agenda/' + CAST(D.ID AS NVARCHAR(10)) AS Ruta
    FROM DILIGENCIA D
    LEFT JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
    LEFT JOIN CLIENTE C ON D.Cliente_ID = C.ID
    LEFT JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
    WHERE D.Titulo LIKE @Patron
       OR P.NombreCompleto LIKE @Patron
       OR D.Ubicacion LIKE @Patron

    ORDER BY Tipo, Titulo;
END
GO

-- ------------------------------------------------------------
-- [18-Documentos-PorID.sql] SP_DocExpediente_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DocExpediente_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        DE.ID,
        DE.Expediente_ID,
        DE.NombreArchivo,
        DE.RutaArchivo,
        DE.TipoArchivo,
        DE.Tamano,
        DE.Descripcion,
        DE.Usuario_ID,
        UP.NombreCompleto AS UsuarioNombre,
        DE.FechaSubida
    FROM DOC_EXPEDIENTE DE
    INNER JOIN USUARIO U ON DE.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE DE.ID = @ID;
END
GO

-- ------------------------------------------------------------
-- [20-NotasTramite.sql] SP_NotaTramite_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotaTramite_Insertar
    @Tramite_ID INT,
    @Contenido NVARCHAR(MAX),
    @Etiqueta_ID INT = NULL,
    @Fijado BIT = 0,
    @Prioritario BIT = 0,
    @Usuario_ID INT,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM TRAMITE WHERE ID = @Tramite_ID)
        BEGIN
            SET @NuevoID = -1;
            RETURN -1;
        END

        INSERT INTO NOTA_TRAMITE (Tramite_ID, Contenido, Etiqueta_ID, Fijado, Prioritario, Usuario_ID)
        VALUES (@Tramite_ID, @Contenido, @Etiqueta_ID, @Fijado, @Prioritario, @Usuario_ID);

        SET @NuevoID = SCOPE_IDENTITY();
        RETURN 0;
    END TRY
    BEGIN CATCH
        SET @NuevoID = -1;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [20-NotasTramite.sql] SP_NotaTramite_ObtenerPorTramite
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotaTramite_ObtenerPorTramite @Tramite_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        NT.*,
        EN.Nombre AS EtiquetaNombre,
        EN.Color AS EtiquetaColor,
        UP.NombreCompleto AS UsuarioNombre
    FROM NOTA_TRAMITE NT
    LEFT JOIN ETIQUETA_NOTA EN ON NT.Etiqueta_ID = EN.ID
    INNER JOIN USUARIO U ON NT.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE NT.Tramite_ID = @Tramite_ID
    ORDER BY NT.Prioritario DESC, NT.Fijado DESC, NT.FechaCreacion DESC;
END
GO

-- ------------------------------------------------------------
-- [21-DocsTramite.sql] SP_DocTramite_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DocTramite_Insertar
    @Tramite_ID INT,
    @NombreArchivo NVARCHAR(200),
    @RutaArchivo NVARCHAR(500),
    @TipoArchivo NVARCHAR(20),
    @Tamano BIGINT = NULL,
    @Descripcion NVARCHAR(200) = NULL,
    @Usuario_ID INT,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM TRAMITE WHERE ID = @Tramite_ID)
        BEGIN
            SET @NuevoID = -1;
            RETURN -1;
        END

        INSERT INTO DOC_TRAMITE (
            Tramite_ID, NombreArchivo, RutaArchivo, TipoArchivo, Tamano, Descripcion, Usuario_ID
        ) VALUES (
            @Tramite_ID, @NombreArchivo, @RutaArchivo, @TipoArchivo, @Tamano, @Descripcion, @Usuario_ID
        );

        SET @NuevoID = SCOPE_IDENTITY();
        RETURN 0;
    END TRY
    BEGIN CATCH
        SET @NuevoID = -1;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [21-DocsTramite.sql] SP_DocTramite_ObtenerPorTramite
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DocTramite_ObtenerPorTramite @Tramite_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        DT.ID,
        DT.Tramite_ID,
        DT.NombreArchivo,
        DT.RutaArchivo,
        DT.TipoArchivo,
        DT.Tamano,
        DT.Descripcion,
        DT.Usuario_ID,
        UP.NombreCompleto AS UsuarioNombre,
        DT.FechaSubida
    FROM DOC_TRAMITE DT
    INNER JOIN USUARIO U ON DT.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE DT.Tramite_ID = @Tramite_ID
    ORDER BY DT.FechaSubida DESC;
END
GO

-- ------------------------------------------------------------
-- [21-DocsTramite.sql] SP_DocTramite_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DocTramite_ObtenerPorID @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        DT.ID,
        DT.Tramite_ID,
        DT.NombreArchivo,
        DT.RutaArchivo,
        DT.TipoArchivo,
        DT.Tamano,
        DT.Descripcion,
        DT.Usuario_ID,
        UP.NombreCompleto AS UsuarioNombre,
        DT.FechaSubida
    FROM DOC_TRAMITE DT
    INNER JOIN USUARIO U ON DT.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE DT.ID = @ID;
END
GO
