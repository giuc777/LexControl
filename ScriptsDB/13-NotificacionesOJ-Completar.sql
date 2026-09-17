-- ============================================================
-- 13. NOTIFICACIONES OJ - Completar CRUD
-- Agrega los SPs faltantes del modulo Notificaciones OJ:
--   * SP_NotificacionOJ_Actualizar  (el backend ya lo invocaba pero no existia)
--   * SP_NotificacionOJ_AdjuntarPDF (adjunto de PDF de la notificacion)
-- Reafirma (idempotente) SP_NotificacionOJ_VerificarDuplicado.
-- ============================================================

-- ============================================================
-- 1. SP_NotificacionOJ_Actualizar
--    Actualiza una notificacion existente. Parametros clave (IDs,
--    fecha) se conservan si llegan NULL; los campos de texto se
--    reemplazan con el valor recibido (permite limpiarlos).
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NotificacionOJ_Actualizar
    @ID INT,
    @Juzgado_ID INT = NULL,
    @FechaRecepcion DATE = NULL,
    @Tipo_ID INT = NULL,
    @Contenido NVARCHAR(MAX) = NULL,
    @Resumen NVARCHAR(500) = NULL,
    @Estado_ID INT = NULL,
    @NumeroExpedienteOJ NVARCHAR(50) = NULL,
    @PDF_Ruta NVARCHAR(500) = NULL,
    @Notas NVARCHAR(500) = NULL,
    @EsResolucion BIT = NULL,
    @NumeroResolucion NVARCHAR(50) = NULL,
    @Favorable BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM NOTIFICACION_OJ WHERE ID = @ID)
            RETURN -1;

        UPDATE NOTIFICACION_OJ
        SET Juzgado_ID         = ISNULL(@Juzgado_ID, Juzgado_ID),
            FechaRecepcion     = ISNULL(@FechaRecepcion, FechaRecepcion),
            Tipo_ID            = ISNULL(@Tipo_ID, Tipo_ID),
            Estado_ID          = ISNULL(@Estado_ID, Estado_ID),
            EsResolucion       = ISNULL(@EsResolucion, EsResolucion),
            Contenido          = @Contenido,
            Resumen            = @Resumen,
            NumeroExpedienteOJ = @NumeroExpedienteOJ,
            PDF_Ruta           = @PDF_Ruta,
            Notas              = @Notas,
            NumeroResolucion   = @NumeroResolucion,
            Favorable          = @Favorable
        WHERE ID = @ID;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ============================================================
-- 2. SP_NotificacionOJ_AdjuntarPDF
--    Registra o reemplaza la ruta del PDF asociado.
-- ============================================================
CREATE OR ALTER PROCEDURE SP_NotificacionOJ_AdjuntarPDF
    @ID INT,
    @PDF_Ruta NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM NOTIFICACION_OJ WHERE ID = @ID)
            RETURN -1;

        UPDATE NOTIFICACION_OJ
        SET PDF_Ruta = @PDF_Ruta
        WHERE ID = @ID;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ============================================================
-- 3. SP_NotificacionOJ_VerificarDuplicado (reafirmacion)
--    Devuelve las notificaciones no atendidas del expediente que
--    coincidan con el numero de resolucion u de expediente OJ.
-- ============================================================
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

-- ============================================================
-- 4. Verificacion
-- ============================================================
PRINT 'OK SPs de Notificaciones OJ creados correctamente.';
PRINT '   SP_NotificacionOJ_Actualizar';
PRINT '   SP_NotificacionOJ_AdjuntarPDF';
PRINT '   SP_NotificacionOJ_VerificarDuplicado';
GO

SELECT
    P.Procedimiento,
    CASE WHEN sp.name IS NULL THEN 'FALTA' ELSE 'OK' END AS Estado
FROM (VALUES
    ('SP_NotificacionOJ_Insertar'),
    ('SP_NotificacionOJ_Actualizar'),
    ('SP_NotificacionOJ_Atender'),
    ('SP_NotificacionOJ_AdjuntarPDF'),
    ('SP_NotificacionOJ_VerificarDuplicado'),
    ('SP_Notificacion_Listar'),
    ('SP_Notificacion_ObtenerPorID')
) AS P(Procedimiento)
LEFT JOIN sys.procedures sp ON sp.name = P.Procedimiento
ORDER BY Estado DESC, P.Procedimiento;
GO
