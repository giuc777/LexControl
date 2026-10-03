# Formulario de Catálogos - Documento de Captura

> Documento de trabajo para **llenar fuera del sistema** todos los valores maestros
> (catálogos) que LexControl necesita para operar: ramas, estados, tipos, roles y juzgados.
>
> **Criterio**: El bufete llena este formulario con los valores que desea usar; después el
> contenido se **captura en el sistema** (pantalla **Mantenimiento**) o se **entrega al técnico**
> para una carga masiva (Anexo C). Incluye (1) las reglas que impone el sistema,
> (2) una ficha por catálogo con sus **valores actuales** y su **tabla en blanco para llenar**,
> y (3) los anexos de IDs necesarios para los juzgados.

---

## 1. Objetivo y cómo usar este formulario

### 1.1 ¿Qué es?

LexControl no inventa estados ni tipos: todo lo que aparece en los desplegables
(expedientes, agenda, trámites, diligencias, notificaciones) vive en **catálogos** de la base
de datos. Este documento le dice a la persona que va a configurar el sistema **qué campos
llenar, con qué límites y qué nombres no se deben cambiar**.

### 1.2 Flujo de uso

1. Leer primero la **sección 2 (Reglas generales)**. Evita errores al capturar.
2. Abrir cada catálogo (**sección 3**) y revisar la tabla **"Valores ya existentes"**:
   si el valor que necesita ya está, no lo vuelva a anotar (el sistema rechaza nombres repetidos).
3. Anotar los valores nuevos en la tabla **"Valores a agregar (llenar aquí)"**.
4. Marcar el **checklist de captura (sección 5)** conforme se capture cada catálogo.
5. Capturar en el sistema (§1.3) o entregar el documento al técnico (Anexo C).

### 1.3 ¿Quién puede capturar los valores?

Solo el rol **Administrador** puede crear, editar y activar/desactivar valores de catálogo.
Otros roles pueden abrir **Mantenimiento** y consultar, pero el botón **"Nuevo valor"** no les
funciona (el API responde `403`).

**Ruta de captura:** iniciar sesión → menú lateral **Mantenimiento** → tarjeta del catálogo →
botón **"Nuevo valor"** → llenar el formulario → **"Guardar valor"**.

### 1.4 Dónde se usa cada catálogo

| Catálogo | Se usa en |
|---|---|
| Ramas del Derecho | Expedientes (alta, filtros), Histórico, Reportes "Expedientes por Rama" |
| Estados de Expediente | Expedientes (alta, filtros), Histórico |
| Tipos de Audiencia | Agenda (alta de audiencia), listado de audiencias |
| Estados de Audiencia | Agenda y listado de audiencias (estado y filtros) |
| Resultados de Audiencia | Modal "Registrar resultado" de una audiencia |
| Tipos de Trámite | Trámites (alta y filtros) |
| Estados de Trámite | Trámites (estado y filtros) |
| Tipos de Diligencia | Diligencias (alta y filtros), tarjetas de la agenda |
| Estados de Diligencia | Diligencias (estado y filtros) |
| Resultados de Diligencia | Modal "Registrar resultado" de una diligencia |
| Tipos de Notificación OJ | Notificaciones OJ (alta y filtros) |
| Estados de Notificación OJ | Notificaciones OJ (estado y filtros) |
| Tipos de Proceso | Referencia de expedientes (se captura como **texto libre** en el alta; no hay desplegable) |
| Etiquetas de Notas | Notas internas del expediente (el sistema lo admite; el formulario actual aún no lo ofrece) |
| Estados de Evento | Eventos de la agenda (catálogo disponible; aún no se muestra en pantalla) |
| Tipos de Juzgado | Obligatorio para dar de alta un Juzgado |
| Roles Procesales | Partes del expediente (Demandante, Demandado, Testigo…) |
| Juzgados / Tribunales | Expedientes, Agenda y Notificaciones (desplegable de juzgado) |

---

## 2. Reglas generales que impone el sistema

> **Esta sección es de lectura obligatoria antes de llenar cualquier tabla.**

### 2.1 Campos de un catálogo estándar (17 catálogos)

El formulario del sistema pide los mismos cinco campos en todos los catálogos estándar:

| Campo | Obligatorio | Longitud / formato | Ejemplo | Para qué sirve |
|---|---|---|---|---|
| **Nombre** | **Sí** | Máx. 50 caracteres | `Juicio Verbal` | Texto visible en desplegables, listas y reportes. **Debe ser único** dentro del catálogo. |
| **Valor** | No | Máx. 20 caracteres | `JV` | Código corto de referencia; también se usa al buscar dentro del catálogo. |
| **Descripción** | No | Máx. 200 caracteres | `Proceso verbal` | Texto de ayuda; también se usa al buscar dentro del catálogo. |
| **Color** | No | **Exactamente 7 caracteres**: `#` + 6 dígitos hex | `#358292` | Color del punto en las listas y de los reportes. Si se deja vacío, usa el color gris por defecto. |
| **Orden** | No | Número entero ≥ 0 | `1` | Define el orden en los desplegables y listas (de menor a mayor; en empate ordena por Nombre). |

**Caso JUZGADO** (no es estándar): pide `Nombre` (obligatorio, máx. 100), `Tipo de juzgado`
(obligatorio, por **ID**), `Municipio` (obligatorio, por **ID**), `Dirección`, `Teléfono` y
`Correo`. Ver **sección 4** y **Anexos A y B**.

### 2.2 Reglas de negocio

| # | Regla | Consecuencia |
|---|---|---|
| 1 | **No se puede borrar un valor.** Solo se puede **Desactivar/Activar**. | Los expedientes antiguos no quedan con datos colgando. |
| 2 | **El Nombre debe ser único por catálogo**, sin importar mayúsculas/minúsculas, y **también cuenta un valor desactivado**. | `Civil` y `civil` son el mismo nombre: el segundo será rechazado. |
| 3 | Al **editar**, el sistema acepta conservar el propio nombre; pero cualquier otro nombre ya usado (aunque esté desactivado) se rechaza. | Vea los mensajes exactos en la sección 6. |
| 4 | Un valor en uso **no se puede desactivar** (solo en 6 catálogos + Juzgados, ver §2.3). | Aparece el mensaje con la cantidad de registros que lo usan. |
| 5 | El campo **Activo** nace en `Sí` al crear. | Para ocultarlo de los desplegables, desactívelo, no lo borre. |
| 6 | **La Fecha de creación es automática**; no se captura ni se edita. | — |
| 7 | La búsqueda dentro del catálogo busca por **Nombre, Descripción y Valor**. | — |
| 8 | Solo **Administrador** crea/edita/cambia estado. | Otros roles ven `403 Forbidden`. |

### 2.3 Catálogos que NO se pueden desactivar si están en uso

Si se desactiva un valor de estos catálogos y ya está referenciado, el sistema lo **bloquea**
con un mensaje. Para retirarlo hay que dejar de usarlo primero en sus registros.

| Catálogo | Bloqueo | Mensaje exacto |
|---|---|---|
| Ramas del Derecho | Hay expedientes con esa rama | `No se puede desactivar: N expediente(s) referencia(n) esta rama.` |
| Estados de Expediente | Hay expedientes con ese estado | `No se puede desactivar: N expediente(s) tiene(n) este estado.` |
| Tipos de Proceso | Hay expedientes con ese texto | `No se puede desactivar: N expediente(s) usa(n) este tipo de proceso.` |
| Roles Procesales | Hay partes con ese rol | `No se puede desactivar: N parte(s) procesal(es) usa(n) este rol.` |
| Tipos de Juzgado | Hay juzgados de ese tipo | `No se puede desactivar: N juzgado(s) tiene(n) este tipo.` |
| Etiquetas de Notas | Hay notas con esa etiqueta | `No se puede desactivar: N nota(s) usa(n) esta etiqueta.` |
| Juzgados | Hay expedientes con ese juzgado | `No se puede desactivar: N expediente(s) referencia(n) este juzgado.` |

**Los otros 10 catálogos** (audiencias, trámites, diligencias, notificaciones, evento)
**sí se pueden desactivar aunque estén en uso**: simplemente dejan de aparecer en los
desplegables; los registros que ya los usan conservan el valor.

> **Advertencia con "Tipos de Proceso" y "Roles Procesales":** en la base de datos estos dos
> se guardan como **texto**, no como ID. Si un día se **cambia el nombre** de un valor ya usado,
> los expedientes antiguos quedan con el texto anterior y dejan de coincidir.

### 2.4 Nombres que NO deben cambiarse

El sistema reconoce **por texto exacto** ciertos estados para pintar colores y badges.
Cambiar estos nombres (o borrarlos) hace que la interfaz muestre el color gris genérico.
Revíselos antes de renombrar o crear valores nuevos:

| Catálogo | Nombres que el sistema reconoce | Situación actual (snapshot) |
|---|---|---|
| Estados de Audiencia | `Programada`, `Realizada`, `Cancelada`, `Suspendida`, `Reprogramada` | **Falta `Reprogramada`** (no existe en la BD). |
| Estados de Diligencia | `Pendiente`, `En Progreso`, `Completada`, `Cancelada` | ✅ Coinciden. |
| Estados de Trámite | `Ingresado`, `En Proceso`, `Resuelto`, `Rechazado` | ✅ Coinciden. |
| Estados de Notificación OJ | `Pendiente`, `En Tramite`, `Atendida`, `Vencida`, `Rechazada` | ⚠️ La BD tiene `Recibida` (no reconocida) y le faltan `En Tramite`, `Vencida` y `Rechazada`. |
| Estados de Expediente | `Cerrado`, `Archivado` (los usa el Histórico) | ✅ Coinciden. |
| Tipos de Diligencia | El código espera los nombres **sin tilde**: `Asesoria`, `Redaccion`, `Revision` | ⚠️ En la BD están con tilde (`Asesoría`, `Redacción`, `Revisión`), por eso esos badges salen en gris. |
| Estados de Evento | Todavía no hay nombres fijos definidos en pantalla | Se usan `Pendiente`, `Completado`, `Cancelado`. |

### 2.5 Colores sugeridos

Paleta usada por LexControl (puede usar los suyos, formato `#RRGGBB`):

| Uso | Color |
|---|---|
| Principal / en trámite | `#358292`, `#3498DB` |
| Completado / favorable | `#2ECC71` |
| Pendiente / advertencia | `#F39C12` |
| Rechazado / crítico | `#E74C3C` |
| Tercero / especial | `#9B59B6`, `#1ABC9C` |
| Neutro / archivado | `#95A5A6`, `#8B9AA0` |

### 2.6 Orden de captura (dependencias)

1. **Tipos de Juzgado** → 2. **Juzgados** (un juzgado necesita el ID de su tipo y el ID de su municipio).
2. Los demás catálogos estándar no dependen entre sí: se pueden llenar en cualquier orden.
3. Catálogos que alimentan formularios obligatorios conviene llenarlos **antes** de empezar
   a operar: `RAMA`, `ESTADO_EXPEDIENTE`, `ROL_PROCESAL`, `TIPO_AUDIENCIA`, `ESTADO_AUDIENCIA`.

---

## 3. Ficha de llenado por catálogo

> En cada ficha: **Valores ya existentes** = lo que hay hoy en la base de datos (no lo repita);
> **Valores a agregar** = tabla en blanco para llenar. Las filas vacías se dejan en blanco.

### 3.1 Ramas del Derecho (`RAMA`)

- **Se usa en**: alta y filtro de expedientes, Histórico Legal, reporte "Expedientes por Rama".
- **Si está vacío**: no se puede crear ningún expediente.
- **Bloqueo de desactivación**: sí (expedientes que referencian la rama).

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Civil | CIV | Derecho Civil | `#358292` | 1 | Sí |
| 2 | Penal | PEN | Derecho Penal | `#B2845A` | 2 | **No** |
| 3 | Familiar | FAM | Derecho Familiar | `#97BEC6` | 3 | Sí |
| 4 | Municipal | MUN | Derecho Municipal | `#6C8B6C` | 4 | Sí |
| 5 | Laboral | LAB | Derecho Laboral | `#8E44AD` | 5 | Sí |
| 6 | Constitucional | CON | Derecho Constitucional | `#2C3E50` | 6 | Sí |
| 7 | Derecho Ambiental | AMB | Materia ambiental, recursos naturales y ecologia. | `#1ABC9C` | 7 | **No** |
| 8 | Juicio Verbal | JuicioV | Para una consulta no especifica | `#923539` | 7 | **No** |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.2 Estados de Expediente (`ESTADO_EXPEDIENTE`)

- **Se usa en**: alta y filtro de expedientes, Histórico Legal.
- **Si está vacío**: no se puede crear ningún expediente.
- **Bloqueo de desactivación**: sí (expedientes con ese estado).

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Activo | ACT | Expediente en trámite activo | `#358292` | 1 | Sí |
| 2 | En Espera | ESP | Expediente pausado | `#F39C12` | 2 | Sí |
| 3 | Cerrado | CER | Expediente finalizado | `#B2845A` | 3 | Sí |
| 4 | Archivado | ARC | Expediente archivado | `#95A5A6` | 4 | Sí |
| 5 | Urgente | URG | Expediente con prioridad urgente | `#E74C3C` | 5 | Sí |

> `Cerrado` y `Archivado` son los que usa la pantalla **Histórico**; no los renombre.

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.3 Tipos de Audiencia (`TIPO_AUDIENCIA`)

- **Se usa en**: alta de audiencia desde Agenda y listado `/audiencias`.
- **Si está vacío**: no se pueden programar audiencias.
- **Bloqueo de desactivación**: no (se oculta simplemente del desplegable).

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Conciliación | CONC | Audiencia de conciliación | `#2ECC71` | 1 | Sí |
| 2 | Juicio Oral | JO | Juicio oral y público | `#E74C3C` | 2 | Sí |
| 3 | Vista Pública | VP | Vista pública | `#3498DB` | 3 | Sí |
| 4 | Declaración | DEC | Declaración de parte | `#9B59B6` | 4 | Sí |
| 5 | Ratificación | RAT | Ratificación de pruebas | `#1ABC9C` | 5 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.4 Estados de Audiencia (`ESTADO_AUDIENCIA`)

- **Se usa en**: Agenda, listado de audiencias y filtros.
- **Si está vacío**: no se pueden mostrar ni filtrar audiencias.
- **Nombres fijos** (§2.4): `Programada`, `Realizada`, `Cancelada`, `Suspendida`, `Reprogramada`.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Programada | PROG | Audiencia programada | `#3498DB` | 1 | Sí |
| 2 | Realizada | REAL | Audiencia realizada | `#2ECC71` | 2 | Sí |
| 3 | Suspendida | SUSP | Audiencia suspendida | `#F39C12` | 3 | Sí |
| 4 | Cancelada | CANC | Audiencia cancelada | `#E74C3C` | 4 | Sí |

> Falta `Reprogramada` (el sistema ya la reconoce con color). Considere agregarla.

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.5 Resultados de Audiencia (`RESULTADO_AUDIENCIA`)

- **Se usa en**: modal **"Registrar resultado"** de una audiencia terminada.
- **Si está vacío**: no se puede cerrar una audiencia con resultado.
- **Bloqueo de desactivación**: no.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Favorable | FAV | Resultado favorable | `#2ECC71` | 1 | Sí |
| 2 | Desfavorable | DES | Resultado desfavorable | `#E74C3C` | 2 | Sí |
| 3 | Parcial | PAR | Resultado parcial | `#F39C12` | 3 | Sí |
| 4 | Sin Resultado | SIN | No se obtuvo resultado | `#95A5A6` | 4 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.6 Tipos de Trámite (`TIPO_TRAMITE`)

- **Se usa en**: alta y filtro de trámites.
- **Si está vacío**: no se pueden crear trámites.
- **Bloqueo de desactivación**: no.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Memorial | MEM | Presentación de memorial | `#3498DB` | 1 | Sí |
| 2 | Recurso | REC | Recurso de apelación | `#E74C3C` | 2 | Sí |
| 3 | Solicitud | SOL | Solicitud administrativa | `#2ECC71` | 3 | Sí |
| 4 | Notificación | NOT | Notificación de resolución | `#9B59B6` | 4 | Sí |
| 5 | Oficio | OFI | Oficio de comunicación | `#1ABC9C` | 5 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.7 Estados de Trámite (`ESTADO_TRAMITE`)

- **Se usa en**: lista y detalle de trámites (badge de estado) y filtros.
- **Si está vacío**: los trámites no muestran estado.
- **Nombres fijos** (§2.4): `Ingresado`, `En Proceso`, `Resuelto`, `Rechazado`.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Ingresado | ING | Trámite ingresado | `#3498DB` | 1 | Sí |
| 2 | En Proceso | EP | Trámite en proceso | `#F39C12` | 2 | Sí |
| 3 | Resuelto | RES | Trámite resuelto | `#2ECC71` | 3 | Sí |
| 4 | Rechazado | REC | Trámite rechazado | `#E74C3C` | 4 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.8 Tipos de Diligencia (`TIPO_DILIGENCIA`)

- **Se usa en**: alta y filtro de diligencias, y en las tarjetas de la agenda semanal.
- **Si está vacío**: no se pueden crear diligencias.
- **Bloqueo de desactivación**: no.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Asesoría | ASE | Asesoría con cliente | `#3498DB` | 1 | Sí |
| 2 | Redacción | RED | Redacción de documentos | `#2ECC71` | 2 | Sí |
| 3 | Revisión | REV | Revisión de expediente | `#F39C12` | 3 | Sí |
| 4 | Llamada | LLA | Llamada de seguimiento | `#9B59B6` | 4 | Sí |
| 5 | Visita | VIS | Visita a institución | `#E74C3C` | 5 | Sí |
| 6 | Correo | COR | Correo electrónico | `#1ABC9C` | 6 | Sí |

> Los tres primeros están guardados **con tilde** y el código de la agenda espera los nombres
> **sin tilde**, por eso esos badges salen en gris. Si desea color, capture `Asesoria`,
> `Redaccion` y `Revision` (sin tilde) y desactive los acentuados.

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.9 Estados de Diligencia (`ESTADO_DILIGENCIA`)

- **Se usa en**: lista, detalle y filtros de diligencias.
- **Si está vacío**: las diligencias no muestran estado.
- **Nombres fijos** (§2.4): `Pendiente`, `En Progreso`, `Completada`, `Cancelada`.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Pendiente | PEN | Diligencia pendiente | `#F39C12` | 1 | Sí |
| 2 | En Progreso | EP | Diligencia en progreso | `#3498DB` | 2 | Sí |
| 3 | Completada | COM | Diligencia completada | `#2ECC71` | 3 | Sí |
| 4 | Cancelada | CAN | Diligencia cancelada | `#E74C3C` | 4 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.10 Resultados de Diligencia (`RESULTADO_DILIGENCIA`)

- **Se usa en**: modal **"Registrar resultado"** de una diligencia.
- **Si está vacío**: no se puede cerrar una diligencia con resultado.
- **Bloqueo de desactivación**: no.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Ejecutada | EJE | Diligencia ejecutada | `#2ECC71` | 1 | Sí |
| 2 | No Ejecutada | NOE | Diligencia no ejecutada | `#E74C3C` | 2 | Sí |
| 3 | Re-programada | REPR | Diligencia reprogramada | `#F39C12` | 3 | Sí |
| 4 | Sin Resultado | SIN | Sin resultado registrado | `#95A5A6` | 4 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.11 Tipos de Notificación OJ (`TIPO_NOTIFICACION_OJ`)

- **Se usa en**: alta y filtro de notificaciones del Organismo Judicial.
- **Si está vacío**: no se pueden registrar notificaciones.
- **Bloqueo de desactivación**: no.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Resolución | RES | Resolución judicial | `#3498DB` | 1 | Sí |
| 2 | Citación | CIT | Citación a audiencia | `#E74C3C` | 2 | Sí |
| 3 | Emplazamiento | EMP | Emplazamiento | `#2ECC71` | 3 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.12 Estados de Notificación OJ (`ESTADO_NOTIFICACION_OJ`)

- **Se usa en**: lista, detalle y filtros de notificaciones.
- **Nombres fijos** (§2.4): `Pendiente`, `En Tramite`, `Atendida`, `Vencida`, `Rechazada`.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Recibida | REC | Notificación recibida | `#3498DB` | 1 | Sí |
| 2 | Atendida | ATE | Notificación atendida | `#2ECC71` | 2 | Sí |
| 3 | Pendiente | PEN | Notificación pendiente | `#F39C12` | 3 | Sí |

> `Recibida` no está contemplada en la pantalla. Le faltan `En Tramite`, `Vencida` y
> `Rechazada`, que el sistema sí reconoce con color. Decide usted cuáles adoptar (§2.4).

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.13 Tipos de Proceso (`TIPO_PROCESO`)

- **Se usa en**: referencia de expedientes. **Hoy no hay desplegable**: el alta de expediente
  captura el tipo de proceso como **texto libre**. El catálogo sirve como catálogo de referencia
  y para el control de desactivación.
- **Bloqueo de desactivación**: sí (por nombre, contra los expedientes existentes).

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Juicio Ordinario | JO | Proceso de conocimiento pleno | `#3498DB` | 1 | Sí |
| 2 | Juicio Ejecutivo | JE | Proceso de ejecución | `#E74C3C` | 2 | Sí |
| 3 | Juicio Verbal | JV | Proceso verbal | `#2ECC71` | 3 | Sí |
| 4 | Proceso Especial | PE | Proceso especial | `#F39C12` | 4 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.14 Etiquetas de Notas (`ETIQUETA_NOTA`)

- **Se usa en**: notas internas del expediente (el modelo lo admite, el formulario actual
  aún no ofrece el desplegable).
- **Bloqueo de desactivación**: sí (notas que usan la etiqueta).

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Urgente | URG | Nota urgente | `#E74C3C` | 1 | Sí |
| 2 | Importante | IMP | Nota importante | `#F39C12` | 2 | Sí |
| 3 | Recordatorio | REC | Recordatorio | `#3498DB` | 3 | Sí |
| 4 | Estrategia | EST | Nota estratégica | `#2ECC71` | 4 | Sí |
| 5 | Cliente | CLI | Nota sobre cliente | `#9B59B6` | 5 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.15 Estados de Evento (`ESTADO_EVENTO`)

- **Se usa en**: eventos de la agenda (catálogo disponible; la pantalla de agenda aún no
  muestra este estado).
- **Bloqueo de desactivación**: no.

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Pendiente | PEN | Evento pendiente | `#F39C12` | 1 | Sí |
| 2 | Completado | COM | Evento completado | `#2ECC71` | 2 | Sí |
| 3 | Cancelado | CAN | Evento cancelado | `#E74C3C` | 3 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.16 Tipos de Juzgado (`TIPO_JUZGADO`)

- **Se usa en**: **obligatorio** para dar de alta un Juzgado (se referencia por ID).
- **Bloqueo de desactivación**: sí (juzgados de ese tipo).
- **Orden**: llene este catálogo **antes** que Juzgados (§2.6).

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Civil | CIV | Juzgado de Primera Instancia Civil | `#358292` | 1 | Sí |
| 2 | Penal | PEN | Juzgado de Primera Instancia Penal | `#B2845A` | 2 | Sí |
| 3 | Paz | PAZ | Juzgado de Paz | `#97BEC6` | 3 | Sí |
| 4 | Familia | FAM | Juzgado de Familia | `#6C8B6C` | 4 | Sí |
| 5 | Trabajo | TRA | Juzgado de Trabajo | `#8E44AD` | 5 | Sí |
| 6 | Mercantil | MER | Juzgado de lo Mercantil | `#2C3E50` | 6 | Sí |

**Valores a agregar (llenar aquí)**

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.17 Roles Procesales (`ROL_PROCESAL`)

- **Se usa en**: partes procesales del expediente (alta y detalle).
- **Si está vacío**: no se pueden registrar las partes de un expediente.
- **Bloqueo de desactivación**: sí (por nombre, contra las partes existentes).
- **Límite especial**: aquí el **Nombre admite máximo 30 caracteres** (no 50).

**Valores ya existentes**

| ID | Nombre | Valor | Descripción | Color | Orden | Activo |
|---|---|---|---|---|---|---|
| 1 | Demandante | DEM | Persona que demanda o inicia el proceso | `#358292` | 1 | Sí |
| 2 | Demandado | DMD | Persona contra quien se demanda | `#B2845A` | 2 | Sí |
| 3 | Tercero Interesado | TER | Persona con interés legítimo en el proceso | `#F39C12` | 3 | Sí |
| 4 | Testigo | TES | Persona que declara en el proceso | `#97BEC6` | 4 | Sí |
| 5 | Perito | PER | Experto que dictamina en el proceso | `#8E44AD` | 5 | Sí |
| 6 | Ministerio Público | MP | Representante del MP en el proceso | `#2C3E50` | 6 | Sí |
| 7 | Querellante | QUE | Víctima que se querella | `#E74C3C` | 7 | Sí |

**Valores a agregar (llenar aquí)** — *Nombre: máximo 30 caracteres*

| Nombre | Valor | Descripción | Color | Orden |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

### 3.18 Juzgados / Tribunales (`JUZGADO`) — formulario especial

Ir a la **sección 4**.

---

## 4. Caso especial: Juzgados

Los juzgados **no** usan Valor/Descripción/Color/Orden. En cambio piden dos campos que el
sistema captura por **ID**:

| Campo | Obligatorio | Longitud / formato | Dónde sale el dato |
|---|---|---|---|
| **Nombre** | **Sí** | Máx. 50 en el formulario (la base de datos admite 100) | Se escribe libre (ej. `Juzgado de Primera Instancia Civil de Sololá`). Debe ser único entre los juzgados **activos**. |
| **Tipo de juzgado** | **Sí** | Número entero ≥ 1 | **ID** del catálogo *Tipos de Juzgado* → **Anexo A**. |
| **Municipio** | **Sí** | Número entero ≥ 1 | **ID** de la tabla de municipios → **Anexo B**. (No tiene pantalla de mantenimiento: se elige de la lista del anexo.) |
| Dirección | No | Máx. 200 caracteres | Se escribe libre. |
| Teléfono | No | Máx. 20 caracteres | Ej. `7762-0000`. |
| Correo | No | Máx. 100 caracteres, debe ser un correo válido | Ej. `contacto@pj.gob.gt`. |

**Bloqueo de desactivación**: sí — no se puede desactivar un juzgado con expedientes.

> El departamento no se captura: el sistema lo deduce solo a partir del municipio.

**Juzgados ya existentes**

| ID | Nombre | Tipo (ID) | Municipio (ID) | Activo |
|---|---|---|---|---|
| 1 | Juzgado de Primera Instancia Civil de Sololá | Civil (1) | Sololá (17) | Sí |
| 2 | Juzgado de Primera Instancia Penal de Sololá | Penal (2) | Sololá (17) | Sí |
| 3 | Juzgado de Familia de Sololá | Familia (4) | Sololá (17) | Sí |
| 4 | Juzgado de Trabajo y Previsión Social de Sololá | Trabajo (5) | Sololá (17) | Sí |
| 5 | Juzgado de Paz de Santiago Atitlán | Paz (3) | Santiago Atitlán (29) | Sí |
| 6 | Juzgado de Paz de Panajachel | Paz (3) | Panajachel (30) | Sí |
| 7 | Juzgado de Primera Instancia de Trabajo y Previsión Social | Trabajo (5) | Guatemala (1) | Sí |
| 8 | Juzgado de Paz Civil de Guatemala | Paz (3) | Guatemala (1) | Sí |
| 9 | Juzgado de Prueba Unitaria | Civil (1) | Sololá (17) | No |

**Juzgados a agregar (llenar aquí)** — *el Tipo y el Municipio se escriben con su número de ID*

| Nombre | Tipo (ID) | Municipio (ID) | Dirección | Teléfono | Correo |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

---

## 5. Checklist de captura

Marque cada casilla cuando el catálogo ya tenga todos los valores en el sistema.
Siga el orden sugerido (§2.6).

- [ ] 1. **Tipos de Juzgado** (§3.16) — primero, porque los juzgados lo necesitan.
- [ ] 2. **Juzgados** (§4) — con el ID de tipo y de municipio de los anexos.
- [ ] 3. **Ramas del Derecho** (§3.1)
- [ ] 4. **Estados de Expediente** (§3.2)
- [ ] 5. **Roles Procesales** (§3.17)
- [ ] 6. **Tipos de Proceso** (§3.13)
- [ ] 7. **Tipos de Audiencia** (§3.3)
- [ ] 8. **Estados de Audiencia** (§3.4)
- [ ] 9. **Resultados de Audiencia** (§3.5)
- [ ] 10. **Tipos de Trámite** (§3.6)
- [ ] 11. **Estados de Trámite** (§3.7)
- [ ] 12. **Tipos de Diligencia** (§3.8)
- [ ] 13. **Estados de Diligencia** (§3.9)
- [ ] 14. **Resultados de Diligencia** (§3.10)
- [ ] 15. **Tipos de Notificación OJ** (§3.11)
- [ ] 16. **Estados de Notificación OJ** (§3.12)
- [ ] 17. **Etiquetas de Notas** (§3.14)
- [ ] 18. **Estados de Evento** (§3.15)

**Verificación final**

- [ ] Ningún Nombre se repite dentro de su catálogo (ni siquiera con mayúsculas distintas).
- [ ] Los estados con nombre fijo (§2.4) quedaron escritos exactamente igual.
- [ ] Cada color tiene 7 caracteres (`#` + 6 dígitos).
- [ ] Los juzgados muestran Tipo y Municipio con nombre (no vacíos).
- [ ] Se probaron 2 formularios reales (un expediente, una audiencia) para confirmar que los desplegables muestran lo nuevo.

---

## 6. Errores que puede encontrar al capturar

| Mensaje | Causa | Solución |
|---|---|---|
| `Ya existe un registro con el nombre "X" en la tabla Y.` | Se intentó crear un valor que ya existe (aunque esté desactivado). | Use otro nombre o reactive el existente desde la lista. |
| `Ya existe otro registro con el nombre "X" en la tabla Y.` | Al editar se cambió el nombre por otro que ya existe. | Elija un nombre distinto. |
| `No se encontró el registro con ID n en la tabla Y.` | El registro fue eliminado en paralelo. | Vuelva a cargar la lista. |
| `No se puede desactivar: N expediente(s) referencia(n) esta rama.` | La rama ya se usa en expedientes. | Quite la rama de esos expedientes primero, o déjela activa. |
| `No se puede desactivar: N expediente(s) tiene(n) este estado.` | El estado ya se usa en expedientes. | Igual que arriba. |
| `No se puede desactivar: N expediente(s) usa(n) este tipo de proceso.` | Hay expedientes con ese texto de tipo de proceso. | Igual que arriba. |
| `No se puede desactivar: N parte(s) procesal(es) usa(n) este rol.` | El rol ya se usa en partes de expedientes. | Igual que arriba. |
| `No se puede desactivar: N juzgado(s) tiene(n) este tipo.` | El tipo se usa en juzgados existentes. | Mueva los juzgados a otro tipo o déjelo activo. |
| `No se puede desactivar: N nota(s) usa(n) esta etiqueta.` | La etiqueta ya se usa en notas. | Igual que arriba. |
| `No se puede desactivar: N expediente(s) referencia(n) este juzgado.` | El juzgado se usa en expedientes. | Reasigne esos expedientes o déjelo activo. |
| `Ya existe un juzgado con ese nombre.` / `Ya existe otro juzgado con ese nombre.` | Nombre de juzgado duplicado. | Use otro nombre. |
| `Juzgado no encontrado.` | El juzgado no existe o fue desactivado. | Recargue la lista. |
| El navegador no deja guardar y el campo está resaltado | Campo obligatorio vacío o valor fuera de rango (tipo/municipio < 1). | Complete el campo marcado. |
| `El nombre es obligatorio.` / `El tipo de juzgado es obligatorio.` / `El municipio es obligatorio.` / `El correo electrónico no es válido.` | Validación del servidor. | Corrija el campo indicado. |
| `Nombre de tabla no permitido: X` | Error técnico (nombre de catálogo inexistente). | Avise al técnico. |
| `403 Forbidden` al guardar | La sesión no es de Administrador. | Inicie sesión con un usuario Administrador. |

---

## Anexo A. IDs de Tipos de Juzgado

Para el campo **Tipo de juzgado** del formulario de juzgados:

| ID | Tipo de juzgado |
|---|---|
| 1 | Civil |
| 2 | Penal |
| 3 | Paz |
| 4 | Familia |
| 5 | Trabajo |
| 6 | Mercantil |

> Si agrega un tipo nuevo (§3.16), este documento no se actualiza solo: vuelva a consultar el
> sistema (Mantenimiento → *Tipos de Juzgado*) para obtener su ID.

---

## Anexo B. Departamentos y Municipios con su ID

Para el campo **Municipio** del formulario de juzgados. Hoy la base de datos tiene **22
departamentos** y **35 municipios**, y **no existe pantalla de mantenimiento** para ellos:
anote aquí el ID que le corresponde a cada municipio que necesite.

**ID de departamentos (referencia)**

| ID | Departamento | ID | Departamento |
|---|---|---|---|
| 1 | Guatemala | 12 | San Marcos |
| 2 | El Progreso | 13 | Huehuetenango |
| 3 | Sacatepéquez | 14 | Quiché |
| 4 | Chimaltenango | 15 | Baja Verapaz |
| 5 | Escuintla | 16 | Alta Verapaz |
| 6 | Santa Rosa | 17 | Petén |
| 7 | Sololá | 18 | Izabal |
| 8 | Totonicapán | 19 | Zacapa |
| 9 | Quetzaltenango | 20 | Chiquimula |
| 10 | Suchitepéquez | 21 | Jalapa |
| 11 | Retalhuleu | 22 | Jutiapa |

**Municipios con su ID**

| ID | Municipio | Departamento | ID | Municipio | Departamento |
|---|---|---|---|---|---|
| 1 | Guatemala | Guatemala | 18 | San José Chacayá | Sololá |
| 2 | San José Pinula | Guatemala | 19 | Santa Catarina Ixtahuacán | Sololá |
| 3 | San José del Golfo | Guatemala | 20 | Nahualá | Sololá |
| 4 | Palencia | Guatemala | 21 | Santa Catarina Palopó | Sololá |
| 5 | Chinautla | Guatemala | 22 | San Antonio Palopó | Sololá |
| 6 | San Pedro Ayampuc | Guatemala | 23 | San Lucas Tolimán | Sololá |
| 7 | Mixco | Guatemala | 24 | Santa Cruz La Laguna | Sololá |
| 8 | San Pedro Sacatepéquez | Guatemala | 25 | San Pablo La Laguna | Sololá |
| 9 | San Juan Sacatepéquez | Guatemala | 26 | San Marcos La Laguna | Sololá |
| 10 | San Raymundo | Guatemala | 27 | San Juan La Laguna | Sololá |
| 11 | Chuarrancho | Guatemala | 28 | San Pedro La Laguna | Sololá |
| 12 | Fraijanes | Guatemala | 29 | Santiago Atitlán | Sololá |
| 13 | Amatitlán | Guatemala | 30 | Panajachel | Sololá |
| 14 | Villa Nueva | Guatemala | 31 | Santa Clara La Laguna | Sololá |
| 15 | Villa Canales | Guatemala | 32 | Concepción | Sololá |
| 16 | San Miguel Petapa | Guatemala | 33 | San Andrés Semetabaj | Sololá |
| 17 | Sololá | Sololá | 34 | San Jorge La Laguna | Sololá |
|  |  |  | 35 | Santa María Visitación | Sololá |

> Los demás 20 departamentos **no tienen municipios cargados**. Si necesita un municipio de
> otro departamento, pídale al técnico cargarlo en la tabla `MUNICIPIO` primero.

---

## Anexo C. Carga masiva (para el técnico)

Si el llenado es grande, en lugar de capturar uno por uno puede cargar todo de una vez.
**Requisito**: sesión de **Administrador** y revisión previa de duplicados (el sistema no
acepta nombres repetidos).

### C.1 Opción 1 — Script SQL

```sql
-- 1) Revisar primero si algún nombre ya existe (si devuelve filas, no inserte esos)
SELECT Nombre FROM RAMA
WHERE LOWER(Nombre) IN ('ambiental', 'comercial', 'constitucional');

-- 2) Insertar los valores nuevos (Activo y FechaCreacion se llenan solos)
INSERT INTO RAMA (Nombre, Valor, Descripcion, Color, Orden) VALUES
('Comercial',    'COM', 'Derecho Comercial',  '#1ABC9C', 8),
('Agrario',      'AGR', 'Derecho Agrario',    '#6C8B6C', 9);

-- 3) Verificar
SELECT ID, Nombre, Valor, Color, Orden, Activo
FROM RAMA ORDER BY Orden, Nombre;
```

Columnas iguales para los 17 catálogos estándar:
`INSERT INTO <TABLA> (Nombre, Valor, Descripcion, Color, Orden) VALUES (...)`.

Para un **juzgado** (con sus IDs del Anexo A/B):

```sql
INSERT INTO JUZGADO (Nombre, Direccion, Telefono, Email, Tipo_Juzgado_ID, Municipio_ID)
VALUES ('Juzgado de Paz de San Lucas Tolimán', NULL, NULL, NULL, 3, 23);
```

> Cuidado con `ROL_PROCESAL`: su columna `Nombre` admite **30 caracteres** (los demás, 50).

### C.2 Opción 2 — API REST

```http
POST https://localhost:7276/api/catalogos/RAMA
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Comercial",
  "valor": "COM",
  "descripcion": "Derecho Comercial",
  "color": "#1ABC9C",
  "orden": 8
}
```

> La URL base es `https://localhost:7276` (o `http://localhost:5181` si el API corre solo en
> local; en desarrollo el frontend usa el proxy de `ng serve` y basta con `/api/...`).

| Paso | Detalle |
|---|---|
| 1. Obtener token | `POST /api/auth/login` con `{"usuario":"admin","contrasena":"admin123"}` → `data.token` |
| 2. Crear | `POST /api/catalogos/{TABLA}` con el JSON de arriba → `201 Created` |
| 3. Editar | `PUT /api/catalogos/{TABLA}/{id}` con el mismo JSON |
| 4. Activar/desactivar | `PUT /api/catalogos/{TABLA}/{id}/estado` con `{"activo":false}` → `204 No Content` |
| 5. Juzgados | Mismos pasos pero la ruta es `/api/catalogos/juzgados` y el JSON es `{"nombre","tipoJuzgadoId","municipioId","direccion","telefono","email"}` |

Errores: `400` con `{"success":false,"error":"<mensaje>"}` (ver mensajes de la sección 6);
`401` sin token; `403` si el rol no es Administrador.

> No existe endpoint masivo: la API crea **un valor por petición**.

---

## 7. Archivos relacionados

| Archivo | Contenido |
|---|---|
| `documentacion/moduloMantenimiento.md` | Documentación técnica del módulo (componentes, SPs, DTOs). |
| `documentacion/implementacion/01-Catalogos-Juzgados.md` | Estado de implementación, SPs completos y pruebas. |
| `documentacion/LevantarServicios.md` | Cómo levantar base de datos, backend y frontend. |
| `ScriptsDB/06-Mantenimiento_Catalogos.sql` | SPs genéricos de catálogos. |
| `ScriptsDB/07-Catalogos_Juzgados.sql` | SPs de juzgados. |
