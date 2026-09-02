/* Modelos del modulo de Expedientes. Contrato definido por los DTOs del backend
   (ExpedientesController.cs / ExpedienteDtos.cs) y validado contra el prototipo
   (Pototipo/js/expedientes-comun.js). */

export interface ExpedienteLista {
    id: number;
    noExpediente: string;
    cliente: string;
    clienteId: number;
    rolProcesalId: number;
    rolProcesal: string;
    ramaId: number;
    rama: string;
    ramaColor: string | null;
    tipoProceso: string | null;
    juzgadoId: number;
    juzgado: string;
    fechaIngreso: string | null;
    estadoId: number;
    estado: string;
    estadoColor: string | null;
    descripcion: string | null;
    notasInternas: string | null;
    abogadoId: number;
    abogado: string;
    fechaCreacion: string | null;
    fechaModificacion: string | null;
}

export interface ExpedienteDetalle {
    id: number;
    noExpediente: string;
    clienteId: number;
    clienteNombre: string;
    rolProcesalId: number;
    rolProcesal: string;
    ramaId: number;
    ramaNombre: string;
    ramaColor: string | null;
    tipoProceso: string | null;
    juzgadoId: number;
    juzgadoNombre: string;
    fechaIngreso: string | null;
    estadoId: number;
    estadoNombre: string;
    estadoColor: string | null;
    descripcion: string | null;
    notasInternas: string | null;
    fechaCierre: string | null;
    abogadoId: number;
    abogadoNombre: string;
    fechaCreacion: string | null;
    fechaModificacion: string | null;
}

export interface ParteProcesal {
    id: number;
    expedienteId: number;
    tipo: string;
    nombreCompleto: string;
    dpi: string | null;
    telefono: string | null;
    abogadoDefensor: string | null;
    rol: string | null;
    descripcion: string | null;
    fechaCreacion: string | null;
}

export interface NotaExpediente {
    id: number;
    expedienteId: number;
    contenido: string;
    etiquetaId: number | null;
    etiquetaNombre: string | null;
    etiquetaColor: string | null;
    fijado: boolean;
    prioritario: boolean;
    usuarioId: number;
    usuarioNombre: string | null;
    fechaCreacion: string | null;
    fechaModificacion: string | null;
}

export interface DocExpediente {
    id: number;
    expedienteId: number;
    nombreArchivo: string;
    rutaArchivo: string;
    tipoArchivo: string;
    tamano: number | null;
    descripcion: string | null;
    usuarioId: number;
    usuarioNombre: string | null;
    fechaSubida: string | null;
}

export interface DocumentoUploadResponse {
    id: number;
    nombreArchivo: string;
    rutaArchivo: string;
    tipoArchivo: string;
    tamano: number;
    descripcion: string | null;
    fechaSubida: string | null;
}

// ── DTOs de entrada ──────────────────────────────────────────

export interface ExpedienteCrearDto {
    clienteId: number;
    rolProcesalId: number;
    noExpediente: string;
    ramaId: number;
    tipoProceso: string | null;
    juzgadoId: number;
    fechaIngreso: string | null;
    estadoId: number;
    descripcion: string | null;
    notasInternas: string | null;
    abogadoId: number;
}

export interface ExpedienteActualizarDto {
    clienteId: number | null;
    rolProcesalId: number | null;
    ramaId: number | null;
    tipoProceso: string | null;
    juzgadoId: number | null;
    estadoId: number | null;
    descripcion: string | null;
    notasInternas: string | null;
    fechaCierre: string | null;
}

export interface ExpedienteEstadoDto {
    nuevoEstadoId: number;
    fechaCierre: string | null;
}

export interface ParteProcesalCrearDto {
    tipo: string;
    nombreCompleto: string;
    dpi: string | null;
    telefono: string | null;
    abogadoDefensor: string | null;
    rol: string | null;
    descripcion: string | null;
}

export interface NotaExpedienteCrearDto {
    contenido: string;
    etiquetaId: number | null;
    fijado: boolean;
    prioritario: boolean;
}

export interface NotaExpedienteActualizarDto {
    contenido: string | null;
    etiquetaId: number | null;
    fijado: boolean | null;
    prioritario: boolean | null;
}

export interface ExpedienteFiltros {
    ramaId: number | null;
    estadoId: number | null;
    clienteId: number | null;
    abogadoId: number | null;
    noExpediente: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    pagina: number;
    tamanioPagina: number;
}
