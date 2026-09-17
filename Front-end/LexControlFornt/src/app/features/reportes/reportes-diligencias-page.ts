import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReportesService } from '../../core/services/reportes-service';
import {
    AlertasPendientesDetalle,
    AlertasPendientesResumen,
    DiligenciasDetalle,
    DiligenciasResumen
} from '../../core/models/reporte.model';
import { formatearFecha } from './reportes-utils';

@Component({
    selector: 'app-reportes-diligencias-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-diligencias-page.html'
})
export class ReportesDiligenciasPage {
    private readonly svc = inject(ReportesService);

    readonly cargando = signal(true);

    private readonly diligencias = toSignal(
        this.svc.diligencias().pipe(catchError(() =>
            of({ resumen: [] as DiligenciasResumen[], detalle: [] as DiligenciasDetalle[] }))),
        { initialValue: { resumen: [] as DiligenciasResumen[], detalle: [] as DiligenciasDetalle[] } }
    );

    private readonly alertas = toSignal(
        this.svc.alertasPendientes().pipe(catchError(() =>
            of({ resumen: [] as AlertasPendientesResumen[], detalle: [] as AlertasPendientesDetalle[] }))),
        { initialValue: { resumen: [] as AlertasPendientesResumen[], detalle: [] as AlertasPendientesDetalle[] } }
    );

    readonly resumenDiligencias = computed(() => this.diligencias().resumen);
    readonly detalleDiligencias = computed(() => this.diligencias().detalle);
    readonly resumenAlertas = computed(() => this.alertas().resumen);
    readonly detalleAlertas = computed(() => this.alertas().detalle);

    readonly totalDiligencias = computed(() => this.resumenDiligencias().reduce((a, d) => a + d.cantidad, 0));
    readonly completadas = computed(() => this.resumenDiligencias().reduce((a, d) => a + d.completadas, 0));
    readonly pendientes = computed(() => this.resumenDiligencias().reduce((a, d) => a + d.pendientes, 0));
    readonly totalAlertas = computed(() => this.resumenAlertas().reduce((a, x) => a + x.cantidad, 0));
    readonly maxDiligencias = computed(() => Math.max(1, ...this.resumenDiligencias().map(d => d.cantidad)));

    readonly detalleDiligenciasTabla = computed(() =>
        this.detalleDiligencias().map(d => ({ ...d, fechaFormato: formatearFecha(d.fecha) })));
    readonly detalleAlertasTabla = computed(() =>
        this.detalleAlertas().map(a => ({ ...a, fechaFormato: formatearFecha(a.fechaAlerta) })));

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Diligencias y Alertas — LexControl', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(139, 154, 160);
        const f = new Date();
        doc.text(`Generado: ${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()} ${f.getHours()}:${String(f.getMinutes()).padStart(2, '0')}`, 14, 25);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(26, 28, 30);
        doc.text('Diligencias', 14, 35);

        autoTable(doc, {
            startY: 40,
            head: [['Título', 'No. Expediente', 'Vinculado', 'Tipo', 'Estado', 'Fecha', 'Ubicación', 'Encargado']],
            body: this.detalleDiligenciasTabla().map(d => [
                d.titulo ?? '—', d.noExpediente ?? '—', d.vinculado ?? '—', d.tipo ?? '—', d.estado ?? '—',
                d.fechaFormato, d.ubicacion ?? '—', d.encargado ?? '—'
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [53, 130, 146], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
        autoTable(doc, {
            startY: finalY + 10,
            head: [['Título', 'Tipo Alerta', 'Descripción', 'Fecha', 'Leída', 'No. Expediente']],
            body: this.detalleAlertasTabla().map(a => [
                a.titulo ?? '—', a.tipoAlerta ?? '—', a.descripcion ?? '—', a.fechaFormato,
                a.leida ? 'Sí' : 'No', a.noExpediente ?? '—'
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 240, 240] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-diligencias-alertas-lexcontrol.pdf');
    }
}