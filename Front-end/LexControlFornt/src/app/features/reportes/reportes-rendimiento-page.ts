import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReportesService } from '../../core/services/reportes-service';
import { CargaPorAbogadoDetalle, CargaPorAbogadoResumen } from '../../core/models/reporte.model';
import { formatearFecha, iniciales } from './reportes-utils';

const COLORES_ROL: Record<string, string> = {
    Administrador: '#358292',
    Secretaria: '#8e44ad',
    Abogado: '#b2845a'
};

@Component({
    selector: 'app-reportes-rendimiento-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-rendimiento-page.html'
})
export class ReportesRendimientoPage {
    private readonly svc = inject(ReportesService);

    readonly cargando = signal(true);

    private readonly reporte = toSignal(
        this.svc.cargaPorAbogado().pipe(catchError(() =>
            of({ resumen: [] as CargaPorAbogadoResumen[], detalle: [] as CargaPorAbogadoDetalle[] }))),
        { initialValue: { resumen: [] as CargaPorAbogadoResumen[], detalle: [] as CargaPorAbogadoDetalle[] } }
    );

    readonly resumen = computed(() => this.reporte().resumen);
    readonly detalle = computed(() => this.reporte().detalle);

    readonly totalExpedientes = computed(() => this.resumen().reduce((a, r) => a + r.total, 0));
    readonly activos = computed(() => this.resumen().reduce((a, r) => a + r.activos, 0));
    readonly cerrados = computed(() => this.resumen().reduce((a, r) => a + r.cerrados, 0));
    readonly maxTotal = computed(() => Math.max(1, ...this.resumen().map(r => r.total)));

    colorRol(rol: string | null): string {
        return COLORES_ROL[rol ?? ''] ?? '#8b9aa0';
    }

    inicialesDe(nombre: string | null): string {
        return iniciales(nombre);
    }

    readonly detalleTabla = computed(() =>
        this.detalle().map(d => ({
            ...d,
            fechaIngresoFormato: formatearFecha(d.fechaIngreso),
            colorEstado: d.estadoColor ?? '#358292'
        })));

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Rendimiento del Bufete — LexControl', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(139, 154, 160);
        const f = new Date();
        doc.text(`Generado: ${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()} ${f.getHours()}:${String(f.getMinutes()).padStart(2, '0')}`, 14, 25);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(26, 28, 30);
        doc.text('Carga por Responsable', 14, 35);

        autoTable(doc, {
            startY: 40,
            head: [['Responsable', 'Rol', 'Total', 'Activos', 'En Espera', 'Urgentes', 'Cerrados']],
            body: this.resumen().map(r => [
                r.abogado, r.rol ?? '—', String(r.total), String(r.activos),
                String(r.enEspera), String(r.urgentes), String(r.cerrados)
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
        autoTable(doc, {
            startY: finalY + 10,
            head: [['No. Expediente', 'Cliente', 'Rama', 'Estado', 'Responsable', 'Rol', 'Ingreso']],
            body: this.detalleTabla().map(d => [
                d.noExpediente ?? '—', d.cliente ?? '—', d.rama ?? '—', d.estado ?? '—',
                d.abogado ?? '—', d.rol ?? '—', d.fechaIngresoFormato
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [53, 130, 146], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-rendimiento-bufete-lexcontrol.pdf');
    }
}