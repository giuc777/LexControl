/* Íconos inline del módulo Ajustes — paths copiados de Pototipo/js/ajustes.js. */

export const ICONO_USUARIO =
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75';
export const ICONO_CAMPANA =
    'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0';
export const ICONO_EDIFICIO =
    'M3 21h18M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14M9 21v-4h6v4M9 10h.01M15 10h.01M9 14h.01M15 14h.01';
export const ICONO_USUARIOS =
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75';
export const ICONO_PLUS = 'M12 5v14M5 12h14';
export const ICONO_ESCUDO = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
export const ICONO_INFO = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01';
export const ICONO_OJO =
    'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z';
export const ICONO_OJO_OFF =
    'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22';
export const ICONO_LLAVES =
    'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4';

/* Colores de pill por rol (Pototipo/js/ajustes-comun.js ROLES). */
const COLORES_ROL: Record<string, string> = {
    Administrador: '#358292',
    Secretaria: '#8e44ad',
    Abogado: '#b2845a'
};

export function colorRol(nombre: string): { bg: string; fg: string } {
    const color = COLORES_ROL[nombre] ?? '#358292';
    return { bg: color + '1c', fg: color };
}
