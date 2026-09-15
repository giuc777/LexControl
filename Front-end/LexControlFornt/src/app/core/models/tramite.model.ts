/* Modelos del módulo de Trámites.
   Contrato definido por TramiteDtos.cs y TramitesController.cs. */

export interface Tramite {
    id: number;
    expedienteId: number;
    noExpediente: string;
    cliente: string | null;
    tipo: string;
    institucion: string;
    fechaIngreso: string;
    fechaResolucion: string | null;
    estado: string;
    oficioReferencia: string | null;
}

export interface TramiteDetalle {
    id: number;
    expedienteId: number;
    noExpediente: string;
    cliente: string | null;
    tipoId: number;
    tipo: string;
    institucion: string;
    fechaIngreso: string;
    estadoId: number;
    estado: string;
    descripcion: string | null;
    oficioReferencia: string | null;
    notasInternas: string | null;
    documentosAdjuntos: string | null;
    fechaResolucion: string | null;
    resumenResolucion: string | null;
    fechaCreacion: string;
    fechaUltimaActualizacion: string | null;
}

export interface TramiteCrear {
    expedienteId: number;
    tipoId: number;
    institucion: string;
    fechaIngreso: string | null;
    estadoId: number;
    descripcion: string | null;
    oficioReferencia: string | null;
    notasInternas: string | null;
    documentosAdjuntos: string | null;
}

export interface TramiteActualizarEstado {
    estadoId: number;
    fechaResolucion: string | null;
    resumenResolucion: string | null;
}
