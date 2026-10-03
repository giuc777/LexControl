-- ============================================================
-- 21. DOCUMENTOS DE TRAMITE (tabla DOC_TRAMITE)
--
-- La tabla DOC_TRAMITE ya existía en 00-LexControlDB.sql
-- (línea 880) pero nunca tuvo procedimientos almacenados
-- asociados. Este script crea los SP de lectura (por trámite y
-- por ID), inserción y borrado, replicando los de DOC_EXPEDIENTE.
--
-- Ejecutar con:
--   sqlcmd -S DESKTOP-V7G3G1I\SQLEXPRESS -d DBLexControl -E -i 21-DocsTramite.sql -f 65001
-- ============================================================

-- 21.1 SP_DocTramite_Insertar
--     Registra un archivo ya guardado en disco para un trámite.
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

-- 21.2 SP_DocTramite_ObtenerPorTramite
--     Lista los documentos de un trámite con el usuario que los subió.
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

-- 21.3 SP_DocTramite_ObtenerPorID
--     Resuelve la ruta de un documento a partir de su ID, sin
--     exponer la ruta relativa en la URL (preview/download por ID).
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

-- 21.4 SP_DocTramite_Eliminar
--     Elimina físicamente el registro de un documento.
--     Rechazos: RETURN -1 = el documento no existe.
CREATE OR ALTER PROCEDURE SP_DocTramite_Eliminar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM DOC_TRAMITE WHERE ID = @ID)
            RETURN -1;

        DELETE FROM DOC_TRAMITE WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO
