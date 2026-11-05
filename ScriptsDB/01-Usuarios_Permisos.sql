-- ============================================================
-- PROCEDIMIENTOS ALMACENADOS DE USUARIOS - LEXCONTROL
-- ARCHIVO: Usuarios_SP.sql
-- PROPOSITO: SPs para el modulo de Login y Gestion de Usuarios
--            del submodulo Ajustes: listado, alta, edicion,
--            activacion, contrasenas, desbloqueo y catalogo
--            de roles. Incluye ademas el modulo de Permisos
--            (matriz rol x modulo).
-- ORDEN DE EJECUCION:
--   1) LexControlDB.sql   (BD + tablas + catalogos + seed admin)
--   2) Usuarios_SP.sql    (este archivo, idempotente)
--   3) Extras_SP.sql      (CRUD secundario de catalogos)
-- NOTA: Este script es IDEMPOTENTE (CREATE OR ALTER): puede
--       ejecutarse varias veces sin duplicar objetos.
-- CORRECCIONES RESPECTO A VERSIONES ANTERIORES:
--   - SP_Usuario_Actualizar: preserva TelefonoPrincipal cuando
--     el DTO lo envia NULL (regla de "dejar vacio para conservar").
-- AUTOR: Gadiel Isaí Us Cosme
-- FECHA: 24 de agosto de 2026
-- ============================================================

USE DBLexControl;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- 1.0 Columna DebeCambiarContrasena en USUARIO
--     Se agrega ANTES de los SPs para que SP_Usuario_CrearCompleto
--     (INSERT con la bandera) pueda compilarse en una BD nueva.
--     Idempotente (IF NOT EXISTS): segura en BDs existentes.
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('USUARIO') AND name = 'DebeCambiarContrasena'
)
BEGIN
    ALTER TABLE USUARIO ADD DebeCambiarContrasena BIT NOT NULL DEFAULT 0;
END
GO

-- ============================================================
-- 1. PROCEDIMIENTOS PARA GESTIÓN DE USUARIOS
-- ------------------------------------------------------------
-- Convenciones (AGENTS.md sección 6):
--   - RETURN 0 = éxito; RETURN ERROR_NUMBER() = fallo SQL;
--     RETURN -n = rechazo de negocio (ver comentario de cada SP).
-- ============================================================

-- 1.1 Listar usuarios del sistema
--     Filtros todos opcionales (patrón @Param IS NULL OR ...).
CREATE OR ALTER PROCEDURE SP_Usuario_Listar
    @FiltroNombre NVARCHAR(100) = NULL,
    @Rol_ID INT = NULL,
    @Activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            U.ID,
            P.NombreCompleto,
            U.Usuario,
            P.EmailPrincipal AS Email,
            P.TelefonoPrincipal AS Telefono,
            U.Rol_ID,
            R.Nombre AS Rol,
            P.Activo,
            U.Bloqueado,
            P.FechaCreacion
        FROM USUARIO U
        INNER JOIN PERSONA P ON U.Persona_ID = P.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE (@FiltroNombre IS NULL OR P.NombreCompleto LIKE '%' + @FiltroNombre + '%')
          AND (@Rol_ID IS NULL OR U.Rol_ID = @Rol_ID)
          AND (@Activo IS NULL OR P.Activo = @Activo)
        ORDER BY P.NombreCompleto;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- 1.2 Obtener usuario por ID (detalle con datos de PERSONA y ROL)
CREATE OR ALTER PROCEDURE SP_Usuario_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            U.ID,
            P.NombreCompleto,
            U.Usuario,
            P.EmailPrincipal AS Email,
            P.TelefonoPrincipal AS Telefono,
            U.Rol_ID,
            R.Nombre AS Rol,
            P.Activo,
            U.Bloqueado,
            U.UltimoAcceso,
            P.FechaCreacion
        FROM USUARIO U
        INNER JOIN PERSONA P ON U.Persona_ID = P.ID
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE U.ID = @ID;
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- 1.3 Crear usuario completo (crea PERSONA + USUARIO en transacción)
--     Patrón igual a SP_Cliente_Insertar.
--     Salidas: @NuevoID = ID del USUARIO creado (-1 en fallo).
--     Un nombre de cuenta duplicado lo atrapa el UNIQUE de
--     USUARIO.Usuario y se propaga como ERROR_NUMBER() (2627/2601).
--     La cuenta nace con DebeCambiarContrasena = 1: siempre se
--     crea con contraseña temporal (ver SP_Usuario_ActualizarHash).
CREATE OR ALTER PROCEDURE SP_Usuario_CrearCompleto
    @NombreCompleto NVARCHAR(100),
    @EmailPrincipal NVARCHAR(100) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL,
    @Usuario NVARCHAR(50),
    @Rol_ID INT,
    @ContraseñaHash NVARCHAR(255),
    @NuevoID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;

        -- 1) Crear la persona base
        INSERT INTO PERSONA (
            NombreCompleto,
            EmailPrincipal,
            TelefonoPrincipal,
            Activo
        ) VALUES (
            @NombreCompleto,
            @EmailPrincipal,
            @TelefonoPrincipal,
            1
        );
        SET @PersonaID = SCOPE_IDENTITY();

        -- 2) Crear la cuenta de usuario asociada
        INSERT INTO USUARIO (
            Persona_ID,
            Rol_ID,
            Usuario,
            ContraseñaHash,
            DebeCambiarContrasena
        ) VALUES (
            @PersonaID,
            @Rol_ID,
            @Usuario,
            @ContraseñaHash,
            1
        );

        SET @NuevoID = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @NuevoID = -1;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- 1.4 Actualizar usuario (datos de PERSONA + cuenta/rol; contraseña opcional)
--     Si @ContraseñaHash es NULL se conserva la actual
--     ("deje vacía para conservar", según el prototipo).
--     Rechazos: RETURN -1 = usuario no existe.
CREATE OR ALTER PROCEDURE SP_Usuario_Actualizar
    @ID INT,
    @NombreCompleto NVARCHAR(100),
    @EmailPrincipal NVARCHAR(100) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL,
    @Usuario NVARCHAR(50),
    @Rol_ID INT,
    @ContraseñaHash NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;

        SELECT @PersonaID = Persona_ID
        FROM USUARIO
        WHERE ID = @ID;

        IF @PersonaID IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1; -- Usuario no encontrado
        END;

        -- 1) Actualizar cuenta y rol (contraseña solo si se envía)
        UPDATE USUARIO SET
            Usuario = @Usuario,
            Rol_ID = @Rol_ID,
            ContraseñaHash = ISNULL(@ContraseñaHash, ContraseñaHash)
        WHERE ID = @ID;

        -- 2) Actualizar datos personales. EmailPrincipal es obligatorio
        -- en el DTO, por lo que se asigna directo. TelefonoPrincipal es
        -- opcional: NULL conserva el valor actual (ISNULL).
        UPDATE PERSONA SET
            NombreCompleto = @NombreCompleto,
            EmailPrincipal = @EmailPrincipal,
            TelefonoPrincipal = ISNULL(@TelefonoPrincipal, TelefonoPrincipal),
            FechaModificacion = GETDATE()
        WHERE ID = @PersonaID;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- 1.5 Activar / desactivar cuenta (borrado lógico en PERSONA.Activo)
--     Regla del prototipo: no se puede desactivar a un Administrador.
--     Rechazos: RETURN -1 = usuario no existe;
--               RETURN -2 = intento de desactivar un Administrador.
CREATE OR ALTER PROCEDURE SP_Usuario_CambiarEstado
    @ID INT,
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @PersonaID INT;
        DECLARE @RolNombre NVARCHAR(30);

        SELECT
            @PersonaID = U.Persona_ID,
            @RolNombre = R.Nombre
        FROM USUARIO U
        INNER JOIN ROL R ON U.Rol_ID = R.ID
        WHERE U.ID = @ID;

        IF @PersonaID IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1; -- Usuario no encontrado
        END;

        IF @Activo = 0 AND @RolNombre = N'Administrador'
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -2; -- No se puede desactivar la cuenta de administrador
        END;

        UPDATE PERSONA SET
            Activo = @Activo,
            FechaModificacion = GETDATE(),
            UsuarioModificacion_ID = @ID
        WHERE ID = @PersonaID;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- 1.6 Cambio de contraseña propia (valida la actual)
--     El backend envía ambos hashes ya calculados en SHA256 hex.
--     Rechazos: RETURN -1 = usuario no existe;
--               RETURN -2 = la contraseña actual no coincide.
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

-- 1.7 Desbloquear cuenta (limpia bloqueo por intentos fallidos)
--     Necesario porque SP_Usuario_RegistrarIntentoFallido bloquea
--     al quinto intento y ninguna rutina previa revertía el bloqueo.
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

-- 1.8 Catálogo de roles de usuario (para el select del formulario)
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

-- 1.9 Actualizar perfil propio (solo nombre/email/teléfono de PERSONA)
--     No se reutiliza SP_Persona_Actualizar porque ese procedimiento
--     pisa DPI/Dirección/etc. con NULL si no se envían.
CREATE OR ALTER PROCEDURE SP_Perfil_Actualizar
    @Usuario_ID INT,
    @NombreCompleto NVARCHAR(100),
    @EmailPrincipal NVARCHAR(100) = NULL,
    @TelefonoPrincipal NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE P SET
            NombreCompleto = @NombreCompleto,
            EmailPrincipal = @EmailPrincipal,
            TelefonoPrincipal = @TelefonoPrincipal,
            FechaModificacion = GETDATE(),
            UsuarioModificacion_ID = @Usuario_ID
        FROM PERSONA P
        INNER JOIN USUARIO U ON P.ID = U.Persona_ID
        WHERE U.ID = @Usuario_ID;

        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

-- ============================================================
-- 2. VERIFICACIÓN FINAL
-- ============================================================
SELECT
    P.Procedimiento,
    CASE WHEN sp.name IS NULL THEN 'FALTA' ELSE 'OK' END AS Estado
FROM (VALUES
    ('SP_Usuario_Listar'),
    ('SP_Usuario_ObtenerPorID'),
    ('SP_Usuario_CrearCompleto'),
    ('SP_Usuario_Actualizar'),
    ('SP_Usuario_CambiarEstado'),
    ('SP_Usuario_CambiarContrasena'),
    ('SP_Usuario_Desbloquear'),
    ('SP_Rol_Listar'),
    ('SP_Perfil_Actualizar'),
    ('SP_Usuario_Autenticar'),
    ('SP_Usuario_RegistrarIntentoFallido'),
    ('SP_Usuario_ActualizarAcceso')
) AS P(Procedimiento)
LEFT JOIN sys.procedures sp ON sp.name = P.Procedimiento
ORDER BY Estado DESC, P.Procedimiento;
GO

PRINT 'Procedimientos de gestión de usuarios creados correctamente.';
GO

-- ============================================================
-- Nuevos ajustes
-- ============================================================

-- ============================================================
-- PERMISOS SIMPLIFICADOS POR ROLES - LEXCONTROL
-- ============================================================

USE DBLexControl;
GO

-- 1. Tabla MODULO (catálogo fijo)
IF OBJECT_ID('dbo.MODULO', 'U') IS NULL
BEGIN
    CREATE TABLE MODULO (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(50) NOT NULL,
        Clave NVARCHAR(50) NOT NULL UNIQUE,
        Icono NVARCHAR(50) NULL,
        Ruta NVARCHAR(100) NULL,
        Orden INT NOT NULL DEFAULT 0,
        Activo BIT NOT NULL DEFAULT 1
    );
END
GO

-- 2. Tabla PERMISO_ROL (solo activo/inactivo)
IF OBJECT_ID('dbo.PERMISO_ROL', 'U') IS NULL
BEGIN
    CREATE TABLE PERMISO_ROL (
        Rol_ID INT NOT NULL,
        Modulo_ID INT NOT NULL,
        Activo BIT NOT NULL DEFAULT 0,
        CONSTRAINT PK_PERMISO_ROL PRIMARY KEY (Rol_ID, Modulo_ID),
        CONSTRAINT FK_PERMISO_ROL_ROL FOREIGN KEY (Rol_ID) REFERENCES ROL(ID) ON DELETE CASCADE,
        CONSTRAINT FK_PERMISO_ROL_MODULO FOREIGN KEY (Modulo_ID) REFERENCES MODULO(ID) ON DELETE CASCADE
    );
END
GO

-- 3. Insertar módulos (según la imagen) — idempotente.
--    La columna Clave es la clave interna que usa el frontend (ModuloKey).
--    La columna Nombre es el label visible en el sidebar.
-- Upsert idempotente de módulos: si la clave existe actualiza nombre,
-- icono, ruta y orden; si no, inserta. Así los cambios de ruta se aplican
-- también en bases ya creadas (antes un IF NOT EXISTS los ignoraba).
MERGE MODULO AS destino
USING (VALUES
    ('Dashboard',         'dashboard',      'dashboard',      '/dashboard',        1),
    ('Clientes',          'clientes',       'people',         '/clientes',         2),
    ('Expedientes',       'expedientes',    'folder',         '/expedientes',      3),
    ('Agenda',            'audiencias',     'event',          '/agenda',           4),
    ('Trámites',          'tramites',       'assignment',     '/tramites',         5),
    ('Histórico Legal',   'historico',      'history',        '/historico',        6),
    ('Notificaciones OJ', 'notificaciones', 'notifications',  '/notificaciones-oj', 7),
    ('Mantenimiento',     'mantenimiento',  'settings',       '/mantenimiento',    8),
    ('Reportes',          'reportes',       'bar_chart',      '/reportes',         9),
    ('Ajustes',           'ajustes',        'tune',           '/ajustes',         10)
) AS origen (Nombre, Clave, Icono, Ruta, Orden)
ON destino.Clave = origen.Clave
WHEN MATCHED THEN
    UPDATE SET destino.Nombre = origen.Nombre,
               destino.Icono  = origen.Icono,
               destino.Ruta   = origen.Ruta,
               destino.Orden  = origen.Orden
WHEN NOT MATCHED THEN
    INSERT (Nombre, Clave, Icono, Ruta, Orden)
    VALUES (origen.Nombre, origen.Clave, origen.Icono, origen.Ruta, origen.Orden);
GO



-- 5. Procedimiento para obtener permisos de un rol
CREATE OR ALTER PROCEDURE SP_Permiso_ObtenerPorRol
    @Rol_ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        M.Clave AS ModuloClave,
        M.Nombre AS Modulo,
        M.Ruta,
        M.Icono,
        ISNULL(PR.Activo, 0) AS Activo
    FROM MODULO M
    LEFT JOIN PERMISO_ROL PR ON M.ID = PR.Modulo_ID AND PR.Rol_ID = @Rol_ID
    WHERE M.Activo = 1
    ORDER BY M.Orden;
END
GO

-- 6. Procedimiento para actualizar permisos (desde el formulario de administración)
CREATE OR ALTER PROCEDURE SP_Permiso_Actualizar
    @Rol_ID INT,
    @Modulo_Clave NVARCHAR(50),
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Modulo_ID INT = (SELECT ID FROM MODULO WHERE Clave = @Modulo_Clave);
        IF @Modulo_ID IS NULL
            THROW 50000, 'Módulo no encontrado', 1;

        IF EXISTS (SELECT 1 FROM PERMISO_ROL WHERE Rol_ID = @Rol_ID AND Modulo_ID = @Modulo_ID)
        BEGIN
            UPDATE PERMISO_ROL SET Activo = @Activo WHERE Rol_ID = @Rol_ID AND Modulo_ID = @Modulo_ID;
        END
        ELSE
        BEGIN
            INSERT INTO PERMISO_ROL (Rol_ID, Modulo_ID, Activo) VALUES (@Rol_ID, @Modulo_ID, @Activo);
        END
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

PRINT '✅ Permisos simplificados agregados correctamente.';
GO

-- ============================================================
-- 3. PROCEDIMIENTOS DE AUTENTICACIÓN (login / intentos / acceso)
-- ------------------------------------------------------------
-- Contrato (alineado con AuthService.cs y LoginRequestDto):
--   * SP_Usuario_Autenticar        → fila de AutenticacionFila o ninguna
--   * SP_Usuario_RegistrarIntentoFallido → sin resultado
--   * SP_Usuario_ActualizarAcceso  → sin resultado
-- Las políticas de bloqueo las decide el SP (no el backend).
-- ============================================================

-- 3.1 Autenticar: valida hash, estado activo y bloqueo.
--     Devuelve una sola fila cuando todo es correcto;
--     ningún row si falla (cualquier motivo). El backend decide
--     registrar el intento fallido y retornar null.
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
            CAST(U.Bloqueado AS BIT) AS Bloqueado
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

-- 3.2 Registrar intento fallido: incrementa contador y bloquea
--     al quinto intento consecutivo. Si el usuario no existe
--     no hace nada (silencioso, igual que el backend).
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

-- 3.3 Actualizar acceso: marca UltimoAcceso y resetea contadores
--     de fallo (porque el login fue exitoso).
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

-- ============================================================
-- 4. PROCEDIMIENTOS DE PERMISOS (matriz completa)
-- ------------------------------------------------------------
-- Contrato (alineado con PermisoService.cs):
--   * SP_Permiso_Listar     → filas planas con Rol_ID, Rol,
--                              ModuloClave, Modulo, Ruta, Icono,
--                              Orden, Activo (el backend agrupa).
--   * SP_Permiso_GuardarRol → upsert masivo desde JSON; códigos
--                              de rechazo: 0=ok, -1=rol no existe,
--                              -2=matriz vacía, -3=claves inválidas,
--                              -4=dashboard protegido, -5=ajustes
--                              obligatorio para admin.
-- ============================================================

-- 4.1 Listar toda la matriz (un row por cada par Rol×Módulo).
CREATE OR ALTER PROCEDURE SP_Permiso_Listar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        R.ID AS Rol_ID,
        R.Nombre AS Rol,
        M.Clave AS ModuloClave,
        M.Nombre AS Modulo,
        M.Ruta,
        M.Icono,
        M.Orden,
        CAST(ISNULL(PR.Activo, 0) AS BIT) AS Activo
    FROM ROL R
    CROSS JOIN MODULO M
    LEFT JOIN PERMISO_ROL PR ON PR.Rol_ID = R.ID AND PR.Modulo_ID = M.ID
    WHERE R.Activo = 1 AND M.Activo = 1
    ORDER BY R.ID, M.Orden;
END
GO

-- 4.2 Guardar la matriz de un rol a partir de un JSON.
--     Formato JSON esperado: [{"clave":"dashboard","activo":true}, ...]
CREATE OR ALTER PROCEDURE SP_Permiso_GuardarRol
    @Rol_ID INT,
    @PermisosJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM ROL WHERE ID = @Rol_ID AND Activo = 1)
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1; -- Rol no encontrado
        END;

        IF @PermisosJson IS NULL OR LTRIM(RTRIM(@PermisosJson)) = ''
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -2; -- Matriz vacía
        END;

        -- Cargar claves declaradas en MODULO y lo que llegó por JSON.
        DECLARE @Conocidas TABLE (Clave NVARCHAR(50) PRIMARY KEY);
        INSERT INTO @Conocidas (Clave) SELECT Clave FROM MODULO WHERE Activo = 1;

        DECLARE @Recibidas TABLE (Clave NVARCHAR(50), Activo BIT);
        INSERT INTO @Recibidas (Clave, Activo)
        SELECT
            LTRIM(RTRIM(JSON_VALUE(value, '$.clave'))),
            CASE WHEN JSON_VALUE(value, '$.activo') = 'true' THEN 1 ELSE 0 END
        FROM OPENJSON(@PermisosJson);

        IF NOT EXISTS (SELECT 1 FROM @Recibidas)
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -2; -- Matriz vacía
        END;

        -- Toda clave recibida debe existir en MODULO.
        IF EXISTS (
            SELECT 1 FROM @Recibidas r
            WHERE NOT EXISTS (SELECT 1 FROM @Conocidas c WHERE c.Clave = r.Clave)
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -3; -- Claves inválidas
        END;

        -- Reglas de negocio adicionales.
        DECLARE @NombreRol NVARCHAR(30) = (SELECT Nombre FROM ROL WHERE ID = @Rol_ID);
        IF EXISTS (
            SELECT 1 FROM @Recibidas WHERE Clave = 'Dashboard' AND Activo = 0
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -4; -- Dashboard no puede ocultarse
        END;

        IF @NombreRol = N'Administrador'
           AND EXISTS (
                SELECT 1 FROM @Recibidas
                WHERE Clave = N'Ajustes' AND Activo = 0
           )
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -5; -- Admin no puede perder Ajustes
        END;

        -- Upsert por cada módulo recibido.
        MERGE PERMISO_ROL AS destino
        USING (
            SELECT
                @Rol_ID AS Rol_ID,
                M.ID AS Modulo_ID,
                r.Activo
            FROM @Recibidas r
            INNER JOIN MODULO M ON M.Clave = r.Clave
        ) AS origen
        ON destino.Rol_ID = origen.Rol_ID AND destino.Modulo_ID = origen.Modulo_ID
        WHEN MATCHED THEN UPDATE SET Activo = origen.Activo
        WHEN NOT MATCHED THEN INSERT (Rol_ID, Modulo_ID, Activo)
            VALUES (origen.Rol_ID, origen.Modulo_ID, origen.Activo);

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

PRINT '✅ SPs de autenticación y permisos (GuardarRol/Listar) creados.';
GO