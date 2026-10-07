-- ============================================================
-- LEXCONTROL - 04_seed.sql
-- Datos iniciales de configuracion minimos para que el
-- sistema funcione: roles, modulos, matriz de permisos,
-- usuario administrador, configuracion del bufete, catalogos
-- y datos geograficos. Todos los inserts son idempotentes.
--
-- ACCESO INICIAL: admin / admin123
-- (hash SHA-256 de 'admin123', marcado HashLegacy = 1)
--
-- No incluye datos de demostracion (clientes, expedientes,
-- audiencias, notas ni documentos de prueba).
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
-- 1. Catalogos basicos y roles (ScriptsDB/00-LexControlDB.sql)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM [RAMA])
BEGIN
-- ============================================================
-- 9. DATOS DE CATÁLOGOS (SEED)
-- ============================================================

-- 9.1 RAMA
INSERT INTO RAMA (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Civil', 'CIV', 'Derecho Civil', '#358292', 1),
('Penal', 'PEN', 'Derecho Penal', '#B2845A', 2),
('Familiar', 'FAM', 'Derecho Familiar', '#97BEC6', 3),
('Municipal', 'MUN', 'Derecho Municipal', '#6C8B6C', 4),
('Laboral', 'LAB', 'Derecho Laboral', '#8E44AD', 5),
('Constitucional', 'CON', 'Derecho Constitucional', '#2C3E50', 6);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ESTADO_EXPEDIENTE])
BEGIN
-- 9.2 ESTADO_EXPEDIENTE
INSERT INTO ESTADO_EXPEDIENTE (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Activo', 'ACT', 'Expediente en trámite activo', '#358292', 1),
('En Espera', 'ESP', 'Expediente pausado', '#F39C12', 2),
('Cerrado', 'CER', 'Expediente finalizado', '#B2845A', 3),
('Archivado', 'ARC', 'Expediente archivado', '#95A5A6', 4),
('Urgente', 'URG', 'Expediente con prioridad urgente', '#E74C3C', 5);
END
GO

IF NOT EXISTS (SELECT 1 FROM [TIPO_AUDIENCIA])
BEGIN
-- 9.3 TIPO_AUDIENCIA
INSERT INTO TIPO_AUDIENCIA (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Conciliación', 'CONC', 'Audiencia de conciliación', '#2ECC71', 1),
('Juicio Oral', 'JO', 'Juicio oral y público', '#E74C3C', 2),
('Vista Pública', 'VP', 'Vista pública', '#3498DB', 3),
('Declaración', 'DEC', 'Declaración de parte', '#9B59B6', 4),
('Ratificación', 'RAT', 'Ratificación de pruebas', '#1ABC9C', 5);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ESTADO_AUDIENCIA])
BEGIN
-- 9.4 ESTADO_AUDIENCIA
INSERT INTO ESTADO_AUDIENCIA (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Programada', 'PROG', 'Audiencia programada', '#3498DB', 1),
('Realizada', 'REAL', 'Audiencia realizada', '#2ECC71', 2),
('Suspendida', 'SUSP', 'Audiencia suspendida', '#F39C12', 3),
('Cancelada', 'CANC', 'Audiencia cancelada', '#E74C3C', 4);
END
GO

IF NOT EXISTS (SELECT 1 FROM [RESULTADO_AUDIENCIA])
BEGIN
-- 9.5 RESULTADO_AUDIENCIA
INSERT INTO RESULTADO_AUDIENCIA (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Favorable', 'FAV', 'Resultado favorable', '#2ECC71', 1),
('Desfavorable', 'DES', 'Resultado desfavorable', '#E74C3C', 2),
('Parcial', 'PAR', 'Resultado parcial', '#F39C12', 3),
('Sin Resultado', 'SIN', 'No se obtuvo resultado', '#95A5A6', 4);
END
GO

IF NOT EXISTS (SELECT 1 FROM [TIPO_TRAMITE])
BEGIN
-- 9.6 TIPO_TRAMITE
INSERT INTO TIPO_TRAMITE (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Memorial', 'MEM', 'Presentación de memorial', '#3498DB', 1),
('Recurso', 'REC', 'Recurso de apelación', '#E74C3C', 2),
('Solicitud', 'SOL', 'Solicitud administrativa', '#2ECC71', 3),
('Notificación', 'NOT', 'Notificación de resolución', '#9B59B6', 4),
('Oficio', 'OFI', 'Oficio de comunicación', '#1ABC9C', 5);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ESTADO_TRAMITE])
BEGIN
-- 9.7 ESTADO_TRAMITE
INSERT INTO ESTADO_TRAMITE (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Ingresado', 'ING', 'Trámite ingresado', '#3498DB', 1),
('En Proceso', 'EP', 'Trámite en proceso', '#F39C12', 2),
('Resuelto', 'RES', 'Trámite resuelto', '#2ECC71', 3),
('Rechazado', 'REC', 'Trámite rechazado', '#E74C3C', 4);
END
GO

IF NOT EXISTS (SELECT 1 FROM [TIPO_DILIGENCIA])
BEGIN
-- 9.8 TIPO_DILIGENCIA
INSERT INTO TIPO_DILIGENCIA (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Asesoría', 'ASE', 'Asesoría con cliente', '#3498DB', 1),
('Redacción', 'RED', 'Redacción de documentos', '#2ECC71', 2),
('Revisión', 'REV', 'Revisión de expediente', '#F39C12', 3),
('Llamada', 'LLA', 'Llamada de seguimiento', '#9B59B6', 4),
('Visita', 'VIS', 'Visita a institución', '#E74C3C', 5),
('Correo', 'COR', 'Correo electrónico', '#1ABC9C', 6);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ESTADO_DILIGENCIA])
BEGIN
-- 9.9 ESTADO_DILIGENCIA
INSERT INTO ESTADO_DILIGENCIA (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Pendiente', 'PEN', 'Diligencia pendiente', '#F39C12', 1),
('En Progreso', 'EP', 'Diligencia en progreso', '#3498DB', 2),
('Completada', 'COM', 'Diligencia completada', '#2ECC71', 3),
('Cancelada', 'CAN', 'Diligencia cancelada', '#E74C3C', 4);
END
GO

IF NOT EXISTS (SELECT 1 FROM [TIPO_NOTIFICACION_OJ])
BEGIN
-- 9.10 TIPO_NOTIFICACION_OJ
INSERT INTO TIPO_NOTIFICACION_OJ (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Resolución', 'RES', 'Resolución judicial', '#3498DB', 1),
('Citación', 'CIT', 'Citación a audiencia', '#E74C3C', 2),
('Emplazamiento', 'EMP', 'Emplazamiento', '#2ECC71', 3);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ESTADO_NOTIFICACION_OJ])
BEGIN
-- 9.11 ESTADO_NOTIFICACION_OJ
INSERT INTO ESTADO_NOTIFICACION_OJ (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Recibida', 'REC', 'Notificación recibida', '#3498DB', 1),
('Atendida', 'ATE', 'Notificación atendida', '#2ECC71', 2),
('Pendiente', 'PEN', 'Notificación pendiente', '#F39C12', 3);
END
GO

IF NOT EXISTS (SELECT 1 FROM [TIPO_PROCESO])
BEGIN
-- 9.12 TIPO_PROCESO
INSERT INTO TIPO_PROCESO (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Juicio Ordinario', 'JO', 'Proceso de conocimiento pleno', '#3498DB', 1),
('Juicio Ejecutivo', 'JE', 'Proceso de ejecución', '#E74C3C', 2),
('Juicio Verbal', 'JV', 'Proceso verbal', '#2ECC71', 3),
('Proceso Especial', 'PE', 'Proceso especial', '#F39C12', 4);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ETIQUETA_NOTA])
BEGIN
-- 9.13 ETIQUETA_NOTA
INSERT INTO ETIQUETA_NOTA (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Urgente', 'URG', 'Nota urgente', '#E74C3C', 1),
('Importante', 'IMP', 'Nota importante', '#F39C12', 2),
('Recordatorio', 'REC', 'Recordatorio', '#3498DB', 3),
('Estrategia', 'EST', 'Nota estratégica', '#2ECC71', 4),
('Cliente', 'CLI', 'Nota sobre cliente', '#9B59B6', 5);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ESTADO_EVENTO])
BEGIN
-- 9.14 ESTADO_EVENTO
INSERT INTO ESTADO_EVENTO (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Pendiente', 'PEN', 'Evento pendiente', '#F39C12', 1),
('Completado', 'COM', 'Evento completado', '#2ECC71', 2),
('Cancelado', 'CAN', 'Evento cancelado', '#E74C3C', 3);
END
GO

IF NOT EXISTS (SELECT 1 FROM [TIPO_JUZGADO])
BEGIN
-- 9.15 TIPO_JUZGADO
INSERT INTO TIPO_JUZGADO (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Civil', 'CIV', 'Juzgado de Primera Instancia Civil', '#358292', 1),
('Penal', 'PEN', 'Juzgado de Primera Instancia Penal', '#B2845A', 2),
('Paz', 'PAZ', 'Juzgado de Paz', '#97BEC6', 3),
('Familia', 'FAM', 'Juzgado de Familia', '#6C8B6C', 4),
('Trabajo', 'TRA', 'Juzgado de Trabajo', '#8E44AD', 5),
('Mercantil', 'MER', 'Juzgado de lo Mercantil', '#2C3E50', 6);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ROL_PROCESAL])
BEGIN
-- 9.16 ROL_PROCESAL (CORREGIDO: Demandado con Valor 'DMD')
INSERT INTO ROL_PROCESAL (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Demandante', 'DEM', 'Persona que demanda o inicia el proceso', '#358292', 1),
('Demandado', 'DMD', 'Persona contra quien se demanda', '#B2845A', 2),
('Tercero Interesado', 'TER', 'Persona con interés legítimo en el proceso', '#F39C12', 3),
('Testigo', 'TES', 'Persona que declara en el proceso', '#97BEC6', 4),
('Perito', 'PER', 'Experto que dictamina en el proceso', '#8E44AD', 5),
('Ministerio Público', 'MP', 'Representante del MP en el proceso', '#2C3E50', 6),
('Querellante', 'QUE', 'Víctima que se querella', '#E74C3C', 7);
END
GO

IF NOT EXISTS (SELECT 1 FROM [ROL])
BEGIN
-- 9.17 ROL (Roles de Usuario)
INSERT INTO ROL (Nombre, Descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Secretaria', 'Acceso a gestión de agenda y documentos'),
('Abogado', 'Acceso a gestión de casos y audiencias');
END
GO

-- ------------------------------------------------------------
-- 2. Usuario administrador y configuracion (ScriptsDB/00)
-- ------------------------------------------------------------
-- ============================================================
-- 10. USUARIO ADMINISTRADOR (CORREGIDO)
-- ============================================================
-- Se usa lógica robusta para evitar el error de SCOPE_IDENTITY
-- en lotes separados.

IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE Usuario = N'admin')
BEGIN
    DECLARE @PersonaAdminID INT;
    SELECT @PersonaAdminID = MIN(P.ID)
    FROM PERSONA P
    WHERE P.NombreCompleto = N'Administrador del Sistema'
      AND NOT EXISTS (SELECT 1 FROM USUARIO U WHERE U.Persona_ID = P.ID);

    IF @PersonaAdminID IS NULL
    BEGIN
        INSERT INTO PERSONA (NombreCompleto, EmailPrincipal, Activo)
        VALUES (N'Administrador del Sistema', N'admin@bufete.com', 1);
        SET @PersonaAdminID = SCOPE_IDENTITY();
    END;

    INSERT INTO USUARIO (Persona_ID, Rol_ID, Usuario, ContraseñaHash)
    SELECT
        @PersonaAdminID,
        (SELECT MIN(ID) FROM ROL WHERE Nombre = N'Administrador'),
        N'admin',
        N'240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
    WHERE NOT EXISTS (SELECT 1 FROM USUARIO WHERE Usuario = N'admin');
END
GO

-- ============================================================
-- 11. CONFIGURACIÓN INICIAL (usa el ID real del admin)
-- ============================================================
DECLARE @AdminID INT = (SELECT MIN(ID) FROM USUARIO WHERE Usuario = N'admin');
IF @AdminID IS NOT NULL
BEGIN
    INSERT INTO CONFIGURACION (Clave, Valor, Descripcion, Usuario_ID)
    SELECT V.Clave, V.Valor, V.Descripcion, @AdminID
    FROM (VALUES
        (N'DiasAnticipacionAlerta',    N'5',              N'Días de anticipación para alertas de plazos'),
        (N'DiasAnticipacionAudiencia', N'3',              N'Días de anticipación para alertas de audiencias'),
        (N'FormatoExpediente',         N'C-{AÑO}-{NUM}',  N'Formato para números de expediente'),
        (N'NombreBufete',              N'Bufete Jurídico Mátzar', N'Nombre del bufete'),
        (N'EmailBufete',               N'info@bufete.com', N'Email de contacto del bufete')
    ) AS V(Clave, Valor, Descripcion)
    WHERE NOT EXISTS (SELECT 1 FROM CONFIGURACION C WHERE C.Clave = V.Clave);
END
GO

-- ------------------------------------------------------------
-- 3. Datos geograficos: departamentos, municipios y juzgados
--    (ScriptsDB/00)
-- ------------------------------------------------------------
-- ============================================================
-- 12. DATOS GEOGRÁFICOS (Departamentos, Municipios, Juzgados)
-- ============================================================

-- 12.1 Departamentos (22 de Guatemala)
IF NOT EXISTS (SELECT 1 FROM DEPARTAMENTO)
BEGIN
    INSERT INTO DEPARTAMENTO (Nombre, Codigo) VALUES
    (N'Guatemala',      N'01'),
    (N'El Progreso',    N'02'),
    (N'Sacatepéquez',   N'03'),
    (N'Chimaltenango',  N'04'),
    (N'Escuintla',      N'05'),
    (N'Santa Rosa',     N'06'),
    (N'Sololá',         N'07'),
    (N'Totonicapán',    N'08'),
    (N'Quetzaltenango', N'09'),
    (N'Suchitepéquez',  N'10'),
    (N'Retalhuleu',     N'11'),
    (N'San Marcos',     N'12'),
    (N'Huehuetenango',  N'13'),
    (N'Quiché',         N'14'),
    (N'Baja Verapaz',   N'15'),
    (N'Alta Verapaz',   N'16'),
    (N'Petén',          N'17'),
    (N'Izabal',         N'18'),
    (N'Zacapa',         N'19'),
    (N'Chiquimula',     N'20'),
    (N'Jalapa',         N'21'),
    (N'Jutiapa',        N'22');
END
GO

-- 12.2 Municipios (Sololá y Guatemala)
INSERT INTO MUNICIPIO (Departamento_ID, Nombre)
SELECT D.ID, V.Nombre
FROM (VALUES
    -- Sololá (19)
    (N'Sololá', N'Sololá'),
    (N'Sololá', N'San José Chacayá'),
    (N'Sololá', N'Santa Catarina Ixtahuacán'),
    (N'Sololá', N'Nahualá'),
    (N'Sololá', N'Santa Catarina Palopó'),
    (N'Sololá', N'San Antonio Palopó'),
    (N'Sololá', N'San Lucas Tolimán'),
    (N'Sololá', N'Santa Cruz La Laguna'),
    (N'Sololá', N'San Pablo La Laguna'),
    (N'Sololá', N'San Marcos La Laguna'),
    (N'Sololá', N'San Juan La Laguna'),
    (N'Sololá', N'San Pedro La Laguna'),
    (N'Sololá', N'Santiago Atitlán'),
    (N'Sololá', N'Panajachel'),
    (N'Sololá', N'Santa Clara La Laguna'),
    (N'Sololá', N'Concepción'),
    (N'Sololá', N'San Andrés Semetabaj'),
    (N'Sololá', N'San Jorge La Laguna'),
    (N'Sololá', N'Santa María Visitación'),
    -- Guatemala (16)
    (N'Guatemala', N'Guatemala'),
    (N'Guatemala', N'San José Pinula'),
    (N'Guatemala', N'San José del Golfo'),
    (N'Guatemala', N'Palencia'),
    (N'Guatemala', N'Chinautla'),
    (N'Guatemala', N'San Pedro Ayampuc'),
    (N'Guatemala', N'Mixco'),
    (N'Guatemala', N'San Pedro Sacatepéquez'),
    (N'Guatemala', N'San Juan Sacatepéquez'),
    (N'Guatemala', N'San Raymundo'),
    (N'Guatemala', N'Chuarrancho'),
    (N'Guatemala', N'Fraijanes'),
    (N'Guatemala', N'Amatitlán'),
    (N'Guatemala', N'Villa Nueva'),
    (N'Guatemala', N'Villa Canales'),
    (N'Guatemala', N'San Miguel Petapa')
) AS V(Departamento, Nombre)
INNER JOIN DEPARTAMENTO D ON D.Nombre = V.Departamento
WHERE NOT EXISTS (
    SELECT 1 FROM MUNICIPIO M
    WHERE M.Departamento_ID = D.ID AND M.Nombre = V.Nombre
);
GO

-- 12.3 Juzgados (según frontend de demostración)
INSERT INTO JUZGADO (Municipio_ID, Tipo_Juzgado_ID, Nombre, Direccion, Telefono, Email)
SELECT
    M.ID,
    TJ.ID,
    V.Nombre,
    V.Direccion,
    V.Telefono,
    V.Email
FROM (VALUES
    (N'Juzgado de Primera Instancia Civil de Sololá',
     N'Civil', N'Sololá', N'Sololá',
     N'8ª Calle 4-16, Zona 1, Sololá', N'7762-0391', N'juzgado1civsolola@oj.gob.gt'),
    (N'Juzgado de Primera Instancia Penal de Sololá',
     N'Penal', N'Sololá', N'Sololá',
     N'7ª Avenida 3-22, Zona 1, Sololá', N'7762-0415', N'juzgadopenalsolola@oj.gob.gt'),
    (N'Juzgado de Familia de Sololá',
     N'Familia', N'Sololá', N'Sololá',
     N'Calle de Los Ángeles 2-30, Zona 2, Sololá', N'7762-0208', N'juzgadofamiliasolola@oj.gob.gt'),
    (N'Juzgado de Trabajo y Previsión Social de Sololá',
     N'Trabajo', N'Sololá', N'Sololá',
     N'5ª Avenida 1-44, Zona 1, Sololá', N'7762-0577', N'juzgadotrabajosolola@oj.gob.gt'),
    (N'Juzgado de Paz de Santiago Atitlán',
     N'Paz', N'Santiago Atitlán', N'Sololá',
     N'Barrio San Pedro, Santiago Atitlán', N'7721-7344', N'juzgadopazsantiago@oj.gob.gt'),
    (N'Juzgado de Paz de Panajachel',
     N'Paz', N'Panajachel', N'Sololá',
     N'Calle de los Lagos 1-12, Panajachel', N'7762-1809', N'juzgadopazpanajachel@oj.gob.gt'),
    (N'Juzgado de Primera Instancia de Trabajo y Previsión Social',
     N'Trabajo', N'Guatemala', N'Guatemala',
     N'10ª Calle 8-20, Zona 1, Ciudad de Guatemala', NULL, NULL),
    (N'Juzgado de Paz Civil de Guatemala',
     N'Paz', N'Guatemala', N'Guatemala',
     N'12ª Avenida 5-60, Zona 1, Ciudad de Guatemala', NULL, NULL)
) AS V(Nombre, TipoJuzgado, Municipio, Departamento, Direccion, Telefono, Email)
INNER JOIN MUNICIPIO M
    ON M.Nombre = V.Municipio
   AND M.Departamento_ID = (SELECT ID FROM DEPARTAMENTO WHERE Nombre = V.Departamento)
INNER JOIN TIPO_JUZGADO TJ ON TJ.Nombre = V.TipoJuzgado
WHERE NOT EXISTS (SELECT 1 FROM JUZGADO J WHERE J.Nombre = V.Nombre);
GO

-- ------------------------------------------------------------
-- 4. Catalogo de modulos del sidebar (ScriptsDB/01-Usuarios_Permisos.sql)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 5. Matriz de permisos por rol (PERMISO_ROL)
--    Misma matriz por defecto que usa el frontend
--    (core/permisos/permisos.ts: PERMISOS_DEFECTO).
--    Sin estas filas el sidebar del rol quedaria vacio.
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM PERMISO_ROL)
BEGIN
    INSERT INTO PERMISO_ROL (Rol_ID, Modulo_ID, Activo)
    SELECT R.ID, M.ID, V.Activo
    FROM (VALUES
        (N'Administrador', N'dashboard', 1),
        (N'Administrador', N'clientes', 1),
        (N'Administrador', N'expedientes', 1),
        (N'Administrador', N'audiencias', 1),
        (N'Administrador', N'tramites', 1),
        (N'Administrador', N'historico', 1),
        (N'Administrador', N'notificaciones', 1),
        (N'Administrador', N'mantenimiento', 1),
        (N'Administrador', N'reportes', 1),
        (N'Administrador', N'ajustes', 1),
        (N'Secretaria', N'dashboard', 1),
        (N'Secretaria', N'clientes', 1),
        (N'Secretaria', N'expedientes', 1),
        (N'Secretaria', N'audiencias', 1),
        (N'Secretaria', N'tramites', 1),
        (N'Secretaria', N'historico', 0),
        (N'Secretaria', N'notificaciones', 0),
        (N'Secretaria', N'mantenimiento', 1),
        (N'Secretaria', N'reportes', 1),
        (N'Secretaria', N'ajustes', 1),
        (N'Abogado', N'dashboard', 1),
        (N'Abogado', N'clientes', 1),
        (N'Abogado', N'expedientes', 1),
        (N'Abogado', N'audiencias', 1),
        (N'Abogado', N'tramites', 1),
        (N'Abogado', N'historico', 1),
        (N'Abogado', N'notificaciones', 1),
        (N'Abogado', N'mantenimiento', 0),
        (N'Abogado', N'reportes', 1),
        (N'Abogado', N'ajustes', 1)
    ) AS V(Rol, Modulo, Activo)
    INNER JOIN ROL R ON R.Nombre = V.Rol
    INNER JOIN MODULO M ON M.Clave = V.Modulo;
END
GO

-- ------------------------------------------------------------
-- 6. Catalogo de resultados de diligencia (ScriptsDB/19)
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM RESULTADO_DILIGENCIA)
BEGIN
    INSERT INTO RESULTADO_DILIGENCIA (Nombre, Valor, Descripcion, Color, Orden) VALUES
    ('Ejecutada', 'EJE', 'Diligencia ejecutada', '#2ECC71', 1),
    ('No Ejecutada', 'NOE', 'Diligencia no ejecutada', '#E74C3C', 2),
    ('Re-programada', 'REPR', 'Diligencia reprogramada', '#F39C12', 3),
    ('Sin Resultado', 'SIN', 'Sin resultado registrado', '#95A5A6', 4);
END
GO
