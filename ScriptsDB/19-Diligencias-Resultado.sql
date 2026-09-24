-- ============================================================
-- 19. DILIGENCIAS: Resultado de la diligencia
--     Catálogo RESULTADO_DILIGENCIA + columnas en DILIGENCIA
--     + SPs de lectura/registro de resultado.
-- ============================================================

USE DBLexControl;
GO

-- 19.1 Catálogo RESULTADO_DILIGENCIA
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RESULTADO_DILIGENCIA')
BEGIN
    CREATE TABLE RESULTADO_DILIGENCIA (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(50) NOT NULL UNIQUE,
        Valor NVARCHAR(20) NULL,
        Descripcion NVARCHAR(200) NULL,
        Color NVARCHAR(7) NULL,
        Orden INT NOT NULL DEFAULT 0,
        Activo BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_RESULTADO_DILIGENCIA_Nombre ON RESULTADO_DILIGENCIA(Nombre);
    CREATE INDEX IX_RESULTADO_DILIGENCIA_Activo ON RESULTADO_DILIGENCIA(Activo);
END
GO

IF NOT EXISTS (SELECT 1 FROM RESULTADO_DILIGENCIA)
BEGIN
    INSERT INTO RESULTADO_DILIGENCIA (Nombre, Valor, Descripcion, Color, Orden) VALUES
    ('Ejecutada', 'EJE', 'Diligencia ejecutada', '#2ECC71', 1),
    ('No Ejecutada', 'NOE', 'Diligencia no ejecutada', '#E74C3C', 2),
    ('Re-programada', 'REPR', 'Diligencia reprogramada', '#F39C12', 3),
    ('Sin Resultado', 'SIN', 'Sin resultado registrado', '#95A5A6', 4);
END
GO

-- 19.2 Columnas de resultado en DILIGENCIA
IF COL_LENGTH('DILIGENCIA', 'Resultado_ID') IS NULL
BEGIN
    ALTER TABLE DILIGENCIA ADD Resultado_ID INT NULL;
    ALTER TABLE DILIGENCIA ADD CONSTRAINT FK_DILIGENCIA_RESULTADO_DILIGENCIA
        FOREIGN KEY (Resultado_ID) REFERENCES RESULTADO_DILIGENCIA(ID);
END
GO

IF COL_LENGTH('DILIGENCIA', 'DescripcionResultado') IS NULL
BEGIN
    ALTER TABLE DILIGENCIA ADD DescripcionResultado NVARCHAR(1000) NULL;
END
GO

-- 19.3 Listar con resultado (CREATE OR ALTER del SP existente)
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
        RD.Nombre AS Resultado,
        D.Resultado_ID,
        D.DescripcionResultado,
        D.TiempoDedicado,
        D.RecordatorioMinutos,
        D.Usuario_ID,
        PU.NombreCompleto AS Abogado,
        D.FechaCreacion
    FROM DILIGENCIA D
    LEFT JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
    LEFT JOIN CLIENTE C ON D.Cliente_ID = C.ID
    LEFT JOIN PERSONA PC ON C.Persona_ID = PC.ID
    LEFT JOIN RESULTADO_DILIGENCIA RD ON D.Resultado_ID = RD.ID
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

-- 19.4 Detalle con resultado
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
        RD.ID AS Resultado_ID,
        RD.Nombre AS Resultado,
        D.DescripcionResultado,
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
    LEFT JOIN RESULTADO_DILIGENCIA RD ON D.Resultado_ID = RD.ID
    INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
    INNER JOIN ESTADO_DILIGENCIA ED ON D.Estado_ID = ED.ID
    INNER JOIN USUARIO U ON D.Usuario_ID = U.ID
    INNER JOIN PERSONA PU ON U.Persona_ID = PU.ID
    WHERE D.ID = @ID;
END
GO

-- 19.5 Registrar/editar resultado (UPDATE incondicional, como audiencias)
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

PRINT 'OK 19-Diligencias-Resultado aplicado correctamente.';
GO
