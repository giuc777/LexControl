import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ReportesUsuariosPage } from './reportes-usuarios-page';

interface ReporteItem {
    key: string;
    titulo: string;
    descripcion: string;
    icono: string;
    color: string;
    disponibles: number;
    component?: unknown;
}

@Component({
    selector: 'app-reportes-page',
    imports: [ReportesUsuariosPage],
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
            key: 'expedientes',
            titulo: 'Expedientes por Rama',
            descripcion: 'Distribución de expedientes por rama de derecho y estado actual.',
            icono: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
            color: '#B2845A',
            disponibles: 0
        },
        {
            key: 'agenda',
            titulo: 'Agenda y Audiencias',
            descripcion: 'Calendario de audiencias programadas, realizadas y pendientes.',
            icono: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
            color: '#8e44ad',
            disponibles: 0
        },
        {
            key: 'tramites',
            titulo: 'Trámites en Curso',
            descripcion: 'Estado de trámites activos, tiempos de respuesta y resolución.',
            icono: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2',
            color: '#97BEC6',
            disponibles: 0
        },
        {
            key: 'notificaciones',
            titulo: 'Notificaciones OJ',
            descripcion: 'Resumen de notificaciones Oficina Judicial: pendientes, atendidas y duplicadas.',
            icono: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
            color: '#6C8B6C',
            disponibles: 0
        },
        {
            key: 'rendimiento',
            titulo: 'Rendimiento del Bufete',
            descripcion: 'Métricas de productividad: casos resueltos, tiempos promedio y carga de trabajo.',
            icono: 'M22 12h-4l-3 9L9 3l-3 9H2',
            color: '#2C3E50',
            disponibles: 0
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
