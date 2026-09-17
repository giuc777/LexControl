import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReportesService } from '../../core/services/reportes-service';
import {
    ActividadAudienciasRespuesta,
    EventosAgendaMesDetalle,
    EventosAgendaMesResumen,
    PlazoVencimiento
} from '../../core/models/reporte.model';
import { formatearFecha, hoyISO } from './reportes-utils';

@Component({
    selector: 'app-reportes-agenda-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-agenda-page.html'
})
export class ReportesAgendaPage {
    private readonly svc = inject(ReportesService);

    readonly cargando = signal(true);

    private readonly actividad = toSignal(
        this.svc.actividadAudiencias().pipe(catchError(() =>
            of({ resumenEstados: [], resumenResultados: [], detalle: [] } as ActividadAudienciasRespuesta))),
        { initialValue: { resumenEstados: [], resumenResultados: [], detalle: [] } as ActividadAudienciasRespuesta }
    );

    private readonly eventos = toSignal(
        this.svc.eventosAgendaMes().pipe(catchError(() =>
            of({ resumen: [] as EventosAgendaMesResumen[], detalle: [] as EventosAgendaMesDetalle[] }))),
        { initialValue: { resumen: [] as EventosAgendaMesResumen[], detalle: [] as EventosAgendaMesDetalle[] } }
    );

    private readonly plazos = toSignal(
        this.svc.plazosVencimiento({ diasAnticipacion: 30 }).pipe(catchError(() => of([] as PlazoVencimiento[]))),
        { initialValue: [] as PlazoVencimiento[] }
    );

    readonly resumenEstados = computed(() => this.actividad().resumenEstados);
    readonly resumenResultados = computed(() => this.actividad().resumenResultados);
    readonly detalle = computed(() => this.actividad().detalle);
    readonly resumenEventos = computed(() => this.eventos().resumen);
    readonly plazosLista = computed(() => this.plazos());

    readonly totalAudiencias = computed(() =>
        this.resumenEstados().reduce((a, e) => a + e.cantidad, 0));
    readonly realizadas = computed(() =>
        this.resumenEstados().filter(e => e.estado === 'Realizada').reduce((a, e) => a + e.cantidad, 0));
    readonly programadas = computed(() =>
        this.resumenEstados().filter(e => e.estado === 'Programada').reduce((a, e) => a + e.cantidad, 0));

    readonly maxResultado = computed(() =>
        Math.max(1, ...this.resumenResultados().map(r => r.cantidad)));

    readonly detalleTabla = computed(() =>
        this.detalle().map(d => ({ ...d, fechaFormato: formatearFecha(d.fecha) })));

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Agenda y Audiencias — LexControl', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(139, 154, 160);
        const f = new Date();
        doc.text(`Generado: ${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()} ${f.getHours()}:${String(f.getMinutes()).padStart(2, '0')}  |  Corte: ${hoyISO()}`, 14, 25);

        autoTable(doc, {
            startY: 35,
            head: [['No. Expediente', 'Cliente', 'Tipo', 'Estado', 'Resultado', 'Fecha', 'Juzgado', 'Sala']],
            body: this.detalleTabla().map(a => [
                a.noExpediente ?? '—', a.cliente ?? '—', a.tipo ?? '—', a.estado ?? '—',
                a.resultado ?? '—', a.fechaFormato, a.juzgado ?? '—', a.sala ?? '—'
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [142, 68, 173], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-agenda-audiencias-lexcontrol.pdf');
    }
}