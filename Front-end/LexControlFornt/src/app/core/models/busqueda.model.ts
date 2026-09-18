/* Modelo de resultados de búsqueda global (topbar). */

export interface BusquedaItem {
    id: number;
    titulo: string;
    subtitulo: string | null;
    ruta: string;
}

export interface BusquedaResultado {
    expedientes: BusquedaItem[];
    clientes: BusquedaItem[];
    audiencias: BusquedaItem[];
    tramites: BusquedaItem[];
    notificaciones: BusquedaItem[];
    diligencias: BusquedaItem[];
}
