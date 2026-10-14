# Plan de Implementación de Catálogos – LexControl

**Fecha:** 2026-10-11  
**Autor:** Análisis de cambios según `Formulario-Catalogos Respuesta.docx`  
**Destinatario:** OpenCode (equipo de desarrollo)

---

## 1. Contexto y Objetivo

El bufete ha completado el formulario de catálogos con los valores que desea utilizar en LexControl.  
Se deben actualizar los catálogos existentes (renombrar, agregar, desactivar) y realizar cambios en la base de datos, backend y frontend para reflejar la nueva configuración.

**Principios clave:**
- No se permite eliminar valores; solo **activar/desactivar**.
- Los nombres son únicos por catálogo (case‑insensitive, incluso desactivados).
- Algunos catálogos no se pueden desactivar si están en uso (Ramas, Estados de Expediente, Tipos de Proceso, Roles Procesales, Tipos de Juzgado, Etiquetas de Notas, Juzgados).
- Los cambios que impliquen “manual” significan que el catálogo debe quedar vacío (todos los valores desactivados) y el usuario los irá creando según necesidad.

---

## 2. Cambios por Catálogo

### 2.1 RAMA (Ramas del Derecho)

| ID | Acción | Nombre anterior | Nombre nuevo | Valor | Descripción | Activo |
|----|--------|----------------|--------------|-------|-------------|--------|
| 4  | Renombrar | Municipal | **Administrativo** | ADM | Derecho administrativo | Sí |
| 6  | Desactivar | Constitucional | — | — | — | No |
| 8  | Renombrar | Juicio Verbal | **Juicio** | **VP** | Para una consulta no específica | Sí |

*Nota:* El valor del ID 8 estaba mal (“Juicio”); corregir a **VP**.  
*Otros valores permanecen sin cambios (Civil, Penal, Familiar, Laboral, Derecho Ambiental).*

---

### 2.2 ESTADO_EXPEDIENTE (Estados de Expediente)

**Sin cambios.** Mantener los 5 valores actuales: Activo, En Espera, Cerrado, Archivado, Urgente.

---

### 2.3 TIPO_AUDIENCIA (Tipos de Audiencia)

| Acción | Nombre | Valor | Descripción | Color | Orden |
|--------|--------|-------|-------------|-------|-------|
| Agregar | Juicio Escrito | JE | Juicio escrito | #2ECC71 | 1 |
| Mantener | Juicio Oral | JO | Juicio oral y público | #E74C3C | 2 |
| Desactivar | Conciliación | — | — | — | — |
| Desactivar | Vista Pública | — | — | — | — |
| Desactivar | Declaración | — | — | — | — |
| Desactivar | Ratificación | — | — | — | — |

**Resultado:** Activos: Juicio Escrito, Juicio Oral.

---

### 2.4 ESTADO_AUDIENCIA (Estados de Audiencia)

| Acción | Nombre | Valor | Descripción | Color | Orden |
|--------|--------|-------|-------------|-------|-------|
| Mantener | Programada | PROG | Audiencia programada | #3498DB | 1 |
| Mantener | Realizada | REAL | Audiencia realizada | #2ECC71 | 2 |
| Agregar | Reprogramada | REP | Audiencia reprogramada | #F39C12 | 3 |
| Desactivar | Suspendida | — | — | — | — |
| Desactivar | Cancelada | — | — | — | — |

**Nombres fijos (§2.4):** Programada, Realizada, Cancelada, Suspendida, Reprogramada.  
El sistema ya reconoce “Reprogramada” con color naranja.

---

### 2.5 RESULTADO_AUDIENCIA (Resultados de Audiencia)

**Cambio de paradigma:** El bufete indica *“Debe ser por escrito, no valores predefinidos”*.  
- **Desactivar** todos los valores existentes (Favorable, Desfavorable, Parcial, Sin Resultado).  
- **Cambio en BD:** eliminar la FK a `RESULTADO_AUDIENCIA` y agregar columna `Resultado_Audiencia_Texto` (nvarchar(500)) en la tabla de audiencias.  
- **Cambio en UI:** el modal “Registrar resultado” debe usar un `<textarea>` en lugar de un `<select>`.

---

### 2.6 TIPO_TRAMITE (Tipos de Trámite)

| Acción | Nombre |
|--------|--------|
| Mantener | Memorial |
| Desactivar | Recurso |
| Desactivar | Solicitud |
| Desactivar | Notificación |
| Desactivar | Oficio |

**Resultado:** Solo activo: Memorial.

---

### 2.7 ESTADO_TRAMITE (Estados de Trámite)

| Acción | Nombre |
|--------|--------|
| Mantener | Ingresado |
| Mantener | En Proceso |
| Desactivar | Resuelto |
| Desactivar | Rechazado |

**Resultado:** Activos: Ingresado, En Proceso.

---

### 2.8 TIPO_DILIGENCIA (Tipos de Diligencia)

**Nota del bufete:** *“Que esta parte sea manual”*.  
- **Desactivar** todos los valores existentes (Asesoría, Redacción, Revisión, Llamada, Visita, Correo).  
- El catálogo queda vacío; el usuario los agregará manualmente.

---

### 2.9 ESTADO_DILIGENCIA (Estados de Diligencia)

| ID | Acción | Nombre anterior | Nombre nuevo | Valor | Activo |
|----|--------|----------------|--------------|-------|--------|
| 1  | Renombrar | Pendiente | **Programada** | PEN | Sí |
| 2  | Desactivar | En Progreso | — | — | No |
| 3  | Renombrar | Completada | **Reprogramada** | COM | Sí |
| 4  | Desactivar | Cancelada | — | — | No |

**⚠️ Advertencia:** Los nombres fijos del sistema son Pendiente, En Progreso, Completada, Cancelada.  
Al renombrar, los badges de color dejarán de funcionar. Se debe actualizar el mapeo en el frontend.

---

### 2.10 RESULTADO_DILIGENCIA (Resultados de Diligencia)

**Nota del bufete:** *“Que sea manual”*.  
- **Desactivar** todos los valores existentes (Ejecutada, No Ejecutada, Re‑programada, Sin Resultado).  
- **Cambio en BD:** agregar columna `Resultado_Diligencia_Texto` (nvarchar(500)) en la tabla de diligencias.  
- **Cambio en UI:** el modal “Registrar resultado” debe usar `<textarea>`.

---

### 2.11 TIPO_NOTIFICACION_OJ (Tipos de Notificación OJ)

| Acción | Nombre | Valor | Descripción | Color | Orden |
|--------|--------|-------|-------------|-------|-------|
| Desactivar todos los existentes | — | — | — | — | — |
| Agregar | Resolución | RES | Resolución judicial | #3498DB | 1 |
| Agregar | Notificación | NOT | Notificación | #E74C3C | 2 |

---

### 2.12 ESTADO_NOTIFICACION_OJ (Estados de Notificación OJ)

| Acción | Nombre |
|--------|--------|
| Mantener | Recibida |
| Mantener | Atendida |
| Desactivar | Pendiente |

**Nombres fijos (§2.4):** Pendiente, En Tramite, Atendida, Vencida, Rechazada.  
El bufete NO agregó los faltantes; solo mantiene Recibida y Atendida.  
*Nota:* “Recibida” no está mapeada a color en la pantalla.

---

### 2.13 TIPO_PROCESO (Tipos de Proceso)

**Nota del bufete:** *“Esto debe ser manual”*.  
- **Desactivar** todos los valores existentes (Juicio Ordinario, Juicio Ejecutivo, Juicio Verbal, Proceso Especial).  
- El catálogo queda vacío. Ya se captura como texto libre en el alta de expediente.

---

### 2.14 ETIQUETA_NOTA (Etiquetas de Notas)

**Nota del bufete:** *“Sin etiqueta de notas”*.  
- **Desactivar** todos los valores existentes (Urgente, Importante, Recordatorio, Estrategia).  
- Catálogo vacío.

---

### 2.15 ESTADO_EVENTO (Estados de Evento)

**Sin cambios.** Mantener: Pendiente, Completado, Cancelado.

---

### 2.16 TIPO_JUZGADO (Tipos de Juzgado)

**Nota del bufete:** *“Deben ser manual”*.  
- **Desactivar** los 6 valores existentes (Civil, Penal, Paz, Familia, Trabajo, Mercantil).  
- **⚠️ Dependencia:** si hay juzgados activos que usan estos tipos, el sistema bloquea la desactivación.  
- **Decisión sugerida:** NO desactivar si hay juzgados en uso; permitir que el usuario agregue nuevos tipos manualmente.

---

### 2.17 ROL_PROCESAL (Roles Procesales)

**Nota del bufete:** *“Debe ser manual”*.  
- **Desactivar** los 7 valores existentes (Demandante, Demandado, Tercero Interesado, Testigo, Perito, Ministerio Público, Querellante).  
- **⚠️ Dependencia:** si hay partes procesales registradas, el sistema bloquea la desactivación.  
- **Decisión sugerida:** NO desactivar si están en uso; permitir que el usuario agregue nuevos roles manualmente.

---

### 2.18 JUZGADO (Juzgados)

**Sin cambios en valores existentes.** Mantener los 9 juzgados.  
Recordar que Tipo y Municipio se capturan por ID (Anexos A y B del formulario original).

---

## 3. Cambios en Código

### 3.1 Backend (API REST)

| Componente | Cambio |
|------------|--------|
| Controladores/Servicios de Audiencias | Reemplazar `Resultado_Audiencia_ID` por `Resultado_Audiencia_Texto` (nvarchar 500). |
| Controladores/Servicios de Diligencias | Reemplazar `Resultado_Diligencia_ID` por `Resultado_Diligencia_Texto` (nvarchar 500). |
| DTOs | Actualizar `RegistrarResultadoAudienciaDto` y `RegistrarResultadoDiligenciaDto` para recibir string. |
| Validaciones | Hacer opcional el resultado; validar solo longitud. |
| Seeds | Modificar scripts de seed para reflejar los nuevos valores y desactivaciones. |

### 3.2 Frontend (Angular)

| Componente | Cambio |
|------------|--------|
| Modal “Registrar resultado” de audiencia | Cambiar `<select>` por `<textarea>` o `<input type="text">`. |
| Modal “Registrar resultado” de diligencia | Cambiar `<select>` por `<textarea>`. |
| Badges de Estado de Diligencia | Actualizar mapeo: “Programada” → color naranja (#F39C12), “Reprogramada” → color verde (#2ECC71). |
| Badges de Estado de Audiencia | Agregar mapeo para “Reprogramada” → #F39C12. |
| Badges de Estado de Notificación OJ | Verificar que “Recibida” y “Atendida” tengan color; “Recibida” probablemente no está mapeada. |

### 3.3 Base de Datos

| Script | Acción |
|--------|--------|
| `ScriptsDB/06-Mantenimiento_Catalogos.sql` | Actualizar seeds iniciales. |
| `ScriptsDB/08-Migracion-Catalogos-Respuesta.sql` | **NUEVO** – script de migración. |
| Tablas de Audiencias y Diligencias | Agregar columnas de texto para resultados; eliminar FK a catálogos de resultado (o dejar nullable). |

---

## 4. Script de Migración SQL

```sql
-- ============================================================
-- Migración: Actualización de catálogos según Formulario Respuesta
-- Fecha: 2026-10-11
-- ============================================================

-- 4.1 RAMA: Renombrar Municipal → Administrativo
UPDATE RAMA 
SET Nombre = 'Administrativo', 
    Valor = 'ADM', 
    Descripcion = 'Derecho administrativo'
WHERE ID = 4 AND Nombre = 'Municipal';

-- 4.2 RAMA: Desactivar Constitucional
UPDATE RAMA SET Activo = 0 WHERE ID = 6 AND Nombre = 'Constitucional';

-- 4.3 RAMA: Renombrar Juicio Verbal → Juicio, corregir Valor
UPDATE RAMA 
SET Nombre = 'Juicio', 
    Valor = 'VP',
    Descripcion = 'Para una consulta no específica'
WHERE ID = 8;

-- 4.4 TIPO_AUDIENCIA: Agregar Juicio Escrito
IF NOT EXISTS (SELECT 1 FROM TIPO_AUDIENCIA WHERE LOWER(Nombre) = 'juicio escrito')
BEGIN
    INSERT INTO TIPO_AUDIENCIA (Nombre, Valor, Descripcion, Color, Orden)
    VALUES ('Juicio Escrito', 'JE', 'Juicio escrito', '#2ECC71', 1);
END

-- 4.5 TIPO_AUDIENCIA: Desactivar Conciliación, Vista Pública, Declaración, Ratificación
UPDATE TIPO_AUDIENCIA SET Activo = 0 
WHERE Nombre IN ('Conciliación', 'Vista Pública', 'Declaración', 'Ratificación');

-- 4.6 TIPO_AUDIENCIA: Asegurar Juicio Oral activo con Orden 2
UPDATE TIPO_AUDIENCIA SET Orden = 2, Activo = 1 WHERE Nombre = 'Juicio Oral';

-- 4.7 ESTADO_AUDIENCIA: Agregar Reprogramada
IF NOT EXISTS (SELECT 1 FROM ESTADO_AUDIENCIA WHERE LOWER(Nombre) = 'reprogramada')
BEGIN
    INSERT INTO ESTADO_AUDIENCIA (Nombre, Valor, Descripcion, Color, Orden)
    VALUES ('Reprogramada', 'REP', 'Audiencia reprogramada', '#F39C12', 3);
END

-- 4.8 ESTADO_AUDIENCIA: Desactivar Suspendida y Cancelada
UPDATE ESTADO_AUDIENCIA SET Activo = 0 WHERE Nombre IN ('Suspendida', 'Cancelada');

-- 4.9 RESULTADO_AUDIENCIA: Desactivar todos
UPDATE RESULTADO_AUDIENCIA SET Activo = 0;

-- 4.10 TIPO_TRAMITE: Desactivar todos excepto Memorial
UPDATE TIPO_TRAMITE SET Activo = 0 WHERE Nombre <> 'Memorial';

-- 4.11 ESTADO_TRAMITE: Desactivar Resuelto y Rechazado
UPDATE ESTADO_TRAMITE SET Activo = 0 WHERE Nombre IN ('Resuelto', 'Rechazado');

-- 4.12 TIPO_DILIGENCIA: Desactivar todos
UPDATE TIPO_DILIGENCIA SET Activo = 0;

-- 4.13 ESTADO_DILIGENCIA: Renombrar Pendiente → Programada
UPDATE ESTADO_DILIGENCIA 
SET Nombre = 'Programada', Descripcion = 'Diligencia programada'
WHERE ID = 1 AND Nombre = 'Pendiente';

-- 4.14 ESTADO_DILIGENCIA: Renombrar Completada → Reprogramada
UPDATE ESTADO_DILIGENCIA 
SET Nombre = 'Reprogramada', Descripcion = 'Diligencia reprogramada'
WHERE ID = 3 AND Nombre = 'Completada';

-- 4.15 ESTADO_DILIGENCIA: Desactivar En Progreso y Cancelada
UPDATE ESTADO_DILIGENCIA SET Activo = 0 WHERE Nombre IN ('En Progreso', 'Cancelada');

-- 4.16 RESULTADO_DILIGENCIA: Desactivar todos
UPDATE RESULTADO_DILIGENCIA SET Activo = 0;

-- 4.17 TIPO_NOTIFICACION_OJ: Desactivar existentes y agregar nuevos
UPDATE TIPO_NOTIFICACION_OJ SET Activo = 0;

IF NOT EXISTS (SELECT 1 FROM TIPO_NOTIFICACION_OJ WHERE LOWER(Nombre) = 'resolución')
BEGIN
    INSERT INTO TIPO_NOTIFICACION_OJ (Nombre, Valor, Descripcion, Color, Orden)
    VALUES ('Resolución', 'RES', 'Resolución judicial', '#3498DB', 1);
END

IF NOT EXISTS (SELECT 1 FROM TIPO_NOTIFICACION_OJ WHERE LOWER(Nombre) = 'notificación')
BEGIN
    INSERT INTO TIPO_NOTIFICACION_OJ (Nombre, Valor, Descripcion, Color, Orden)
    VALUES ('Notificación', 'NOT', 'Notificación', '#E74C3C', 2);
END

-- 4.18 ESTADO_NOTIFICACION_OJ: Desactivar Pendiente
UPDATE ESTADO_NOTIFICACION_OJ SET Activo = 0 WHERE Nombre = 'Pendiente';

-- 4.19 ETIQUETA_NOTA: Desactivar todos
UPDATE ETIQUETA_NOTA SET Activo = 0;

-- 4.20 TIPO_PROCESO: Desactivar todos
UPDATE TIPO_PROCESO SET Activo = 0;

-- 4.21 ROL_PROCESAL: Solo desactivar si no hay partes en uso
-- (El sistema bloquea la desactivación si hay registros que los usan)
-- UPDATE ROL_PROCESAL SET Activo = 0;

-- 4.22 TIPO_JUZGADO: Solo desactivar si no hay juzgados en uso
-- UPDATE TIPO_JUZGADO SET Activo = 0;

-- 4.23 Agregar columnas de texto para resultados
ALTER TABLE AUDIENCIA ADD Resultado_Audiencia_Texto NVARCHAR(500) NULL;
ALTER TABLE DILIGENCIA ADD Resultado_Diligencia_Texto NVARCHAR(500) NULL;
-- Opcional: eliminar FK si existen
-- ALTER TABLE AUDIENCIA DROP CONSTRAINT FK_Audiencia_Resultado;
-- ALTER TABLE DILIGENCIA DROP CONSTRAINT FK_Diligencia_Resultado;