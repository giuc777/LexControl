import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ReportesUsuariosPage } from './reportes-usuarios-page';
import { ReportesClientesPage } from './reportes-clientes-page';
import { ReportesExpedientesPage } from './reportes-expedientes-page';
import { ReportesAgendaPage } from './reportes-agenda-page';
import { ReportesTramitesPage } from './reportes-tramites-page';
import { ReportesNotificacionesPage } from './reportes-notificaciones-page';
import { ReportesDiligenciasPage } from './reportes-diligencias-page';
import { ReportesRendimientoPage } from './reportes-rendimiento-page';

interface ReporteItem {
    key: string;
    titulo: string;
    descripcion: string;
    icono: string;
    color: string;
    disponibles: number;
}

@Component({
    selector: 'app-reportes-page',
    imports: [
        ReportesUsuariosPage,
        ReportesClientesPage,
        ReportesExpedientesPage,
        ReportesAgendaPage,
        ReportesTramitesPage,
        ReportesNotificacionesPage,
        ReportesDiligenciasPage,
        ReportesRendimientoPage
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-page.html'
})
export class ReportesPage {
    readonly reporteActivo = signal<string | null>(null);

    readonly reportes: ReporteItem[] = [
        {
            key: 'usuarios',
            titulo: 'Reporte de Usuarios',
            descripcion: 'Resumen de actividad, roles y estado de todos los usuarios del sistema.',
            icono: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
            color: '#358292',
            disponibles: 4
        },
        {
            key: 'clientes',
            titulo: 'Clientes por Tipo',
            descripcion: 'Distribución de la cartera por tipo (Particular/Empresa) y estado.',
            icono: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
            color: '#B2845A',
            disponibles: 2
        },
        {
            key: 'expedientes',
            titulo: 'Expedientes',
            descripcion: 'Distribución por rama, estado, juzgado y control de antigüedad.',
            icono: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
            color: '#097a8a',
            disponibles: 4
        },
        {
            key: 'agenda',
            titulo: 'Agenda y Audiencias',
            descripcion: 'Audiencias programadas y realizadas, eventos del mes y plazos por vencer.',
            icono: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
            color: '#8e44ad',
            disponibles: 3
        },
        {
            key: 'tramites',
            titulo: 'Trámites en Curso',
            descripcion: 'Estado de trámites activos, tiempos de respuesta y resolución.',
            icono: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2',
            color: '#97BEC6',
            disponibles: 1
        },
        {
            key: 'notificaciones',
            titulo: 'Notificaciones OJ',
            descripcion: 'Resumen de notificaciones de la Oficina Judicial: pendientes, atendidas y resoluciones.',
            icono: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
            color: '#6C8B6C',
            disponibles: 1
        },
        {
            key: 'diligencias',
            titulo: 'Diligencias y Alertas',
            descripcion: 'Actividad de diligencias y seguimiento de alertas pendientes.',
            icono: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
            color: '#E67E22',
            disponibles: 2
        },
        {
            key: 'rendimiento',
            titulo: 'Rendimiento del Bufete',
            descripcion: 'Carga de trabajo por responsable: casos activos, en espera y cerrados.',
            icono: 'M22 12h-4l-3 9L9 3l-3 9H2',
            color: '#2C3E50',
            disponibles: 1
        }
    ];

    seleccionarReporte(key: string): void {
        if (this.reporteActivo() === key) {
            this.reporteActivo.set(null);
        } else {
            this.reporteActivo.set(key);
        }
    }

    volver(): void {
        this.reporteActivo.set(null);
    }
}