-- ============================================================
-- MIGRACION DE SEGURIDAD — LexControl
-- Codificacion: UTF-8 con BOM
-- Ejecutar sobre DBLexControl
-- Contiene:
--   1. Columnas de auditoria de hash en USUARIO
--   2. Tabla REFRESH_TOKEN y sus SPs
--   3. Tabla TOKEN_BLACKLIST y sus SPs
--   4. SPs de autenticacion actualizados
-- ============================================================

USE DBLexControl;
GO

-- ============================================================
-- PARTE 1: COLUMNAS DE AUDITORIA DE HASH
-- ============================================================

-- 1.1 Agregar columna HashLegacy a USUARIO
--     Indica si el hash de la contraseña aún usa SHA256 (legacy)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('USUARIO') AND name = 'HashLegacy'
)
BEGIN
    ALTER TABLE USUARIO ADD HashLegacy BIT NOT NULL DEFAULT 1;
END
GO

-- 1.2 Agregar columna FechaUltimoCambioHash a USUARIO
--     Registra cuándo se migró el hash a BCrypt
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('USUARIO') AND name = 'FechaUltimoCambioHash'
)
BEGIN
    ALTER TABLE USUARIO ADD FechaUltimoCambioHash DATETIME NULL;
END
GO

-- 1.3 Marcar todos los hashes actuales como legacy
--     (todos usan SHA256 actualmente)
UPDATE USUARIO
SET HashLegacy = 1,
    FechaUltimoCambioHash = GETDATE()
WHERE HashLegacy = 0;
GO

-- ============================================================
-- PARTE 2: TABLA REFRESH_TOKEN
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'REFRESH_TOKEN'
)
BEGIN
    CREATE TABLE REFRESH_TOKEN (
        ID              INT IDENTITY(1,1) PRIMARY KEY,
        Usuario_ID      INT NOT NULL,
        TokenHash       NVARCHAR(255) NOT NULL,
        FechaCreacion   DATETIME NOT NULL DEFAULT GETDATE(),
        FechaExpiracion DATETIME NOT NULL,
        Revocado        BIT NOT NULL DEFAULT 0,
        FechaRevocacion DATETIME NULL,
        ReemplazadoPor  NVARCHAR(255) NULL,
        UserAgent       NVARCHAR(500) NULL,
        IPAddress       NVARCHAR(45) NULL,
        CONSTRAINT FK_REFRESH_TOKEN_USUARIO
            FOREIGN KEY (Usuario_ID) REFERENCES USUARIO(ID)
            ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IX_REFRESH_TOKEN_TokenHash
        ON REFRESH_TOKEN(TokenHash);

    CREATE INDEX IX_REFRESH_TOKEN_Usuario
        ON REFRESH_TOKEN(Usuario_ID, Revocado);

    CREATE INDEX IX_REFRESH_TOKEN_Expiracion
        ON REFRESH_TOKEN(FechaExpiracion);
END
GO

-- ============================================================
-- PARTE 3: TABLA TOKEN_BLACKLIST
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'TOKEN_BLACKLIST'
)
BEGIN
    CREATE TABLE TOKEN_BLACKLIST (
        JTI              NVARCHAR(50) PRIMARY KEY,
        Usuario_ID       INT NOT NULL,
        FechaExpiracion  DATETIME NOT NULL,
        FechaRevocacion  DATETIME NOT NULL DEFAULT GETDATE(),
        Motivo           NVARCHAR(200) NULL
    );

    CREATE INDEX IX_TOKEN_BLACKLIST_Expiracion
        ON TOKEN_BLACKLIST(FechaExpiracion);
END
GO

-- ============================================================
-- PARTE 4: SPs DE USUARIO (ACTUALIZACIONES)
-- ============================================================

-- 4.1 SP_Usuario_ActualizarHash
--     Actualiza el hash de contraseña de un usuario (migración SHA256 → BCrypt)
--     Retorna: 0 OK, -1 usuario no existe
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

-- 4.2 SP_Usuario_ObtenerPorNombre
--     Obtiene un usuario por nombre de usuario (para fallback BCrypt)
--     Retorna: fila con todos los datos necesarios para autenticación
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

-- 4.3 SP_Usuario_Autenticar (ACTUALIZADO)
--     Ahora también retorna HashLegacy para decidir migración
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

-- ============================================================
-- PARTE 5: SPs DE REFRESH TOKEN
-- ============================================================

-- 5.1 SP_RefreshToken_Crear
--     Crea un nuevo refresh token para un usuario
--     Retorna: 0 OK, -1 usuario no existe
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

-- 5.2 SP_RefreshToken_Validar
--     Valida un refresh token: verifica que no esté revocado,
--     que no haya expirado, y que el usuario no esté bloqueado.
--     Retorna: fila con datos del usuario si es válido, vacío si no.
--     Nota: NombreCompleto viene de PERSONA (no de USUARIO).
--     Nota: USUARIO no tiene columna Activo (la "actividad" vive en
--           PERSONA.Activo); el bloqueo de la cuenta es U.Bloqueado.
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

-- 5.3 SP_RefreshToken_Revocar
--     Revoca un refresh token específico
--     Si se proporciona ReemplazadoPor, lo registra (rotación)
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

-- 5.4 SP_RefreshToken_RevocarTodos
--     Revoca todos los refresh tokens activos de un usuario
--     Útil para logout global (todos los dispositivos)
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

-- 5.5 SP_RefreshToken_Limpiar
--     Elimina tokens expirados o revocados (para job de mantenimiento)
--     Retorna la cantidad de filas eliminadas
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

-- ============================================================
-- PARTE 6: SPs DE TOKEN BLACKLIST
-- ============================================================

-- 6.1 SP_TokenBlacklist_Insertar
--     Agrega un JTI a la blacklist (logout de access token)
--     Retorna: 0 OK
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

-- 6.2 SP_TokenBlacklist_Existe
--     Verifica si un JTI está en la blacklist y aún no expiró
--     Retorna: COUNT(1) — 0 = no está, 1 = está
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

-- 6.3 SP_TokenBlacklist_Limpiar
--     Elimina entradas de la blacklist que ya expiraron (para job de mantenimiento)
--     Retorna la cantidad de filas eliminadas
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

PRINT '=== Migración de seguridad completada ===';
PRINT 'Columnas agregadas: HashLegacy, FechaUltimoCambioHash en USUARIO';
PRINT 'Tablas creadas: REFRESH_TOKEN, TOKEN_BLACKLIST';
PRINT 'SPs creados: SP_Usuario_ActualizarHash, SP_Usuario_ObtenerPorNombre';
PRINT 'SPs creados: SP_RefreshToken_Crear, _Validar, _Revocar, _RevocarTodos, _Limpiar';
PRINT 'SPs creados: SP_TokenBlacklist_Insertar, _Existe, _Limpiar';
PRINT 'SP actualizado: SP_Usuario_Autenticar (ahora retorna HashLegacy)';
GO

