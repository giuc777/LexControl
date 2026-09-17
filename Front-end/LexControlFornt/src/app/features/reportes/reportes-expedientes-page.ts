import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReportesService } from '../../core/services/reportes-service';
import {
    AntiguedadExpedientesDetalle,
    AntiguedadExpedientesResumen,
    ExpedientesPorEstadoDetalle,
    ExpedientesPorEstadoResumen,
    ExpedientesPorJuzgadoDetalle,
    ExpedientesPorJuzgadoResumen,
    ExpedientesPorRamaDetalle,
    ExpedientesPorRamaResumen
} from '../../core/models/reporte.model';
import { formatearFecha } from './reportes-utils';

@Component({
    selector: 'app-reportes-expedientes-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-expedientes-page.html'
})
export class ReportesExpedientesPage {
    private readonly svc = inject(ReportesService);

    readonly cargando = signal(true);

    private readonly porEstado = toSignal(
        this.svc.expedientesPorEstado().pipe(catchError(() =>
            of({ resumen: [] as ExpedientesPorEstadoResumen[], detalle: [] as ExpedientesPorEstadoDetalle[] }))),
        { initialValue: { resumen: [] as ExpedientesPorEstadoResumen[], detalle: [] as ExpedientesPorEstadoDetalle[] } }
    );

    private readonly porJuzgado = toSignal(
        this.svc.expedientesPorJuzgado().pipe(catchError(() =>
            of({ resumen: [] as ExpedientesPorJuzgadoResumen[], detalle: [] as ExpedientesPorJuzgadoDetalle[] }))),
        { initialValue: { resumen: [] as ExpedientesPorJuzgadoResumen[], detalle: [] as ExpedientesPorJuzgadoDetalle[] } }
    );

    private readonly porRama = toSignal(
        this.svc.expedientesPorRama().pipe(catchError(() =>
            of({ resumen: [] as ExpedientesPorRamaResumen[], detalle: [] as ExpedientesPorRamaDetalle[] }))),
        { initialValue: { resumen: [] as ExpedientesPorRamaResumen[], detalle: [] as ExpedientesPorRamaDetalle[] } }
    );

    private readonly antiguedad = toSignal(
        this.svc.antiguedadExpedientes().pipe(catchError(() =>
            of({ resumen: [] as AntiguedadExpedientesResumen[], detalle: [] as AntiguedadExpedientesDetalle[] }))),
        { initialValue: { resumen: [] as AntiguedadExpedientesResumen[], detalle: [] as AntiguedadExpedientesDetalle[] } }
    );

    readonly resumenEstados = computed(() => this.porEstado().resumen);
    readonly resumenJuzgados = computed(() => this.porJuzgado().resumen);
    readonly resumenRamas = computed(() => this.porRama().resumen.slice(0, 8));
    readonly resumenAntiguedad = computed(() => this.antiguedad().resumen);
    readonly detalle = computed(() => this.porEstado().detalle);

    readonly total = computed(() =>
        this.resumenEstados().reduce((acc, e) => acc + e.cantidad, 0));

    readonly activos = computed(() =>
        this.resumenEstados().filter(e => e.estado === 'Activo').reduce((a, e) => a + e.cantidad, 0));
    readonly enEspera = computed(() =>
        this.resumenEstados().filter(e => e.estado === 'En Espera').reduce((a, e) => a + e.cantidad, 0));
    readonly cerrados = computed(() =>
        this.resumenEstados().filter(e => e.estado === 'Cerrado' || e.estado === 'Archivado')
            .reduce((a, e) => a + e.cantidad, 0));

    readonly detalleTabla = computed(() =>
        this.detalle().map(d => ({ ...d, fechaIngresoFormato: formatearFecha(d.fechaIngreso) })));

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Expedientes — LexControl', 14, 18);

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
        doc.text(`Total: ${this.total()}  |  Activos: ${this.activos()}  |  En Espera: ${this.enEspera()}  |  Cerrados/Archivados: ${this.cerrados()}`, 14, 41);

        autoTable(doc, {
            startY: 48,
            head: [['No. Expediente', 'Cliente', 'Rama', 'Estado', 'Abogado', 'Fecha Ingreso']],
            body: this.detalleTabla().map(e => [
                e.noExpediente ?? '—', e.cliente ?? '—', e.rama ?? '—', e.estado ?? '—',
                e.abogado ?? '—', e.fechaIngresoFormato
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [53, 130, 146], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-expedientes-lexcontrol.pdf');
    }
}