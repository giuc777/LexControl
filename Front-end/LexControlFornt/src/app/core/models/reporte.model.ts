/* Modelos del modulo Reportes.
   Contrato definido por ReporteDtos.cs / ReportesController.cs. */

export interface ReporteRespuesta<TResumen, TDetalle> {
    resumen: TResumen[];
    detalle: TDetalle[];
}

// 1. Expedientes por Estado
export interface ExpedientesPorEstadoResumen {
    estado: string;
    color: string | null;
    cantidad: number;
    porcentaje: number;
}

export interface ExpedientesPorEstadoDetalle {
    noExpediente: string | null;
    cliente: string | null;
    rolProcesal: string | null;
    rama: string | null;
    estado: string | null;
    estadoColor: string | null;
    fechaIngreso: string | null;
    fechaCierre: string | null;
    abogado: string | null;
}

// 2. Plazos de Vencimiento
export interface PlazoVencimiento {
    id: number;
    titulo: string | null;
    fechaVencimiento: string | null;
    diasRestantes: number | null;
    tipoPlazo: string | null;
    noExpediente: string | null;
    cliente: string | null;
    prioridad: string | null;
    colorEvento: string | null;
    nivelUrgencia: string | null;
}

// 3. Expedientes por Rama
export interface ExpedientesPorRamaResumen {
    rama: string;
    color: string | null;
    cantidad: number;
    porcentaje: number;
}

export interface ExpedientesPorRamaDetalle {
    noExpediente: string | null;
    cliente: string | null;
    rama: string | null;
    ramaColor: string | null;
    estado: string | null;
    estadoColor: string | null;
    juzgado: string | null;
    fechaIngreso: string | null;
    abogado: string | null;
}

// 4. Expedientes por Juzgado
export interface ExpedientesPorJuzgadoResumen {
    juzgado: string;
    tipoJuzgado: string | null;
    cantidad: number;
    porcentaje: number;
}

export interface ExpedientesPorJuzgadoDetalle {
    noExpediente: string | null;
    cliente: string | null;
    juzgado: string | null;
    tipoJuzgado: string | null;
    estado: string | null;
    rama: string | null;
    fechaIngreso: string | null;
    abogado: string | null;
}

// 5. Antiguedad de Expedientes
export interface AntiguedadExpedientesResumen {
    rangoAntiguedad: string;
    cantidad: number;
    porcentaje: number;
}

export interface AntiguedadExpedientesDetalle {
    noExpediente: string | null;
    cliente: string | null;
    rama: string | null;
    juzgado: string | null;
    estado: string | null;
    fechaIngreso: string | null;
    diasTranscurridos: number | null;
    rangoAntiguedad: string | null;
    abogado: string | null;
}

// 6. Actividad de Audiencias
export interface ActividadAudienciasResumenEstado {
    estado: string;
    color: string | null;
    cantidad: number;
    porcentaje: number;
}

export interface ActividadAudienciasResumenResultado {
    resultado: string;
    color: string | null;
    cantidad: number;
}

export interface ActividadAudienciasDetalle {
    noExpediente: string | null;
    cliente: string | null;
    tipo: string | null;
    estado: string | null;
    resultado: string | null;
    fecha: string | null;
    horaInicio: string | null;
    juzgado: string | null;
    sala: string | null;
    proximaActuacion: string | null;
}

export interface ActividadAudienciasRespuesta {
    resumenEstados: ActividadAudienciasResumenEstado[];
    resumenResultados: ActividadAudienciasResumenResultado[];
    detalle: ActividadAudienciasDetalle[];
}

// 7. Gestión de Trámites
export interface GestionTramitesResumen {
    tipo: string;
    color: string | null;
    ingresados: number;
    resueltos: number;
    pendientes: number;
    promedioDiasResolucion: number | null;
}

export interface GestionTramitesDetalle {
    noExpediente: string | null;
    cliente: string | null;
    tipo: string | null;
    institucion: string | null;
    estado: string | null;
    fechaIngreso: string | null;
    fechaResolucion: string | null;
    diasGestion: number | null;
    oficioReferencia: string | null;
    resumenResolucion: string | null;
}

// 8. Notificaciones OJ
export interface NotificacionesOJResumen {
    tipo: string;
    color: string | null;
    recibidas: number;
    atendidas: number;
    pendientes: number;
    promedioDiasAtencion: number | null;
}

export interface NotificacionesOJDetalle {
    noExpediente: string | null;
    cliente: string | null;
    tipo: string | null;
    estado: string | null;
    juzgado: string | null;
    fechaRecepcion: string | null;
    fechaAtencion: string | null;
    diasTranscurridos: number | null;
    numeroResolucion: string | null;
    esResolucion: boolean | null;
    favorable: boolean | null;
}

// 9. Diligencias
export interface DiligenciasResumen {
    tipo: string;
    color: string | null;
    cantidad: number;
    completadas: number;
    pendientes: number;
}

export interface DiligenciasDetalle {
    titulo: string | null;
    noExpediente: string | null;
    vinculado: string | null;
    tipo: string | null;
    estado: string | null;
    fecha: string | null;
    horaInicio: string | null;
    ubicacion: string | null;
    tiempoDedicado: string | null;
    encargado: string | null;
}

// 10. Alertas Pendientes
export interface AlertasPendientesResumen {
    tipoAlerta: string;
    cantidad: number;
    noLeidas: number;
}

export interface AlertasPendientesDetalle {
    titulo: string | null;
    tipoAlerta: string | null;
    descripcion: string | null;
    fechaAlerta: string | null;
    diasTranscurridos: number | null;
    referenciaTabla: string | null;
    referenciaId: number | null;
    leida: boolean | null;
    noExpediente: string | null;
}

// 11. Eventos Agenda Mes
export interface EventosAgendaMesResumen {
    tipoEvento: string;
    cantidad: number;
    pendientes: number;
}

export interface EventosAgendaMesDetalle {
    titulo: string | null;
    tipoEvento: string | null;
    estado: string | null;
    fecha: string | null;
    horaInicio: string | null;
    horaFin: string | null;
    ubicacion: string | null;
    prioridad: string | null;
    noExpediente: string | null;
    cliente: string | null;
    subtipo: string | null;
    fechaVencimiento: string | null;
    diasRestantes: number | null;
}
