-- ============================================================
-- LEXCONTROL - 02_sp_escritura_simple.sql
-- Procedimientos de ESCRITURA SIMPLE
--
-- Criterio: el SP referencia (lee o escribe) UNA sola tabla de LexControl. Van aqui tambien los SP genericos de catalogo (SP_Catalogo_*), que usan SQL dinamico con @Tabla y por eso no referencian ninguna tabla de forma estatica.
-- Total: 48 procedimientos almacenados (definicion
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
-- [00-LexControlDB.sql] SP_Persona_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Persona_Insertar
    @NombreCompleto NVARCHAR(100),
    @DPI NVARCHAR(20) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL,
    @EmailPrincipal NVARCHAR(100) = NULL,
    @Direccion NVARCHAR(200) = NULL,
    @FechaNacimiento DATE = NULL,
    @Genero CHAR(1) = NULL,
    @UsuarioCreacion_ID INT = NULL,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO PERSONA (
            NombreCompleto, DPI, TelefonoPrincipal, EmailPrincipal,
            Direccion, FechaNacimiento, Genero, UsuarioCreacion_ID
        ) VALUES (
            @NombreCompleto, @DPI, @TelefonoPrincipal, @EmailPrincipal,
            @Direccion, @FechaNacimiento, @Genero, @UsuarioCreacion_ID
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
-- [00-LexControlDB.sql] SP_Persona_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Persona_Actualizar
    @ID INT,
    @NombreCompleto NVARCHAR(100),
    @DPI NVARCHAR(20) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL,
    @EmailPrincipal NVARCHAR(100) = NULL,
    @Direccion NVARCHAR(200) = NULL,
    @FechaNacimiento DATE = NULL,
    @Genero CHAR(1) = NULL,
    @UsuarioModificacion_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE PERSONA SET
            NombreCompleto = @NombreCompleto,
            DPI = @DPI,
            TelefonoPrincipal = @TelefonoPrincipal,
            EmailPrincipal = @EmailPrincipal,
            Direccion = @Direccion,
            FechaNacimiento = @FechaNacimiento,
            Genero = @Genero,
            FechaModificacion = GETDATE(),
            UsuarioModificacion_ID = @UsuarioModificacion_ID
        WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Persona_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Persona_ObtenerPorID @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM PERSONA WHERE ID = @ID;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Persona_Buscar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Persona_Buscar
    @Nombre NVARCHAR(100) = NULL,
    @DPI NVARCHAR(20) = NULL,
    @Email NVARCHAR(100) = NULL,
    @Telefono NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM PERSONA
    WHERE (@Nombre IS NULL OR NombreCompleto LIKE '%' + @Nombre + '%')
      AND (@DPI IS NULL OR DPI = @DPI)
      AND (@Email IS NULL OR EmailPrincipal = @Email)
      AND (@Telefono IS NULL OR TelefonoPrincipal = @Telefono)
      AND Activo = 1;
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Cliente_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Cliente_Insertar
    @NombreCompleto NVARCHAR(100),
    @DPI NVARCHAR(20) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL,
    @EmailPrincipal NVARCHAR(100) = NULL,
    @Direccion NVARCHAR(200) = NULL,
    @TelefonoSecundario NVARCHAR(20) = NULL,
    @EmailSecundario NVARCHAR(100) = NULL,
    @TipoCliente NVARCHAR(20) = 'Particular',
    @Notas NVARCHAR(500) = NULL,
    @UsuarioCreacion_ID INT = NULL,
    @NuevoClienteID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;
        EXEC SP_Persona_Insertar
            @NombreCompleto, @DPI, @TelefonoPrincipal, @EmailPrincipal,
            @Direccion, NULL, NULL, @UsuarioCreacion_ID, @PersonaID OUTPUT;
        IF @PersonaID <= 0
        BEGIN
            ROLLBACK;
            SET @NuevoClienteID = -1;
            RETURN -1;
        END
        INSERT INTO CLIENTE (Persona_ID, TelefonoSecundario, EmailSecundario, TipoCliente, Notas, Activo)
        VALUES (@PersonaID, @TelefonoSecundario, @EmailSecundario, @TipoCliente, @Notas, 1);
        SET @NuevoClienteID = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SET @NuevoClienteID = -1;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_Expediente_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Expediente_Insertar
    @Cliente_ID INT,
    @Rol_Procesal_ID INT,
    @NoExpediente NVARCHAR(50),
    @Rama_ID INT,
    @TipoProceso NVARCHAR(50) = NULL,
    @Juzgado_ID INT,
    @FechaIngreso DATE = NULL,
    @Estado_ID INT,
    @Descripcion NVARCHAR(500) = NULL,
    @NotasInternas NVARCHAR(1000) = NULL,
    @Usuario_ID INT,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @FechaIngreso IS NULL SET @FechaIngreso = GETDATE();
        INSERT INTO EXPEDIENTE (
            Cliente_ID, Rol_Procesal_ID, NoExpediente, Rama_ID, TipoProceso,
            Juzgado_ID, FechaIngreso, Estado_ID, Descripcion, NotasInternas, Usuario_ID
        ) VALUES (
            @Cliente_ID, @Rol_Procesal_ID, @NoExpediente, @Rama_ID, @TipoProceso,
            @Juzgado_ID, @FechaIngreso, @Estado_ID, @Descripcion, @NotasInternas, @Usuario_ID
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
-- [00-LexControlDB.sql] SP_Expediente_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Expediente_Actualizar
    @ID INT,
    @Cliente_ID INT = NULL,
    @Rol_Procesal_ID INT = NULL,
    @Rama_ID INT = NULL,
    @TipoProceso NVARCHAR(50) = NULL,
    @Juzgado_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @NotasInternas NVARCHAR(1000) = NULL,
    @FechaCierre DATE = NULL,
    @UsuarioModificacion_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE EXPEDIENTE SET
            Cliente_ID = ISNULL(@Cliente_ID, Cliente_ID),
            Rol_Procesal_ID = ISNULL(@Rol_Procesal_ID, Rol_Procesal_ID),
            Rama_ID = ISNULL(@Rama_ID, Rama_ID),
            TipoProceso = ISNULL(@TipoProceso, TipoProceso),
            Juzgado_ID = ISNULL(@Juzgado_ID, Juzgado_ID),
            Estado_ID = ISNULL(@Estado_ID, Estado_ID),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            NotasInternas = ISNULL(@NotasInternas, NotasInternas),
            FechaCierre = CASE WHEN @FechaCierre IS NULL THEN FechaCierre ELSE @FechaCierre END,
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
-- [00-LexControlDB.sql] SP_Audiencia_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Audiencia_Insertar
    @Expediente_ID INT,
    @Fecha DATE,
    @HoraInicio TIME,
    @HoraFin TIME = NULL,
    @Tipo_ID INT,
    @Juzgado_ID INT,
    @Sala NVARCHAR(50) = NULL,
    @Estado_ID INT,
    @Resultado_ID INT = NULL,
    @DescripcionResultado NVARCHAR(1000) = NULL,
    @ProximaActuacion NVARCHAR(200) = NULL,
    @Notas NVARCHAR(500) = NULL,
    @Documentos NVARCHAR(500) = NULL,
    @Usuario_Creacion_ID INT,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO AUDIENCIA (
            Expediente_ID, Fecha, HoraInicio, HoraFin, Tipo_ID, Juzgado_ID, Sala,
            Estado_ID, Resultado_ID, DescripcionResultado, ProximaActuacion, Notas,
            Documentos, Usuario_Creacion_ID
        ) VALUES (
            @Expediente_ID, @Fecha, @HoraInicio, @HoraFin, @Tipo_ID, @Juzgado_ID, @Sala,
            @Estado_ID, @Resultado_ID, @DescripcionResultado, @ProximaActuacion, @Notas,
            @Documentos, @Usuario_Creacion_ID
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
-- [00-LexControlDB.sql] SP_Tramite_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Tramite_Insertar
    @Expediente_ID INT,
    @Tipo_ID INT,
    @Institucion NVARCHAR(100),
    @FechaIngreso DATE = NULL,
    @Estado_ID INT,
    @Descripcion NVARCHAR(500) = NULL,
    @OficioReferencia NVARCHAR(50) = NULL,
    @NotasInternas NVARCHAR(500) = NULL,
    @DocumentosAdjuntos NVARCHAR(500) = NULL,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @FechaIngreso IS NULL SET @FechaIngreso = GETDATE();
        INSERT INTO TRAMITE (
            Expediente_ID, Tipo_ID, Institucion, FechaIngreso, Estado_ID,
            Descripcion, OficioReferencia, NotasInternas, DocumentosAdjuntos
        ) VALUES (
            @Expediente_ID, @Tipo_ID, @Institucion, @FechaIngreso, @Estado_ID,
            @Descripcion, @OficioReferencia, @NotasInternas, @DocumentosAdjuntos
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
-- [00-LexControlDB.sql] SP_Tramite_ActualizarEstado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Tramite_ActualizarEstado
    @ID INT,
    @Estado_ID INT,
    @FechaResolucion DATE = NULL,
    @ResumenResolucion NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE TRAMITE
        SET Estado_ID = @Estado_ID,
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

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_NotificacionOJ_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotificacionOJ_Insertar
    @Expediente_ID INT,
    @Juzgado_ID INT,
    @FechaRecepcion DATE = NULL,
    @Tipo_ID INT,
    @Contenido NVARCHAR(MAX) = NULL,
    @Resumen NVARCHAR(500) = NULL,
    @Estado_ID INT,
    @NumeroExpedienteOJ NVARCHAR(50) = NULL,
    @PDF_Ruta NVARCHAR(500) = NULL,
    @DuplicadoDe_ID INT = NULL,
    @Notas NVARCHAR(500) = NULL,
    @EsResolucion BIT = 0,
    @NumeroResolucion NVARCHAR(50) = NULL,
    @Favorable BIT = NULL,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @FechaRecepcion IS NULL SET @FechaRecepcion = GETDATE();
        INSERT INTO NOTIFICACION_OJ (
            Expediente_ID, Juzgado_ID, FechaRecepcion, Tipo_ID, Contenido, Resumen,
            Estado_ID, NumeroExpedienteOJ, PDF_Ruta, DuplicadoDe_ID, Notas,
            EsResolucion, NumeroResolucion, Favorable
        ) VALUES (
            @Expediente_ID, @Juzgado_ID, @FechaRecepcion, @Tipo_ID, @Contenido, @Resumen,
            @Estado_ID, @NumeroExpedienteOJ, @PDF_Ruta, @DuplicadoDe_ID, @Notas,
            @EsResolucion, @NumeroResolucion, @Favorable
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
-- [00-LexControlDB.sql] SP_EventoBase_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EventoBase_Insertar
    @Expediente_ID INT = NULL,
    @Cliente_ID INT = NULL,
    @Titulo NVARCHAR(200),
    @Descripcion NVARCHAR(500) = NULL,
    @Fecha DATE,
    @HoraInicio TIME,
    @HoraFin TIME = NULL,
    @DiaCompleto BIT = 0,
    @Ubicacion NVARCHAR(200) = NULL,
    @Prioridad INT = 0,
    @ColorEvento NVARCHAR(7) = NULL,
    @Estado_ID INT,
    @TipoEvento NVARCHAR(20),
    @EsInterno BIT = 0,
    @CreadoPor INT,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO EVENTO_BASE (
            Expediente_ID, Cliente_ID, Titulo, Descripcion, Fecha, HoraInicio, HoraFin,
            DiaCompleto, Ubicacion, Prioridad, ColorEvento, Estado_ID, TipoEvento, EsInterno, CreadoPor
        ) VALUES (
            @Expediente_ID, @Cliente_ID, @Titulo, @Descripcion, @Fecha, @HoraInicio, @HoraFin,
            @DiaCompleto, @Ubicacion, @Prioridad, @ColorEvento, @Estado_ID, @TipoEvento, @EsInterno, @CreadoPor
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
-- [00-LexControlDB.sql] SP_EventoAudiencia_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_EventoAudiencia_Insertar
    @Expediente_ID INT = NULL,
    @Cliente_ID INT = NULL,
    @Titulo NVARCHAR(200),
    @Descripcion NVARCHAR(500) = NULL,
    @Fecha DATE,
    @HoraInicio TIME,
    @HoraFin TIME = NULL,
    @Ubicacion NVARCHAR(200) = NULL,
    @Prioridad INT = 0,
    @ColorEvento NVARCHAR(7) = NULL,
    @Estado_ID INT,
    @EsInterno BIT = 0,
    @CreadoPor INT,
    @TipoAudiencia NVARCHAR(30),
    @Juzgado_ID INT = NULL,
    @Secretario_ID INT = NULL,
    @NumeroExpedienteJudicial NVARCHAR(50) = NULL,
    @Resolucion NVARCHAR(MAX) = NULL,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @EventoID INT;
        EXEC SP_EventoBase_Insertar
            @Expediente_ID, @Cliente_ID, @Titulo, @Descripcion, @Fecha, @HoraInicio, @HoraFin,
            0, @Ubicacion, @Prioridad, @ColorEvento, @Estado_ID, 'Audiencia', @EsInterno, @CreadoPor,
            @EventoID OUTPUT;
        IF @EventoID <= 0
        BEGIN
            ROLLBACK;
            SET @NuevoID = -1;
            RETURN -1;
        END
        INSERT INTO EVENTO_AUDIENCIA (
            Evento_ID, TipoAudiencia, Juzgado_ID, Secretario_ID,
            NumeroExpedienteJudicial, Resolucion
        ) VALUES (
            @EventoID, @TipoAudiencia, @Juzgado_ID, @Secretario_ID,
            @NumeroExpedienteJudicial, @Resolucion
        );
        COMMIT TRANSACTION;
        SET @NuevoID = @EventoID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        SET @NuevoID = -1;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [00-LexControlDB.sql] SP_NotaExpediente_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotaExpediente_Insertar
    @Expediente_ID INT,
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
        INSERT INTO NOTA_EXPEDIENTE (Expediente_ID, Contenido, Etiqueta_ID, Fijado, Prioritario, Usuario_ID)
        VALUES (@Expediente_ID, @Contenido, @Etiqueta_ID, @Fijado, @Prioritario, @Usuario_ID);
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
-- [00-LexControlDB.sql] SP_DocExpediente_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DocExpediente_Insertar
    @Expediente_ID INT,
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
        INSERT INTO DOC_EXPEDIENTE (
            Expediente_ID, NombreArchivo, RutaArchivo, TipoArchivo, Tamano, Descripcion, Usuario_ID
        ) VALUES (
            @Expediente_ID, @NombreArchivo, @RutaArchivo, @TipoArchivo, @Tamano, @Descripcion, @Usuario_ID
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
-- [01-Usuarios_Permisos.sql] SP_Usuario_CambiarContrasena
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_CambiarContrasena
    @ID INT,
    @HashActual NVARCHAR(255),
    @HashNuevo NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @HashGuardado NVARCHAR(255);

        SELECT @HashGuardado = ContraseñaHash
        FROM USUARIO
        WHERE ID = @ID;

        IF @HashGuardado IS NULL
        BEGIN
            RETURN -1; -- Usuario no encontrado
        END;

        IF @HashGuardado <> @HashActual
        BEGIN
            RETURN -2; -- La contraseña actual no coincide
        END;

        UPDATE USUARIO SET
            ContraseñaHash = @HashNuevo
        WHERE ID = @ID;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Usuario_Desbloquear
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_Desbloquear
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE USUARIO SET
            IntentosFallidos = 0,
            Bloqueado = 0,
            FechaBloqueo = NULL
        WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Rol_Listar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Rol_Listar
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            ID,
            Nombre,
            Descripcion
        FROM ROL
        WHERE Activo = 1
        ORDER BY ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Usuario_RegistrarIntentoFallido
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_RegistrarIntentoFallido
    @Usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @ID INT;
        SELECT @ID = ID FROM USUARIO WHERE Usuario = @Usuario;

        IF @ID IS NULL
            RETURN 0;

        UPDATE USUARIO
        SET IntentosFallidos = ISNULL(IntentosFallidos, 0) + 1,
            Bloqueado = CASE WHEN ISNULL(IntentosFallidos, 0) + 1 >= 5 THEN 1 ELSE Bloqueado END,
            FechaBloqueo = CASE WHEN ISNULL(IntentosFallidos, 0) + 1 >= 5
                                AND Bloqueado = 0 THEN GETDATE() ELSE FechaBloqueo END
        WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [01-Usuarios_Permisos.sql] SP_Usuario_ActualizarAcceso
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_ActualizarAcceso
    @Usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE USUARIO
        SET UltimoAcceso = GETDATE(),
            IntentosFallidos = 0,
            Bloqueado = 0,
            FechaBloqueo = NULL
        WHERE Usuario = @Usuario;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_Usuario_ActualizarHash
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Usuario_ActualizarHash
    @ID INT,
    @ContraseñaHash NVARCHAR(255),
    @HashLegacy BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE ID = @ID)
            RETURN -1;

        UPDATE USUARIO
        SET ContraseñaHash = @ContraseñaHash,
            HashLegacy = @HashLegacy,
            FechaUltimoCambioHash = GETDATE()
        WHERE ID = @ID;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_RefreshToken_Revocar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_RefreshToken_Revocar
    @TokenHash NVARCHAR(255),
    @ReemplazadoPor NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE REFRESH_TOKEN
        SET Revocado = 1,
            FechaRevocacion = GETDATE(),
            ReemplazadoPor = @ReemplazadoPor
        WHERE TokenHash = @TokenHash
          AND Revocado = 0;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_RefreshToken_RevocarTodos
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_RefreshToken_RevocarTodos
    @Usuario_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE REFRESH_TOKEN
        SET Revocado = 1,
            FechaRevocacion = GETDATE()
        WHERE Usuario_ID = @Usuario_ID
          AND Revocado = 0;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_RefreshToken_Limpiar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_RefreshToken_Limpiar
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DELETE FROM REFRESH_TOKEN
        WHERE FechaExpiracion < GETDATE()
           OR Revocado = 1;

        RETURN @@ROWCOUNT;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_TokenBlacklist_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_TokenBlacklist_Insertar
    @JTI NVARCHAR(50),
    @Usuario_ID INT,
    @FechaExpiracion DATETIME,
    @Motivo NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO TOKEN_BLACKLIST
            (JTI, Usuario_ID, FechaExpiracion, Motivo)
        VALUES
            (@JTI, @Usuario_ID, @FechaExpiracion, @Motivo);

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_TokenBlacklist_Existe
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_TokenBlacklist_Existe
    @JTI NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT COUNT(1) AS Total
        FROM TOKEN_BLACKLIST
        WHERE JTI = @JTI
          AND FechaExpiracion > GETDATE();
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [02-Seguridad.sql] SP_TokenBlacklist_Limpiar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_TokenBlacklist_Limpiar
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DELETE FROM TOKEN_BLACKLIST
        WHERE FechaExpiracion < GETDATE();

        RETURN @@ROWCOUNT;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [03-Expedientes.sql] SP_ParteProcesal_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_ParteProcesal_Insertar
    @Expediente_ID INT,
    @Tipo NVARCHAR(20),
    @NombreCompleto NVARCHAR(100),
    @DPI NVARCHAR(20) = NULL,
    @Telefono NVARCHAR(20) = NULL,
    @AbogadoDefensor NVARCHAR(100) = NULL,
    @Rol NVARCHAR(50) = NULL,
    @Descripcion NVARCHAR(200) = NULL,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO PARTE_PROCESAL (
            Expediente_ID, Tipo, NombreCompleto, DPI, Telefono,
            AbogadoDefensor, Rol, Descripcion
        ) VALUES (
            @Expediente_ID, @Tipo, @NombreCompleto, @DPI, @Telefono,
            @AbogadoDefensor, @Rol, @Descripcion
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
-- [03-Expedientes.sql] SP_ParteProcesal_ObtenerPorExpediente
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_ParteProcesal_ObtenerPorExpediente
    @Expediente_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        PP.ID,
        PP.Expediente_ID,
        PP.Tipo,
        PP.NombreCompleto,
        PP.DPI,
        PP.Telefono,
        PP.AbogadoDefensor,
        PP.Rol,
        PP.Descripcion,
        PP.Activo,
        PP.FechaCreacion
    FROM PARTE_PROCESAL PP
    WHERE PP.Expediente_ID = @Expediente_ID
      AND PP.Activo = 1
    ORDER BY
        CASE PP.Tipo
            WHEN 'Demandante' THEN 1
            WHEN 'Demandado' THEN 2
            ELSE 3
        END,
        PP.NombreCompleto;
END
GO

-- ------------------------------------------------------------
-- [03-Expedientes.sql] SP_ParteProcesal_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_ParteProcesal_Actualizar
    @ID INT,
    @Tipo NVARCHAR(20) = NULL,
    @NombreCompleto NVARCHAR(100) = NULL,
    @DPI NVARCHAR(20) = NULL,
    @Telefono NVARCHAR(20) = NULL,
    @AbogadoDefensor NVARCHAR(100) = NULL,
    @Rol NVARCHAR(50) = NULL,
    @Descripcion NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM PARTE_PROCESAL WHERE ID = @ID)
            RETURN -1;

        UPDATE PARTE_PROCESAL SET
            Tipo = ISNULL(@Tipo, Tipo),
            NombreCompleto = ISNULL(@NombreCompleto, NombreCompleto),
            DPI = ISNULL(@DPI, DPI),
            Telefono = ISNULL(@Telefono, Telefono),
            AbogadoDefensor = ISNULL(@AbogadoDefensor, AbogadoDefensor),
            Rol = ISNULL(@Rol, Rol),
            Descripcion = ISNULL(@Descripcion, Descripcion)
        WHERE ID = @ID;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [03-Expedientes.sql] SP_ParteProcesal_Eliminar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_ParteProcesal_Eliminar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM PARTE_PROCESAL WHERE ID = @ID)
            RETURN -1;

        UPDATE PARTE_PROCESAL SET Activo = 0 WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [03-Expedientes.sql] SP_NotaExpediente_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotaExpediente_Actualizar
    @ID INT,
    @Contenido NVARCHAR(MAX) = NULL,
    @Etiqueta_ID INT = NULL,
    @Fijado BIT = NULL,
    @Prioritario BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM NOTA_EXPEDIENTE WHERE ID = @ID)
            RETURN -1;

        UPDATE NOTA_EXPEDIENTE SET
            Contenido = ISNULL(@Contenido, Contenido),
            Etiqueta_ID = CASE WHEN @Etiqueta_ID IS NULL THEN Etiqueta_ID ELSE @Etiqueta_ID END,
            Fijado = ISNULL(@Fijado, Fijado),
            Prioritario = ISNULL(@Prioritario, Prioritario),
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
-- [03-Expedientes.sql] SP_NotaExpediente_Eliminar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_NotaExpediente_Eliminar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM NOTA_EXPEDIENTE WHERE ID = @ID)
            RETURN -1;

        DELETE FROM NOTA_EXPEDIENTE WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [03-Expedientes.sql] SP_DocExpediente_Eliminar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_DocExpediente_Eliminar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM DOC_EXPEDIENTE WHERE ID = @ID)
            RETURN -1;

        DELETE FROM DOC_EXPEDIENTE WHERE ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [06-Mantenimiento_Catalogos.sql] SP_Catalogo_Buscar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Catalogo_Buscar
    @Tabla NVARCHAR(50),
    @Busqueda NVARCHAR(100) = NULL,
    @IncluirInactivos BIT = 0,
    @Pagina INT = 1,
    @TamanoPagina INT = 50
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

        DECLARE @Sql NVARCHAR(MAX);
        DECLARE @Total INT;
        DECLARE @Params NVARCHAR(400) = N'@Total INT OUTPUT, @Busqueda NVARCHAR(100), @IncluirInactivos BIT, @Pagina INT, @TamanoPagina INT';

        -- Conteo total
        SET @Sql = N'
            SELECT @Total = COUNT(*)
            FROM ' + QUOTENAME(@Tabla) + N'
            WHERE (@IncluirInactivos = 1 OR Activo = 1)
              AND (@Busqueda IS NULL
                   OR Nombre LIKE ''%'' + @Busqueda + ''%''
                   OR Descripcion LIKE ''%'' + @Busqueda + ''%''
                   OR Valor LIKE ''%'' + @Busqueda + ''%'')';

        EXEC sp_executesql @Sql, 
            N'@Total INT OUTPUT, @Busqueda NVARCHAR(100), @IncluirInactivos BIT',
            @Total OUTPUT, @Busqueda, @IncluirInactivos;

        -- Resultado paginado (Total incluido en cada fila para Dapper)
        SET @Sql = N'
            SELECT @Total AS Total, ID, Nombre, Valor, Descripcion, Color, Orden, Activo, FechaCreacion
            FROM ' + QUOTENAME(@Tabla) + N'
            WHERE (@IncluirInactivos = 1 OR Activo = 1)
              AND (@Busqueda IS NULL
                   OR Nombre LIKE ''%'' + @Busqueda + ''%''
                   OR Descripcion LIKE ''%'' + @Busqueda + ''%''
                   OR Valor LIKE ''%'' + @Busqueda + ''%'')
            ORDER BY Orden ASC, Nombre ASC
            OFFSET (@Pagina - 1) * @TamanoPagina ROWS
            FETCH NEXT @TamanoPagina ROWS ONLY';

        EXEC sp_executesql @Sql, @Params, @Total, @Busqueda, @IncluirInactivos, @Pagina, @TamanoPagina;
    END TRY
    BEGIN CATCH
        SELECT ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [06-Mantenimiento_Catalogos.sql] SP_Catalogo_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Catalogo_Insertar
    @Tabla NVARCHAR(50),
    @Nombre NVARCHAR(50),
    @Valor NVARCHAR(20) = NULL,
    @Descripcion NVARCHAR(200) = NULL,
    @Color NVARCHAR(7) = NULL,
    @Orden INT = 0
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

        DECLARE @Existe INT;
        DECLARE @SqlExiste NVARCHAR(MAX) = N'
            SELECT @Existe = COUNT(*)
            FROM ' + QUOTENAME(@Tabla) + N'
            WHERE LOWER(Nombre) = LOWER(@Nombre)';

        EXEC sp_executesql @SqlExiste, N'@Nombre NVARCHAR(50), @Existe INT OUTPUT',
                           @Nombre, @Existe OUTPUT;

        IF @Existe > 0
        BEGIN
            RAISERROR('Ya existe un registro con el nombre "%s" en la tabla %s.', 16, 1, @Nombre, @Tabla);
            RETURN;
        END

        DECLARE @SqlInsert NVARCHAR(MAX) = N'
            INSERT INTO ' + QUOTENAME(@Tabla) + N'
                (Nombre, Valor, Descripcion, Color, Orden, Activo, FechaCreacion)
            VALUES
                (@Nombre, @Valor, @Descripcion, @Color, @Orden, 1, GETDATE())';

        EXEC sp_executesql @SqlInsert,
            N'@Nombre NVARCHAR(50), @Valor NVARCHAR(20), @Descripcion NVARCHAR(200), @Color NVARCHAR(7), @Orden INT',
            @Nombre, @Valor, @Descripcion, @Color, @Orden;

        SELECT SCOPE_IDENTITY() AS NuevoID;
    END TRY
    BEGIN CATCH
        SELECT ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [06-Mantenimiento_Catalogos.sql] SP_Catalogo_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Catalogo_Actualizar
    @Tabla NVARCHAR(50),
    @ID INT,
    @Nombre NVARCHAR(50),
    @Valor NVARCHAR(20) = NULL,
    @Descripcion NVARCHAR(200) = NULL,
    @Color NVARCHAR(7) = NULL,
    @Orden INT = 0
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

        DECLARE @ExisteActual INT;
        DECLARE @SqlExiste NVARCHAR(MAX) = N'
            SELECT @ExisteActual = COUNT(*)
            FROM ' + QUOTENAME(@Tabla) + N'
            WHERE ID = @ID';

        EXEC sp_executesql @SqlExiste, N'@ID INT, @ExisteActual INT OUTPUT',
                           @ID, @ExisteActual OUTPUT;

        IF @ExisteActual = 0
        BEGIN
            RAISERROR('No se encontró el registro con ID %d en la tabla %s.', 16, 1, @ID, @Tabla);
            RETURN;
        END

        DECLARE @ExisteNombre INT;
        DECLARE @SqlDup NVARCHAR(MAX) = N'
            SELECT @ExisteNombre = COUNT(*)
            FROM ' + QUOTENAME(@Tabla) + N'
            WHERE LOWER(Nombre) = LOWER(@Nombre) AND ID != @ID';

        EXEC sp_executesql @SqlDup, N'@Nombre NVARCHAR(50), @ID INT, @ExisteNombre INT OUTPUT',
                           @Nombre, @ID, @ExisteNombre OUTPUT;

        IF @ExisteNombre > 0
        BEGIN
            RAISERROR('Ya existe otro registro con el nombre "%s" en la tabla %s.', 16, 1, @Nombre, @Tabla);
            RETURN;
        END

        DECLARE @SqlUpdate NVARCHAR(MAX) = N'
            UPDATE ' + QUOTENAME(@Tabla) + N'
            SET Nombre = @Nombre,
                Valor = @Valor,
                Descripcion = @Descripcion,
                Color = @Color,
                Orden = @Orden
            WHERE ID = @ID';

        EXEC sp_executesql @SqlUpdate,
            N'@ID INT, @Nombre NVARCHAR(50), @Valor NVARCHAR(20), @Descripcion NVARCHAR(200), @Color NVARCHAR(7), @Orden INT',
            @ID, @Nombre, @Valor, @Descripcion, @Color, @Orden;

        SELECT @ID AS ID, @Nombre AS Nombre;
    END TRY
    BEGIN CATCH
        SELECT ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [07-Catalogos_Juzgados.sql] SP_Catalogo_ObtenerPorID
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Catalogo_ObtenerPorID
    @Tabla NVARCHAR(50),
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Tabla NOT IN (
            'RAMA','ESTADO_EXPEDIENTE','TIPO_AUDIENCIA','ESTADO_AUDIENCIA',
            'RESULTADO_AUDIENCIA','TIPO_TRAMITE','ESTADO_TRAMITE',
            'TIPO_DILIGENCIA','ESTADO_DILIGENCIA','RESULTADO_DILIGENCIA','TIPO_NOTIFICACION_OJ',
            'ESTADO_NOTIFICACION_OJ','TIPO_PROCESO','ETIQUETA_NOTA',
            'ESTADO_EVENTO','TIPO_JUZGADO','ROL_PROCESAL'
        )
        BEGIN
            RAISERROR('Tabla no permitida.', 16, 1);
            RETURN;
        END

        DECLARE @sql NVARCHAR(MAX) = N'
            SELECT ID, Nombre, Valor, Descripcion, Color, Orden, Activo, FechaCreacion
            FROM ' + QUOTENAME(@Tabla) + '
            WHERE ID = @ID';

        EXEC sp_executesql @sql, N'@ID INT', @ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [07-Catalogos_Juzgados.sql] SP_Juzgado_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Juzgado_Insertar
    @Nombre NVARCHAR(200),
    @Direccion NVARCHAR(500) = NULL,
    @Telefono NVARCHAR(30) = NULL,
    @Email NVARCHAR(200) = NULL,
    @Tipo_Juzgado_ID INT,
    @Municipio_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM JUZGADO WHERE Nombre = @Nombre AND Activo = 1)
        BEGIN
            RAISERROR('Ya existe un juzgado con ese nombre.', 16, 1);
            RETURN;
        END

        INSERT INTO JUZGADO (Nombre, Direccion, Telefono, Email, Tipo_Juzgado_ID, Municipio_ID, Activo, FechaCreacion)
        VALUES (@Nombre, @Direccion, @Telefono, @Email, @Tipo_Juzgado_ID, @Municipio_ID, 1, GETDATE());

        SELECT SCOPE_IDENTITY() AS ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [07-Catalogos_Juzgados.sql] SP_Juzgado_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Juzgado_Actualizar
    @ID INT,
    @Nombre NVARCHAR(200),
    @Direccion NVARCHAR(500) = NULL,
    @Telefono NVARCHAR(30) = NULL,
    @Email NVARCHAR(200) = NULL,
    @Tipo_Juzgado_ID INT,
    @Municipio_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM JUZGADO WHERE ID = @ID)
        BEGIN
            RAISERROR('Juzgado no encontrado.', 16, 1);
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM JUZGADO WHERE Nombre = @Nombre AND ID != @ID AND Activo = 1)
        BEGIN
            RAISERROR('Ya existe otro juzgado con ese nombre.', 16, 1);
            RETURN;
        END

        UPDATE JUZGADO
        SET Nombre = @Nombre,
            Direccion = @Direccion,
            Telefono = @Telefono,
            Email = @Email,
            Tipo_Juzgado_ID = @Tipo_Juzgado_ID,
            Municipio_ID = @Municipio_ID
        WHERE ID = @ID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- ------------------------------------------------------------
-- [11-Diligencias-CRUD.sql] SP_Diligencia_Insertar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Diligencia_Insertar
    @Expediente_ID INT = NULL,
    @Cliente_ID INT = NULL,
    @Tipo_ID INT,
    @Titulo NVARCHAR(200),
    @Descripcion NVARCHAR(500) = NULL,
    @Fecha DATE,
    @HoraInicio TIME = NULL,
    @DiaCompleto BIT = 0,
    @Ubicacion NVARCHAR(200) = NULL,
    @Oficina NVARCHAR(100) = NULL,
    @Estado_ID INT,
    @Notas NVARCHAR(500) = NULL,
    @TiempoDedicado NVARCHAR(20) = NULL,
    @RecordatorioMinutos INT = 30,
    @Usuario_ID INT,
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar constraint CHK_DILIGENCIA_ENTIDAD
        IF @Expediente_ID IS NULL AND @Cliente_ID IS NULL
        BEGIN
            SET @NuevoID = -1;
            RETURN -1;
        END

        INSERT INTO DILIGENCIA (
            Expediente_ID, Cliente_ID, Tipo_ID, Titulo, Descripcion,
            Fecha, HoraInicio, DiaCompleto, Ubicacion, Oficina,
            Estado_ID, Notas, TiempoDedicado, RecordatorioMinutos, Usuario_ID
        ) VALUES (
            @Expediente_ID, @Cliente_ID, @Tipo_ID, @Titulo, @Descripcion,
            @Fecha, @HoraInicio, @DiaCompleto, @Ubicacion, @Oficina,
            @Estado_ID, @Notas, @TiempoDedicado, @RecordatorioMinutos, @Usuario_ID
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
-- [11-Diligencias-CRUD.sql] SP_Diligencia_Actualizar
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Diligencia_Actualizar
    @ID INT,
    @Expediente_ID INT = NULL,
    @Cliente_ID INT = NULL,
    @Tipo_ID INT = NULL,
    @Titulo NVARCHAR(200) = NULL,
    @Descripcion NVARCHAR(500) = NULL,
    @Fecha DATE = NULL,
    @HoraInicio TIME = NULL,
    @DiaCompleto BIT = NULL,
    @Ubicacion NVARCHAR(200) = NULL,
    @Oficina NVARCHAR(100) = NULL,
    @Estado_ID INT = NULL,
    @Notas NVARCHAR(500) = NULL,
    @TiempoDedicado NVARCHAR(20) = NULL,
    @RecordatorioMinutos INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE DILIGENCIA SET
            Expediente_ID = COALESCE(@Expediente_ID, Expediente_ID),
            Cliente_ID    = COALESCE(@Cliente_ID, Cliente_ID),
            Tipo_ID       = COALESCE(@Tipo_ID, Tipo_ID),
            Titulo        = COALESCE(@Titulo, Titulo),
            Descripcion   = COALESCE(@Descripcion, Descripcion),
            Fecha         = COALESCE(@Fecha, Fecha),
            HoraInicio    = COALESCE(@HoraInicio, HoraInicio),
            DiaCompleto   = COALESCE(@DiaCompleto, DiaCompleto),
            Ubicacion     = COALESCE(@Ubicacion, Ubicacion),
            Oficina       = COALESCE(@Oficina, Oficina),
            Estado_ID     = COALESCE(@Estado_ID, Estado_ID),
            Notas         = COALESCE(@Notas, Notas),
            TiempoDedicado      = COALESCE(@TiempoDedicado, TiempoDedicado),
            RecordatorioMinutos = COALESCE(@RecordatorioMinutos, RecordatorioMinutos)
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

-- ------------------------------------------------------------
-- [13-NotificacionesOJ-Completar.sql] SP_NotificacionOJ_Actualizar
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [13-NotificacionesOJ-Completar.sql] SP_NotificacionOJ_AdjuntarPDF
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [19-Diligencias-Resultado.sql] SP_Diligencia_RegistrarResultado
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_Diligencia_RegistrarResultado
    @ID INT,
    @Resultado_ID INT,
    @DescripcionResultado NVARCHAR(1000),
    @UsuarioModificacion_ID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE DILIGENCIA
        SET Resultado_ID = @Resultado_ID,
            DescripcionResultado = @DescripcionResultado
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

-- ------------------------------------------------------------
-- [20-NotasTramite.sql] SP_NotaTramite_Eliminar
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [21-DocsTramite.sql] SP_DocTramite_Eliminar
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- [22-ActualizarTramite.sql] SP_Tramite_Actualizar
-- ------------------------------------------------------------
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
