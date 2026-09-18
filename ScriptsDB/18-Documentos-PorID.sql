-- ============================================================
-- 18 - Documentos: obtención por ID
-- SP_DocExpediente_ObtenerPorID
--
-- Permite resolver la ruta de un documento a partir de su ID,
-- sin exponer la ruta relativa en la URL (preview/download por ID).
-- ============================================================
USE DBLexControl;
GO

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

PRINT 'OK SP_DocExpediente_ObtenerPorID creado.';
GO

SELECT
    P.Procedimiento,
    CASE WHEN sp.name IS NULL THEN 'FALTA' ELSE 'OK' END AS Estado
FROM (VALUES ('SP_DocExpediente_ObtenerPorID')) AS P(Procedimiento)
LEFT JOIN sys.procedures sp ON sp.name = P.Procedimiento;
GO