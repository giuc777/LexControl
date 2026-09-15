-- ============================================================
-- 11. DILIGENCIA: CRUD completo
--     Tabla DILIGENCIA (columnas corregidas segun DDL real).
--     Constraint: al menos Expediente_ID o Cliente_ID debe ser NOT NULL.
--     No existe columna Activo → "eliminar" = Estado_ID = Cancelada.
-- ============================================================

-- 11.1 Listar diligencias con filtros opcionales.
--      Filtros: Expediente_ID, Cliente_ID, Tipo_ID, Estado_ID,
--               Usuario_ID, FechaInicio, FechaFin. Todos NULL = sin filtro.
CREATE OR ALTER PROCEDURE SP_Diligencia_Listar
    @Expediente_ID INT = NULL,
    @Cliente_ID INT = NULL,
    @Tipo_ID INT = NULL,
    @Estado_ID INT = NULL,
    @Usuario_ID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        D.ID,
        D.Expediente_ID,
        E.NoExpediente,
        D.Cliente_ID,
        PC.NombreCompleto AS Cliente,
        TD.Nombre AS Tipo,
        D.Titulo,
        D.Fecha,
        D.HoraInicio,
        D.DiaCompleto,
        D.Ubicacion,
        D.Oficina,
        ED.Nombre AS Estado,
        D.TiempoDedicado,
        D.RecordatorioMinutos,
        D.Usuario_ID,
        PU.NombreCompleto AS Abogado,
        D.FechaCreacion
    FROM DILIGENCIA D
    LEFT JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
    LEFT JOIN CLIENTE C ON D.Cliente_ID = C.ID
    LEFT JOIN PERSONA PC ON C.Persona_ID = PC.ID
    INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
    INNER JOIN ESTADO_DILIGENCIA ED ON D.Estado_ID = ED.ID
    INNER JOIN USUARIO U ON D.Usuario_ID = U.ID
    INNER JOIN PERSONA PU ON U.Persona_ID = PU.ID
    WHERE (@Expediente_ID IS NULL OR D.Expediente_ID = @Expediente_ID)
      AND (@Cliente_ID IS NULL OR D.Cliente_ID = @Cliente_ID)
      AND (@Tipo_ID IS NULL OR D.Tipo_ID = @Tipo_ID)
      AND (@Estado_ID IS NULL OR D.Estado_ID = @Estado_ID)
      AND (@Usuario_ID IS NULL OR D.Usuario_ID = @Usuario_ID)
      AND (@FechaInicio IS NULL OR D.Fecha >= @FechaInicio)
      AND (@FechaFin IS NULL OR D.Fecha <= @FechaFin)
      AND ED.Nombre != N'Cancelada'
    ORDER BY D.Fecha DESC, D.HoraInicio DESC;
END
GO

-- 11.2 Obtener una diligencia por ID (detalle completo).
CREATE OR ALTER PROCEDURE SP_Diligencia_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        D.ID,
        D.Expediente_ID,
        E.NoExpediente,
        D.Cliente_ID,
        PC.NombreCompleto AS Cliente,
        TD.ID AS Tipo_ID,
        TD.Nombre AS Tipo,
        TD.Color AS TipoColor,
        D.Titulo,
        D.Descripcion,
        D.Fecha,
        D.HoraInicio,
        D.DiaCompleto,
        D.Ubicacion,
        D.Oficina,
        ED.ID AS Estado_ID,
        ED.Nombre AS Estado,
        ED.Color AS EstadoColor,
        D.Notas,
        D.TiempoDedicado,
        D.RecordatorioMinutos,
        D.Usuario_ID,
        PU.NombreCompleto AS Abogado,
        D.FechaCreacion
    FROM DILIGENCIA D
    LEFT JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
    LEFT JOIN CLIENTE C ON D.Cliente_ID = C.ID
    LEFT JOIN PERSONA PC ON C.Persona_ID = PC.ID
    INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
    INNER JOIN ESTADO_DILIGENCIA ED ON D.Estado_ID = ED.ID
    INNER JOIN USUARIO U ON D.Usuario_ID = U.ID
    INNER JOIN PERSONA PU ON U.Persona_ID = PU.ID
    WHERE D.ID = @ID;
END
GO

-- 11.3 Insertar una nueva diligencia.
--      Requiere al menos Expediente_ID o Cliente_ID NO NULL.
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

-- 11.4 Actualizar una diligencia existente.
--      Solo actualiza los campos enviados (NULL = sin cambio).
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

-- 11.5 "Eliminar" una diligencia → cambia estado a Cancelada.
--      No existe columna Activo en DILIGENCIA.
CREATE OR ALTER PROCEDURE SP_Diligencia_Eliminar
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoCancelada INT;
        SELECT @EstadoCancelada = ID FROM ESTADO_DILIGENCIA WHERE Nombre = N'Cancelada';

        IF @EstadoCancelada IS NULL
        BEGIN
            SET @EstadoCancelada = 4; -- Fallback: ID 4 en el seed
        END

        UPDATE DILIGENCIA SET Estado_ID = @EstadoCancelada WHERE ID = @ID;

        IF @@ROWCOUNT = 0
            RETURN -2; -- No encontrado
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER();
    END CATCH
END
GO

PRINT 'OK SP_Diligencia_* creados correctamente.';
GO
