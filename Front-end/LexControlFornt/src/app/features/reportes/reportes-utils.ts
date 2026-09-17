/* Utilidades compartidas por las páginas de reportes. */

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/* Formatea una fecha ISO (yyyy-MM-dd o datetime) a "DD Mes YYYY". */
export function formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const solo = fecha.split('T')[0];
    const partes = solo.split('-');
    if (partes.length !== 3) return fecha;
    const dia = parseInt(partes[2], 10);
    const mes = parseInt(partes[1], 10) - 1;
    return `${dia} ${MESES[mes] ?? ''} ${partes[0]}`.trim();
}

/* Formatea fecha y hora local "DD/MM/YYYY HH:mm". */
export function formatearFechaHora(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin registro';
    const d = new Date(fecha);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${hh}:${mm}`;
}

/* Obtiene las iniciales de un nombre. */
export function iniciales(nombre: string | null | undefined): string {
    if (!nombre) return '—';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

/* Devuelve la fecha de hoy en ISO yyyy-MM-dd. */
export function hoyISO(): string {
    return new Date().toISOString().split('T')[0];
}