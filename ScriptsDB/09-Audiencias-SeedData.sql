-- ============================================
-- Seed: Datos de prueba para AUDIENCIA
-- Crea personas, clientes, expedientes y audiencias de prueba
-- ============================================

-- Solo insertar si no hay audiencias en la tabla
IF NOT EXISTS (SELECT 1 FROM AUDIENCIA)
BEGIN
    SET NOCOUNT ON;

    -- ============================================================
    -- 1. PERSONAS (clientes de prueba)
    -- ============================================================
    INSERT INTO PERSONA (NombreCompleto, DPI, TelefonoPrincipal, EmailPrincipal, Direccion, Genero, Activo)
    VALUES
    (N'Carlos Morales Ortiz',   N'2983123450101', N'+502 5555-0123', N'carlos.mo@email.com',   N'Calle Principal 5-20, Zona 1, Panajachel', 'M', 1),
    (N'Maria Elena Vasquez',    N'2983123450202', N'+502 5555-0456', N'maria.vasquez@email.com', N'Av. Reforma 10-30, Zona 2, Solola',       'F', 1),
    (N'Pedro Alvarado Mendez',  N'2983123450303', N'+502 5555-0789', N'pedro.alv@email.com',   N'Barrio El Calvario, Santiago Atitlan',      'M', 1),
    (N'Lucia Fernandez Rios',   N'2983123450404', N'+502 5555-1011', N'lucia.fer@email.com',   N'5a Avenida 3-15, Zona 3, Panajachel',       'F', 1);

    -- ============================================================
    -- 2. CLIENTES (vinculados a las personas)
    -- ============================================================
    DECLARE @Persona1 INT = (SELECT ID FROM PERSONA WHERE DPI = N'2983123450101');
    DECLARE @Persona2 INT = (SELECT ID FROM PERSONA WHERE DPI = N'2983123450202');
    DECLARE @Persona3 INT = (SELECT ID FROM PERSONA WHERE DPI = N'2983123450303');
    DECLARE @Persona4 INT = (SELECT ID FROM PERSONA WHERE DPI = N'2983123450404');

    INSERT INTO CLIENTE (Persona_ID, TipoCliente, Notas, Activo)
    VALUES
    (@Persona1, N'Particular', N'Cliente referido por recomendacion', 1),
    (@Persona2, N'Empresa',    N'Empresa constructora',              1),
    (@Persona3, N'Particular', N'Caso familiar',                     1),
    (@Persona4, N'Particular', N'Demanda laboral activa',            1);

    DECLARE @Cliente1 INT = (SELECT ID FROM CLIENTE WHERE Persona_ID = @Persona1);
    DECLARE @Cliente2 INT = (SELECT ID FROM CLIENTE WHERE Persona_ID = @Persona2);
    DECLARE @Cliente3 INT = (SELECT ID FROM CLIENTE WHERE Persona_ID = @Persona3);
    DECLARE @Cliente4 INT = (SELECT ID FROM CLIENTE WHERE Persona_ID = @Persona4);

    -- ============================================================
    -- 3. EXPEDIENTES (5 de prueba)
    -- ============================================================
    -- RAMA: 1=Civil, 2=Penal, 3=Familiar, 4=Municipal, 5=Laboral
    -- ROL_PROCESAL: 1=Demandante, 2=Demandado
    -- ESTADO_EXPEDIENTE: 1=Activo, 2=En Espera, 3=Cerrado
    -- JUZGADO: 1-8 (varios)
    -- USUARIO: 1=admin

    INSERT INTO EXPEDIENTE (Cliente_ID, Rol_Procesal_ID, NoExpediente, Rama_ID, TipoProceso, Juzgado_ID, FechaIngreso, Estado_ID, Descripcion, Usuario_ID)
    VALUES
    (@Cliente1, 1, N'CIV-2026-0001', 1, N'Incumplimiento Contractual', 1, '2026-01-15', 1, N'Demanda por incumplimiento de contrato de servicios', 1),
    (@Cliente2, 1, N'CIV-2026-0002', 1, N'Daños y Perjuicios',         1, '2026-02-20', 1, N'Claims por danos en propiedad',                          1),
    (@Cliente3, 1, N'FAM-2026-0001', 3, N'Pension Alimenticia',         3, '2026-03-10', 1, N'Demanda de pension alimenticia para menores',            1),
    (@Cliente4, 1, N'LAB-2026-0001', 5, N'Despido Injustificado',       4, '2026-04-05', 1, N'Demanda laboral por despido sin causa justificada',      1),
    (@Cliente1, 2, N'PEN-2026-0001', 2, N'Denuncia por Estafa',         2, '2026-05-12', 1, N'Denuncia penal por estafa commercial',                   1);

    DECLARE @Exp1 INT = (SELECT ID FROM EXPEDIENTE WHERE NoExpediente = N'CIV-2026-0001');
    DECLARE @Exp2 INT = (SELECT ID FROM EXPEDIENTE WHERE NoExpediente = N'CIV-2026-0002');
    DECLARE @Exp3 INT = (SELECT ID FROM EXPEDIENTE WHERE NoExpediente = N'FAM-2026-0001');
    DECLARE @Exp4 INT = (SELECT ID FROM EXPEDIENTE WHERE NoExpediente = N'LAB-2026-0001');
    DECLARE @Exp5 INT = (SELECT ID FROM EXPEDIENTE WHERE NoExpediente = N'PEN-2026-0001');

    -- ============================================================
    -- 4. AUDIENCIAS (8 de prueba, distribuidas en septiembre 2026)
    -- ============================================================
    -- TIPO_AUDIENCIA: 1=Conciliacion, 2=Juicio Oral, 3=Vista Publica, 4=Declaracion, 5=Ratificacion
    -- ESTADO_AUDIENCIA: 1=Programada, 2=Realizada, 3=Suspendida, 4=Cancelada
    -- JUZGADO: 1=Juzgado Civil Solola, 2=Juzgado Penal Solola, 3=Juzgado Familia Solola, 4=Juzgado Trabajo Solola

    INSERT INTO AUDIENCIA (Expediente_ID, Fecha, HoraInicio, HoraFin, Tipo_ID, Juzgado_ID, Sala, Estado_ID, Notas, Usuario_Creacion_ID)
    VALUES
    -- Semana 1: 1-5 septiembre 2026
    (@Exp1, '2026-09-01', '09:00', '11:00', 1, 1, N'Sala 1', 2, N'Conciliacion exitosa entre las partes', 1),
    (@Exp2, '2026-09-02', '10:00', '12:00', 2, 1, N'Sala 2', 2, N'Juicio oral - testimonios presentados', 1),
    (@Exp3, '2026-09-03', '08:30', '10:30', 3, 3, N'Sala 1', 2, N'Vista publica - pruebas admitidas', 1),

    -- Semana 2: 8-12 septiembre 2026
    (@Exp4, '2026-09-08', '14:00', '16:00', 4, 4, N'Sala 1', 2, N'Declaracion del demandante', 1),
    (@Exp5, '2026-09-10', '09:00', '11:00', 5, 2, N'Sala 1', 1, N'Ratificacion de pericial', 1),

    -- Semana 3: 15-19 septiembre 2026
    (@Exp1, '2026-09-15', '10:00', '12:00', 2, 1, N'Sala 1', 1, N'Segunda audiencia - presentacion de alegatos', 1),
    (@Exp3, '2026-09-17', '09:00', '11:00', 1, 3, N'Sala 2', 1, N'Conciliacion en caso de pension', 1),

    -- Semana 4: 22-26 septiembre 2026
    (@Exp2, '2026-09-22', '11:00', '13:00', 3, 1, N'Sala 3', 1, N'Vista publica - sentencia programada', 1);

    PRINT 'Datos seed de audiencias insertados correctamente.';
    PRINT 'Se crearon 4 personas, 4 clientes, 5 expedientes y 8 audiencias.';
END
ELSE
BEGIN
    PRINT 'Ya existen audiencias en la tabla. No se insertaron datos.';
END
GO
