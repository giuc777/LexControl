/* Modelos del módulo de Diligencias (Tareas del Abogado).
   Contrato definido por DiligenciaDtos.cs y DiligenciasController.cs. */

export interface Diligencia {
    id: number;
    expedienteId: number | null;
    noExpediente: string | null;
    clienteId: number | null;
    cliente: string | null;
    tipo: string;
    titulo: string;
    fecha: string;
    horaInicio: string | null;
    diaCompleto: boolean;
    ubicacion: string | null;
    oficina: string | null;
    estado: string;
    tiempoDedicado: string | null;
    abogado: string | null;
}

export interface DiligenciaDetalle {
    id: number;
    expedienteId: number | null;
    noExpediente: string | null;
    clienteId: number | null;
    cliente: string | null;
    tipoId: number;
    tipo: string;
    tipoColor: string | null;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    horaInicio: string | null;
    diaCompleto: boolean;
    ubicacion: string | null;
    oficina: string | null;
    estadoId: number;
    estado: string;
    estadoColor: string | null;
    notas: string | null;
    tiempoDedicado: string | null;
    recordatorioMinutos: number | null;
    usuarioId: number;
    abogado: string | null;
    fechaCreacion: string;
}

export interface DiligenciaCrear {
    expedienteId: number | null;
    clienteId: number | null;
    tipoId: number;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    horaInicio: string | null;
    diaCompleto: boolean;
    ubicacion: string | null;
    oficina: string | null;
    estadoId: number;
    notas: string | null;
    tiempoDedicado: string | null;
    recordatorioMinutos: number | null;
}

export interface DiligenciaActualizar {
    expedienteId: number | null;
    clienteId: number | null;
    tipoId: number | null;
    titulo: string | null;
    descripcion: string | null;
    fecha: string | null;
    horaInicio: string | null;
    diaCompleto: boolean | null;
    ubicacion: string | null;
    oficina: string | null;
    estadoId: number | null;
    notas: string | null;
    tiempoDedicado: string | null;
    recordatorioMinutos: number | null;
}
