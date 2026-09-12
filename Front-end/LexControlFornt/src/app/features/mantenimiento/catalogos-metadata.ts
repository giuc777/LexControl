import { CatalogoDef } from '../../core/models/catalogo.model';

/* Catálogos disponibles en el sistema, alineados con las tablas del backend
   (CatalogosController.cs) y los seeds de Base_Datos.sql.
   Compartido entre mantenimiento-page y mantenimiento-detalle-page. */
export const CATALOGOS: CatalogoDef[] = [
    { key: 'rama', titulo: 'Ramas del Derecho', tabla: 'RAMA', texto: 'Clasificación por materia del proceso.', color: '#358292', tipo: 'estandar' },
    { key: 'estado-expediente', titulo: 'Estados de Expediente', tabla: 'ESTADO_EXPEDIENTE', texto: 'Estado procesal actual de cada expediente.', color: '#358292', tipo: 'estandar' },
    { key: 'tipo-audiencia', titulo: 'Tipos de Audiencia', tabla: 'TIPO_AUDIENCIA', texto: 'Clases de audiencia que pueden celebrarse.', color: '#2ECC71', tipo: 'estandar' },
    { key: 'estado-audiencia', titulo: 'Estados de Audiencia', tabla: 'ESTADO_AUDIENCIA', texto: 'Situación de una audiencia agendada.', color: '#3498DB', tipo: 'estandar' },
    { key: 'resultado-audiencia', titulo: 'Resultados de Audiencia', tabla: 'RESULTADO_AUDIENCIA', texto: 'Desenlace registrado de una audiencia.', color: '#2ECC71', tipo: 'estandar' },
    { key: 'tipo-tramite', titulo: 'Tipos de Trámite', tabla: 'TIPO_TRAMITE', texto: 'Clases de trámite gestionadas ante las autoridades.', color: '#3498DB', tipo: 'estandar' },
    { key: 'estado-tramite', titulo: 'Estados de Trámite', tabla: 'ESTADO_TRAMITE', texto: 'Situación de cada trámite.', color: '#3498DB', tipo: 'estandar' },
    { key: 'tipo-diligencia', titulo: 'Tipos de Diligencia', tabla: 'TIPO_DILIGENCIA', texto: 'Clases de gestión o diligencia del despacho.', color: '#3498DB', tipo: 'estandar' },
    { key: 'estado-diligencia', titulo: 'Estados de Diligencia', tabla: 'ESTADO_DILIGENCIA', texto: 'Situación de una diligencia.', color: '#F39C12', tipo: 'estandar' },
    { key: 'tipo-notificacion-oj', titulo: 'Tipos de Notificación OJ', tabla: 'TIPO_NOTIFICACION_OJ', texto: 'Clases de notificación del Organismo Judicial.', color: '#3498DB', tipo: 'estandar' },
    { key: 'estado-notificacion-oj', titulo: 'Estados de Notificación OJ', tabla: 'ESTADO_NOTIFICACION_OJ', texto: 'Situación de cada notificación recibida.', color: '#3498DB', tipo: 'estandar' },
    { key: 'tipo-proceso', titulo: 'Tipos de Proceso', tabla: 'TIPO_PROCESO', texto: 'Clases de proceso judicial.', color: '#3498DB', tipo: 'estandar' },
    { key: 'etiqueta-nota', titulo: 'Etiquetas de Notas', tabla: 'ETIQUETA_NOTA', texto: 'Clasificación de las notas internas.', color: '#E74C3C', tipo: 'estandar' },
    { key: 'estado-evento', titulo: 'Estados de Evento', tabla: 'ESTADO_EVENTO', texto: 'Situación de los eventos de la agenda.', color: '#F39C12', tipo: 'estandar' },
    { key: 'tipo-juzgado', titulo: 'Tipos de Juzgado', tabla: 'TIPO_JUZGADO', texto: 'Clases de juzgados y tribunales.', color: '#358292', tipo: 'estandar' },
    { key: 'rol-procesal', titulo: 'Roles Procesales', tabla: 'ROL_PROCESAL', texto: 'Papel de cada parte dentro del proceso.', color: '#358292', tipo: 'estandar' },
    { key: 'juzgado', titulo: 'Juzgados / Tribunales', tabla: 'JUZGADO', texto: 'Órganos jurisdiccionales donde se tramitan los casos.', color: '#358292', tipo: 'juzgado' }
];

export const CATALOGOS_MAP: Record<string, CatalogoDef> =
    Object.fromEntries(CATALOGOS.map(c => [c.key, c]));
