/* Modelos del módulo de Eventos / Agenda.
   Contrato definido por EventoDtos.cs y EventosController.cs. */

export interface Evento {
    id: number;
    titulo: string;
    fecha: string;
    horaInicio: string;
    horaFin: string | null;
    tipoEvento: string;
    ubicacion: string | null;
    prioridad: number;
    colorEvento: string | null;
    noExpediente: string | null;
    cliente: string | null;
    tipoAudiencia: string | null;
    tipoPlazo: string | null;
    tipoDiligencia: string | null;
    estado: string;
    asistentes: string | null;
}

export interface EventoCrear {
    titulo: string;
    descripcion: string | null;
    fecha: string;
    horaInicio: string;
    horaFin: string | null;
    diaCompleto: boolean;
    ubicacion: string | null;
    expedienteId: number | null;
    clienteId: number | null;
    prioridad: number;
    colorEvento: string | null;
    estadoId: number;
    tipoEvento: string;
    esInterno: boolean;
}

export interface EventoAudienciaCrear {
    titulo: string;
    descripcion: string | null;
    fecha: string;
    horaInicio: string;
    horaFin: string | null;
    ubicacion: string | null;
    expedienteId: number | null;
    clienteId: number | null;
    prioridad: number;
    colorEvento: string | null;
    estadoId: number;
    esInterno: boolean;
    tipoAudiencia: string;
    juzgadoId: number | null;
    secretarioId: number | null;
    numeroExpedienteJudicial: string | null;
    resolucion: string | null;
}
