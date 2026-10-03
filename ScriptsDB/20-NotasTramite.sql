-- ============================================================
-- 20. NOTAS DE TRAMITE (tabla NOTA_TRAMITE)
--
-- La tabla NOTA_TRAMITE ya existía en 00-LexControlDB.sql
-- (línea 780) pero nunca tuvo procedimientos almacenados
-- asociados. Este script crea los SP de lectura, inserción y
-- borrado individual, replicando los de NOTA_EXPEDIENTE.
--
-- Ejecutar con:
--   sqlcmd -S DESKTOP-V7G3G1I\SQLEXPRESS -d DBLexControl -E -i 20-NotasTramite.sql -f 65001
-- ============================================================

-- 20.1 SP_NotaTramite_Insertar
--     Crea una nota en un trámite y devuelve el nuevo ID.
--     Rechazos: RETURN -1 = trámite no existe (validado por el backend
--     con SP_Tramite_ObtenerPorID); el CATCH devuelve el número de
--     error SQL (547 = etiqueta/usuario inválidos).
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

-- 20.2 SP_NotaTramite_ObtenerPorTramite
--     Lista las notas de un trámite con la etiqueta y el autor.
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

-- 20.3 SP_NotaTramite_Eliminar
--     Elimina físicamente una nota de trámite.
--     Rechazos: RETURN -1 = la nota no existe.
CREATE OR ALTER PROCEDURE SP_NotaTramite_Eliminar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM NOTA_TRAMITE WHERE ID = @ID)
            RETURN -1;

        DELETE FROM NOTA_TRAMITE WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO
