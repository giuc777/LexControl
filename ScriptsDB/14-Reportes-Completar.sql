-- ============================================================
-- 14. REPORTES - Completar
-- Agrega los SPs de reportes faltantes:
--   * SP_Reporte_GestionTramites   (estaba comentado con bug de subquery)
--   * SP_Reporte_ClientesPorTipo   (nuevo)
--   * SP_Reporte_CargaPorAbogado   (nuevo)
-- ============================================================

-- ============================================================
-- 1. SP_Reporte_GestionTramites
--    Resumen por tipo de trámite + detalle.
--    Se usan variables para los IDs de estado (evita el error
--    "cannot perform an aggregate function on an expression
--    containing an aggregate or a subquery").
-- ============================================================
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

-- ============================================================
-- 2. SP_Reporte_ClientesPorTipo
--    Resumen por tipo de cliente + detalle.
-- ============================================================
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

-- ============================================================
-- 3. SP_Reporte_CargaPorAbogado
--    Carga de trabajo por usuario asignado + detalle.
-- ============================================================
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

-- ============================================================
-- 4. Verificacion
-- ============================================================
PRINT 'OK SPs de reportes creados correctamente.';
GO

SELECT
    P.Procedimiento,
    CASE WHEN sp.name IS NULL THEN 'FALTA' ELSE 'OK' END AS Estado
FROM (VALUES
    ('SP_Reporte_GestionTramites'),
    ('SP_Reporte_ClientesPorTipo'),
    ('SP_Reporte_CargaPorAbogado')
) AS P(Procedimiento)
LEFT JOIN sys.procedures sp ON sp.name = P.Procedimiento
ORDER BY P.Procedimiento;
GO