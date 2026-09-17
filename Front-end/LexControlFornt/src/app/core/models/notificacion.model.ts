/* Modelos del modulo Notificaciones OJ.
   Contrato definido por NotificacionDtos.cs / NotificacionesController.cs. */

export interface NotificacionLista {
    id: number;
    expedienteId: number;
    noExpediente: string | null;
    cliente: string | null;
    tipo: string;
    estado: string;
    juzgado: string | null;
    fechaRecepcion: string;
    fechaAtencion: string | null;
    numeroResolucion: string | null;
    esResolucion: boolean;
    favorable: boolean | null;
}

export interface NotificacionDetalle {
    id: number;
    expedienteId: number;
    noExpediente: string | null;
    cliente: string | null;
    juzgadoId: number;
    juzgado: string | null;
    fechaRecepcion: string;
    tipoId: number;
    tipo: string;
    contenido: string | null;
    resumen: string | null;
    estadoId: number;
    estado: string;
    numeroExpedienteOj: string | null;
    pdfRuta: string | null;
    duplicadoDeId: number | null;
    notas: string | null;
    esResolucion: boolean;
    numeroResolucion: string | null;
    favorable: boolean | null;
    fechaAtencion: string | null;
    fechaCreacion: string | null;
}

export interface NotificacionCrear {
    expedienteId: number;
    juzgadoId: number;
    fechaRecepcion: string;
    tipoId: number;
    contenido: string | null;
    resumen: string | null;
    estadoId: number;
    numeroExpedienteOj: string | null;
    pdfRuta: string | null;
    duplicadoDeId: number | null;
    notas: string | null;
    esResolucion: boolean;
    numeroResolucion: string | null;
    favorable: boolean | null;
}

export interface NotificacionActualizar {
    juzgadoId: number | null;
    fechaRecepcion: string | null;
    tipoId: number | null;
    contenido: string | null;
    resumen: string | null;
    estadoId: number | null;
    numeroExpedienteOj: string | null;
    pdfRuta: string | null;
    notas: string | null;
    esResolucion: boolean | null;
    numeroResolucion: string | null;
    favorable: boolean | null;
}

export interface NotificacionAtender {
    notas: string | null;
}

/* Duplicado detectado por SP_NotificacionOJ_VerificarDuplicado. */
export interface NotificacionDuplicado {
    id: number;
    resumen: string | null;
    fechaRecepcion: string;
}

/* Respuesta del endpoint POST /api/notificaciones/{id}/pdf. */
export interface NotificacionPdfResponse {
    pdfRuta: string;
    nombreArchivo: string;
    tipoArchivo: string;
    tamano: number;
}
