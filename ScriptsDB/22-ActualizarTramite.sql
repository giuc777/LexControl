-- ============================================================
-- 22. Actualización de datos de un TRÁMITE (detalle + resolución)
-- ============================================================
-- Permite corregir datos capturados mal (tipo, institución,
-- fecha de ingreso, oficio, descripción) y la resolución
-- (fecha y resumen) sin cambiar el estado del trámite.
--
-- Retornos:
--   0  -> actualización correcta
--   -1 -> el trámite no existe
--   >0 -> número de error de SQL Server (CATCH)
-- ============================================================

CREATE OR ALTER PROCEDURE SP_Tramite_Actualizar
    @ID INT,
    @Tipo_ID INT,
    @Institucion NVARCHAR(100),
    @FechaIngreso DATE = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @OficioReferencia NVARCHAR(50) = NULL,
    @FechaResolucion DATE = NULL,
    @ResumenResolucion NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM TRAMITE WHERE ID = @ID)
        BEGIN
            RETURN -1;
        END

        -- FechaIngreso es NOT NULL: si no llega valor se conserva el actual.
        UPDATE TRAMITE
        SET Tipo_ID = @Tipo_ID,
            Institucion = @Institucion,
            FechaIngreso = ISNULL(@FechaIngreso, FechaIngreso),
            Descripcion = @Descripcion,
            OficioReferencia = @OficioReferencia,
            FechaResolucion = @FechaResolucion,
            ResumenResolucion = @ResumenResolucion,
            FechaUltimaActualizacion = GETDATE()
        WHERE ID = @ID;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

PRINT 'SP_Tramite_Actualizar creado.';
GO
