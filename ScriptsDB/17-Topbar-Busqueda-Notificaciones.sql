-- ============================================================
-- 17. TOPBAR: campana de notificaciones pendientes
--     SP_Notificacion_ContarPendientes: cuenta notificaciones
--     cuyo estado NO es 'Atendida'.
-- ============================================================
USE DBLexControl;
GO

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

PRINT 'OK SP_Notificacion_ContarPendientes creado.';
GO
