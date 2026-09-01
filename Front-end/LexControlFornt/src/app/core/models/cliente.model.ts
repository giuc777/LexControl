/* Modelos del módulo de Clientes. Contrato definido por los DTOs del backend
   (ClientesController.cs / ClienteDtos.cs) y validado contra el prototipo
   (Pototipo/js/clientes-comun.js). */

export interface ClienteLista {
    id: number;
    nombreCompleto: string;
    dpi: string | null;
    telefonoPrincipal: string | null;
    emailPrincipal: string | null;
    direccion: string | null;
    fechaNacimiento: string | null;
    genero: string | null;
    telefonoSecundario: string | null;
    emailSecundario: string | null;
    tipoCliente: string;
    notas: string | null;
    activo: boolean;
    fechaCreacion: string;
    totalExpedientes: number;
    expedientesActivos: number;
    ultimaActividad: string | null;
}

export interface ClienteDetalle {
    id: number;
    nombreCompleto: string;
    dpi: string | null;
    telefonoPrincipal: string | null;
    emailPrincipal: string | null;
    direccion: string | null;
    fechaNacimiento: string | null;
    genero: string | null;
    telefonoSecundario: string | null;
    emailSecundario: string | null;
    tipoCliente: string;
    notas: string | null;
    activo: boolean;
    fechaCreacion: string;
}

export interface ClienteEstadisticas {
    totalClientes: number;
    totalInactivos: number;
    totalExpedientesActivos: number;
    totalExpedientes: number;
}

export interface ClienteExpediente {
    id: number;
    numero: string;
    fechaIngreso: string | null;
    descripcion: string | null;
    rama: string;
    estado: string;
    estadoColor: string | null;
    juzgado: string | null;
    ultimaActuacion: string | null;
    fechaUltimaActuacion: string | null;
}

export interface ClienteGuardarDto {
    nombreCompleto: string;
    dpi: string | null;
    telefonoPrincipal: string | null;
    emailPrincipal: string | null;
    direccion: string | null;
    telefonoSecundario: string | null;
    emailSecundario: string | null;
    tipoCliente: string | null;
    notas: string | null;
}

export interface ClienteActualizarDto extends ClienteGuardarDto {
    fechaNacimiento: string | null;
    genero: string | null;
}

export interface ClienteFiltros {
    filtroNombre: string | null;
    filtroEstado: boolean | null;
    filtroTipo: string | null;
    pagina: number;
    tamanioPagina: number;
}
