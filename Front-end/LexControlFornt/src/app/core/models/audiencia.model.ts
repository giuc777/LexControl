/* Modelos del módulo de Audiencias / Agenda.
   Contrato definido por AudienciaDtos.cs y AudienciasController.cs. */

export interface Audiencia {
    id: number;
    expedienteId: number;
    noExpediente: string;
    cliente: string | null;
    fecha: string;
    horaInicio: string;
    horaFin: string | null;
    tipo: string;
    juzgado: string;
    sala: string | null;
    estado: string;
    resultado: string | null;
}

export interface AudienciaDetalle {
    id: number;
    expedienteId: number;
    noExpediente: string;
    cliente: string | null;
    fecha: string;
    horaInicio: string;
    horaFin: string | null;
    tipoId: number;
    tipo: string;
    juzgadoId: number;
    juzgado: string;
    sala: string | null;
    estadoId: number;
    estado: string;
    resultadoId: number | null;
    resultado: string | null;
    descripcionResultado: string | null;
    proximaActuacion: string | null;
    notas: string | null;
    documentos: string | null;
    usuarioCreacion: string | null;
    fechaCreacion: string | null;
}

export interface AudienciaCrear {
    expedienteId: number;
    tipoId: number;
    fecha: string;
    horaInicio: string;
    horaFin: string | null;
    juzgadoId: number;
    sala: string | null;
    estadoId: number;
    descripcionResultado: string | null;
    proximaActuacion: string | null;
    notas: string | null;
    documentos: string | null;
}

export interface AudienciaResultado {
    resultadoId: number;
    descripcionResultado: string;
    proximaActuacion: string | null;
}
