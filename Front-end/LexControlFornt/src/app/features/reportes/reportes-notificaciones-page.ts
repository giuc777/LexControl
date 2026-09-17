import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReportesService } from '../../core/services/reportes-service';
import { NotificacionesOJDetalle, NotificacionesOJResumen } from '../../core/models/reporte.model';
import { formatearFecha } from './reportes-utils';

@Component({
    selector: 'app-reportes-notificaciones-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-notificaciones-page.html'
})
export class ReportesNotificacionesPage {
    private readonly svc = inject(ReportesService);

    readonly cargando = signal(true);

    private readonly reporte = toSignal(
        this.svc.notificacionesOJ().pipe(catchError(() =>
            of({ resumen: [] as NotificacionesOJResumen[], detalle: [] as NotificacionesOJDetalle[] }))),
        { initialValue: { resumen: [] as NotificacionesOJResumen[], detalle: [] as NotificacionesOJDetalle[] } }
    );

    readonly resumen = computed(() => this.reporte().resumen);
    readonly detalle = computed(() => this.reporte().detalle);

    readonly recibidas = computed(() => this.resumen().reduce((a, t) => a + t.recibidas, 0));
    readonly atendidas = computed(() => this.resumen().reduce((a, t) => a + t.atendidas, 0));
    readonly pendientes = computed(() => this.resumen().reduce((a, t) => a + t.pendientes, 0));
    readonly maxRecibidas = computed(() => Math.max(1, ...this.resumen().map(t => t.recibidas)));

    readonly detalleTabla = computed(() =>
        this.detalle().map(n => ({
            ...n,
            fechaRecepcionFormato: formatearFecha(n.fechaRecepcion),
            fechaAtencionFormato: formatearFecha(n.fechaAtencion)
        })));

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Notificaciones OJ — LexControl', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(139, 154, 160);
        const f = new Date();
        doc.text(`Generado: ${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()} ${f.getHours()}:${String(f.getMinutes()).padStart(2, '0')}`, 14, 25);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(26, 28, 30);
        doc.text('Resumen', 14, 35);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Recibidas: ${this.recibidas()}  |  Atendidas: ${this.atendidas()}  |  Pendientes: ${this.pendientes()}`, 14, 41);

        autoTable(doc, {
            startY: 48,
            head: [['No. Expediente', 'Cliente', 'Tipo', 'Estado', 'Juzgado', 'Recepción', 'Atención', 'Resolución', 'Favorable']],
            body: this.detalleTabla().map(n => [
                n.noExpediente ?? '—', n.cliente ?? '—', n.tipo ?? '—', n.estado ?? '—', n.juzgado ?? '—',
                n.fechaRecepcionFormato, n.fechaAtencionFormato, n.numeroResolucion ?? '—',
                n.favorable == null ? '—' : (n.favorable ? 'Sí' : 'No')
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [108, 139, 108], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-notificaciones-oj-lexcontrol.pdf');
    }
}