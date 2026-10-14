USE DBLexControl;
GO

-- ============================================================
-- MIGRACIÓN: Actualización de catálogos según Formulario Respuesta
-- Origen: documentacion/Respuesta.md (respuestas del bufete)
-- Fecha: 2026-10-13
--
-- Reglas aplicadas:
--  * No se eliminan valores: solo activar/desactivar.
--  * Renombrados y altas son idempotentes (se pueden re-ejecutar).
--  * ESTADO_TRAMITE no se modifica (Resuelto/Rechazado se conservan
--    activos para poder cerrar tramites).
--  * RESULTADO_* no requieren columna nueva: el texto libre vive en
--    AUDIENCIA.DescripcionResultado / DILIGENCIA.DescripcionResultado.
--  * Se desactivan solo valores sin uso en TIPO_JUZGADO y ROL_PROCESAL
--    (el SP_Catalogo_CambiarEstado bloquea los que estan en uso).
-- ============================================================

-- ------------------------------------------------------------
-- 1) RAMA
-- ------------------------------------------------------------
-- 1.1 ID 4: Municipal -> Administrativo
UPDATE RAMA
SET Nombre = 'Administrativo',
    Valor = 'ADM',
    Descripcion = 'Derecho administrativo'
WHERE ID = 4 AND Nombre = 'Municipal';

-- 1.2 ID 6: desactivar Constitucional
UPDATE RAMA SET Activo = 0
WHERE ID = 6 AND Nombre = 'Constitucional';

-- 1.3 ID 8: Juicio Verbal -> Juicio (valor corregido) y reactivar
UPDATE RAMA
SET Nombre = 'Juicio',
    Valor = 'VP',
    Descripcion = 'Para una consulta no especifica',
    Activo = 1
WHERE ID = 8 AND Nombre = 'Juicio Verbal';

-- ------------------------------------------------------------
-- 2) TIPO_AUDIENCIA
-- ------------------------------------------------------------
-- 2.1 alta de Juicio Escrito
IF NOT EXISTS (SELECT 1 FROM TIPO_AUDIENCIA WHERE Nombre = 'Juicio Escrito')
BEGIN
    INSERT INTO TIPO_AUDIENCIA (Nombre, Valor, Descripcion, Color, Orden, Activo)
    VALUES ('Juicio Escrito', 'JE', 'Juicio escrito', '#2ECC71', 1, 1);
END;

-- 2.2 mantener Juicio Oral activo en el orden 2
UPDATE TIPO_AUDIENCIA
SET Orden = 2, Activo = 1
WHERE Nombre = 'Juicio Oral';

-- 2.3 desactivar tipos que ya no se usan
UPDATE TIPO_AUDIENCIA SET Activo = 0
WHERE Nombre IN ('Conciliacion', 'Vista Publica', 'Declaracion', 'Ratificacion')
   OR Nombre IN (N'Conciliación', N'Vista Pública', N'Declaración', N'Ratificación');

-- ------------------------------------------------------------
-- 3) ESTADO_AUDIENCIA
-- ------------------------------------------------------------
-- 3.1 alta de Reprogramada
IF NOT EXISTS (SELECT 1 FROM ESTADO_AUDIENCIA WHERE Nombre = 'Reprogramada')
BEGIN
    INSERT INTO ESTADO_AUDIENCIA (Nombre, Valor, Descripcion, Color, Orden, Activo)
    VALUES ('Reprogramada', 'REP', 'Audiencia reprogramada', '#F39C12', 3, 1);
END;

-- 3.2 desactivar Suspendida y Cancelada
UPDATE ESTADO_AUDIENCIA SET Activo = 0
WHERE Nombre IN ('Suspendida', 'Cancelada');

-- ------------------------------------------------------------
-- 4) RESULTADO_AUDIENCIA (resultado ahora es texto libre)
--    Los valores se conservan desactivados para no perder el
--    vinculo de las audiencias ya registradas (Resultado_ID).
-- ------------------------------------------------------------
UPDATE RESULTADO_AUDIENCIA SET Activo = 0;

-- ------------------------------------------------------------
-- 5) TIPO_TRAMITE (solo Memorial activo)
-- ------------------------------------------------------------
UPDATE TIPO_TRAMITE SET Activo = 0
WHERE Nombre <> 'Memorial';

-- ------------------------------------------------------------
-- 6) ESTADO_TRAMITE
--    SIN CAMBIOS: Resuelto y Rechazado permanecen activos.
--    El tramite se cierra cambiando de estado (SP_Tramite_ActualizarEstado).
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 7) TIPO_DILIGENCIA (manual: catalogo queda vacio)
-- ------------------------------------------------------------
UPDATE TIPO_DILIGENCIA SET Activo = 0;

-- ------------------------------------------------------------
-- 8) ESTADO_DILIGENCIA
-- ------------------------------------------------------------
-- 8.1 ID 1: Pendiente -> Programada
UPDATE ESTADO_DILIGENCIA
SET Nombre = 'Programada',
    Valor = 'PROG',
    Descripcion = 'Diligencia programada'
WHERE ID = 1 AND Nombre = 'Pendiente';

-- 8.2 ID 3: Completada se conserva activa y ocupa el orden 2
UPDATE ESTADO_DILIGENCIA
SET Orden = 2, Activo = 1
WHERE ID = 3 AND Nombre = 'Completada';

-- 8.3 alta de Reprogramada (orden 3)
IF NOT EXISTS (SELECT 1 FROM ESTADO_DILIGENCIA WHERE Nombre = 'Reprogramada')
BEGIN
    INSERT INTO ESTADO_DILIGENCIA (Nombre, Valor, Descripcion, Color, Orden, Activo)
    VALUES ('Reprogramada', 'REP', 'Diligencia reprogramada', NULL, 3, 1);
END;

-- 8.4 desactivar En Progreso y Cancelada
UPDATE ESTADO_DILIGENCIA SET Activo = 0
WHERE Nombre IN ('En Progreso', 'Cancelada');

-- ------------------------------------------------------------
-- 9) RESULTADO_DILIGENCIA (resultado ahora es texto libre)
-- ------------------------------------------------------------
UPDATE RESULTADO_DILIGENCIA SET Activo = 0;

-- ------------------------------------------------------------
-- 10) TIPO_NOTIFICACION_OJ
-- ------------------------------------------------------------
-- 10.1 Resolucion ya existe: se conserva activa con color y orden 1
UPDATE TIPO_NOTIFICACION_OJ
SET Valor = 'RES',
    Descripcion = 'Resolucion judicial',
    Color = '#3498DB',
    Orden = 1,
    Activo = 1
WHERE Nombre = N'Resolución' OR Nombre = 'Resolucion';

-- 10.2 desactivar Citacion y Emplazamiento
UPDATE TIPO_NOTIFICACION_OJ SET Activo = 0
WHERE Nombre IN (N'Citación', 'Citacion', N'Emplazamiento');

-- 10.3 alta de Notificacion
IF NOT EXISTS (SELECT 1 FROM TIPO_NOTIFICACION_OJ WHERE Nombre = N'Notificación')
BEGIN
    INSERT INTO TIPO_NOTIFICACION_OJ (Nombre, Valor, Descripcion, Color, Orden, Activo)
    VALUES (N'Notificación', 'NOT', N'Notificación', '#E74C3C', 2, 1);
END;

-- ------------------------------------------------------------
-- 11) ESTADO_NOTIFICACION_OJ (Recibida y Atendida se mantienen)
-- ------------------------------------------------------------
UPDATE ESTADO_NOTIFICACION_OJ SET Activo = 0
WHERE Nombre = 'Pendiente';

-- ------------------------------------------------------------
-- 12) TIPO_PROCESO (manual: catalogo queda vacio)
-- ------------------------------------------------------------
UPDATE TIPO_PROCESO SET Activo = 0;

-- ------------------------------------------------------------
-- 13) ETIQUETA_NOTA (manual: catalogo queda vacio)
-- ------------------------------------------------------------
UPDATE ETIQUETA_NOTA SET Activo = 0;

-- ------------------------------------------------------------
-- 14) ROL_PROCESAL
--     Solo se desactivan los sin uso. "Demandante" tiene una parte
--     procesal registrada y el sistema bloquea su desactivacion.
-- ------------------------------------------------------------
UPDATE ROL_PROCESAL SET Activo = 0
WHERE Nombre IN (N'Tercero Interesado', 'Testigo', 'Perito',
                 N'Ministerio Público', 'Querellante', 'Demandado')
   OR Nombre IN ('Ministerio Publico');

-- ------------------------------------------------------------
-- 15) TIPO_JUZGADO
--     Solo Mercantil no tiene juzgados asignados. Civil, Penal, Paz,
--     Familia y Trabajo tienen juzgados y su desactivacion esta bloqueada.
-- ------------------------------------------------------------
UPDATE TIPO_JUZGADO SET Activo = 0
WHERE Nombre = 'Mercantil';

-- ------------------------------------------------------------
-- 16) JUZGADO: sin cambios.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 17) DILIGENCIA: Tipo_ID pasa a ser opcional.
--     Todo el catalogo TIPO_DILIGENCIA queda desactivado (seccion 7),
--     por lo que el alta de diligencias ya no exige tipo.
-- ------------------------------------------------------------
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_NAME = 'DILIGENCIA' AND COLUMN_NAME = 'Tipo_ID'
             AND IS_NULLABLE = 'NO')
BEGIN
    ALTER TABLE DILIGENCIA ALTER COLUMN Tipo_ID INT NULL;
END
