-- ============================================================
-- Migración 02 — Audiencias: SP_Audiencia_Actualizar (edición)
-- Fecha: 2026-10-29
--
-- Problema:
--   No existía forma de corregir los datos de una audiencia
--   después de crearla (fecha, horas, tipo, juzgado, sala,
--   estado, notas): el backend solo exponía POST y
--   PUT /resultado, por lo que un error en la creación solo
--   se podía "arreglar" cancelando y creando otra.
--
-- Cambios:
--   1. SP_Audiencia_Actualizar — UPDATE con convención
--      COALESCE(@param, columna): NULL = sin cambio (mismo
--      patrón que SP_Diligencia_Actualizar). Para vaciar un
--      campo de texto se envía cadena vacía; HoraFin se limpia
--      con @QuitarHoraFin porque COALESCE no puede vaciar TIME.
--      NO toca Resultado_ID/DescripcionResultado/ProximaActuacion
--      (siguen en SP_Audiencia_RegistrarResultado).
--
-- Idempotente: se puede re-ejecutar sin efecto adicional
-- (CREATE OR ALTER).
--
-- Ejecución (sqlcmd, desde la raíz del repo; los scripts son UTF-8
-- sin BOM, por eso -f 65001; -b detiene si algún lote falla):
--
--   sqlcmd -S <servidor>.database.windows.net,1433 -U <usuario> -P <clave> ^
--          -d DB_Lexcontrol_Test -b -f 65001 ^
--          -i Deploy\migraciones\02_audiencia_actualizar.sql
--
--   BD de pruebas:  DB_Lexcontrol_Test
--   BD de produccion: DB_Lexcontrol  (cuando Render apunte a ella)
--
--   En Azure SQL no se admite USE ni CREATE DATABASE: la BD destino
--   se elige con -d. Desde el portal de Azure no funciona por el
--   separador de lotes GO: usar sqlcmd, SSMS o Azure Data Studio.
-- ============================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ------------------------------------------------------------
-- 1. SP_Audiencia_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Audiencia_Actualizar
    @ID INT,
    @Expediente_ID INT = NULL,
    @Fecha DATE = NULL,
    @HoraInicio TIME = NULL,
    @HoraFin TIME = NULL,
    @QuitarHoraFin BIT = 0,
    @Tipo_ID INT = NULL,
    @Juzgado_ID INT = NULL,
    @Sala NVARCHAR(50) = NULL,
    @Estado_ID INT = NULL,
    @Notas NVARCHAR(500) = NULL,
    @Documentos NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE AUDIENCIA SET
            Expediente_ID = COALESCE(@Expediente_ID, Expediente_ID),
            Fecha         = COALESCE(@Fecha, Fecha),
            HoraInicio    = COALESCE(@HoraInicio, HoraInicio),
            HoraFin       = CASE WHEN @QuitarHoraFin = 1 THEN NULL
                                 ELSE COALESCE(@HoraFin, HoraFin) END,
            Tipo_ID       = COALESCE(@Tipo_ID, Tipo_ID),
            Juzgado_ID    = COALESCE(@Juzgado_ID, Juzgado_ID),
            Sala          = COALESCE(@Sala, Sala),
            Estado_ID     = COALESCE(@Estado_ID, Estado_ID),
            Notas         = COALESCE(@Notas, Notas),
            Documentos    = COALESCE(@Documentos, Documentos)
        WHERE ID = @ID;

        IF @@ROWCOUNT = 0
            RETURN -2; -- No encontrado
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- Verificación:
--   SELECT name FROM sys.procedures WHERE name = 'SP_Audiencia_Actualizar';
-- ============================================================
