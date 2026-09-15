-- ============================================
-- Migracion: Agregar restriccion unica en AUDIENCIA
-- Previene duplicados de audiencias por mismo expediente, fecha y hora
-- ============================================

-- Restriccion unica: un expediente no puede tener dos audiencias
-- en la misma fecha y hora de inicio
ALTER TABLE AUDIENCIA
ADD CONSTRAINT UQ_AUDIENCIA_EXPEDIENTE_FECHA_HORA
UNIQUE (Expediente_ID, Fecha, HoraInicio);

-- Indice para mejorar rendimiento de consultas por expediente y fecha
CREATE INDEX IX_AUDIENCIA_EXPEDIENTE_FECHA ON AUDIENCIA (Expediente_ID, Fecha);
