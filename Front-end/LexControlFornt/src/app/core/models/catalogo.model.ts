/* Modelos del modulo de Mantenimiento de catálogos.
   Contrato definido por CatalogosController.cs / CatalogoDtos.cs. */

export interface CatalogoItem {
    id: number;
    nombre: string;
    valor: string | null;
    descripcion: string | null;
    color: string | null;
    orden: number;
    activo: boolean;
    fechaCreacion: string | null;
}

export interface JuzgadoItem {
    id: number;
    nombre: string;
    tipoJuzgado: string | null;
    tipoJuzgadoId: number;
    direccion: string | null;
    telefono: string | null;
    email: string | null;
    municipio: string | null;
    municipioId: number;
    departamento: string | null;
    departamentoId: number;
    activo: boolean;
    fechaCreacion: string | null;
}

export interface CatalogoCrearDto {
    nombre: string;
    valor?: string | null;
    descripcion?: string | null;
    color?: string | null;
    orden?: number;
}

export interface JuzgadoCrearDto {
    nombre: string;
    tipoJuzgadoId: number;
    municipioId: number;
    direccion?: string | null;
    telefono?: string | null;
    email?: string | null;
}

export interface CatalogoEstadoDto {
    activo: boolean;
}

/* Definición de un catálogo disponible en el sistema. */
export interface CatalogoDef {
    key: string;
    titulo: string;
    tabla: string;
    texto: string;
    color: string;
    tipo: 'estandar' | 'juzgado';
}
