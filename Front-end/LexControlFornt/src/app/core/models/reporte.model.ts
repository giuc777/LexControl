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

// 12. Clientes por Tipo
export interface ClientesPorTipoResumen {
    tipo: string;
    total: number;
    activos: number;
    inactivos: number;
    porcentaje: number;
}

export interface ClientesPorTipoDetalle {
    cliente: string | null;
    tipo: string | null;
    activo: boolean;
    fechaCreacion: string | null;
    expedientes: number;
}

// 13. Carga por Abogado
export interface CargaPorAbogadoResumen {
    abogado: string;
    rol: string | null;
    total: number;
    activos: number;
    enEspera: number;
    urgentes: number;
    cerrados: number;
}

export interface CargaPorAbogadoDetalle {
    noExpediente: string | null;
    cliente: string | null;
    rama: string | null;
    estado: string | null;
    estadoColor: string | null;
    fechaIngreso: string | null;
    abogado: string | null;
    rol: string | null;
}
