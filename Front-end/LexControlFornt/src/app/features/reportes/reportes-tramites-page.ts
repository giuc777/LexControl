import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReportesService } from '../../core/services/reportes-service';
import { GestionTramitesDetalle, GestionTramitesResumen } from '../../core/models/reporte.model';
import { formatearFecha } from './reportes-utils';

@Component({
    selector: 'app-reportes-tramites-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-tramites-page.html'
})
export class ReportesTramitesPage {
    private readonly svc = inject(ReportesService);

    readonly cargando = signal(true);

    private readonly gestion = toSignal(
        this.svc.gestionTramites().pipe(catchError(() =>
            of({ resumen: [] as GestionTramitesResumen[], detalle: [] as GestionTramitesDetalle[] }))),
        { initialValue: { resumen: [] as GestionTramitesResumen[], detalle: [] as GestionTramitesDetalle[] } }
    );

    readonly resumen = computed(() => this.gestion().resumen);
    readonly detalle = computed(() => this.gestion().detalle);

    readonly totalIngresados = computed(() => this.resumen().reduce((a, t) => a + t.ingresados, 0));
    readonly totalResueltos = computed(() => this.resumen().reduce((a, t) => a + t.resueltos, 0));
    readonly totalPendientes = computed(() => this.resumen().reduce((a, t) => a + t.pendientes, 0));
    readonly maxIngresados = computed(() => Math.max(1, ...this.resumen().map(t => t.ingresados)));

    readonly detalleTabla = computed(() =>
        this.detalle().map(t => ({
            ...t,
            fechaIngresoFormato: formatearFecha(t.fechaIngreso),
            fechaResolucionFormato: formatearFecha(t.fechaResolucion)
        })));

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Gestión de Trámites — LexControl', 14, 18);

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
        doc.text(`Ingresados: ${this.totalIngresados()}  |  Resueltos: ${this.totalResueltos()}  |  Pendientes: ${this.totalPendientes()}`, 14, 41);

        autoTable(doc, {
            startY: 48,
            head: [['No. Expediente', 'Cliente', 'Tipo', 'Institución', 'Estado', 'Ingreso', 'Resolución', 'Días Gestión']],
            body: this.detalleTabla().map(t => [
                t.noExpediente ?? '—', t.cliente ?? '—', t.tipo ?? '—', t.institucion ?? '—', t.estado ?? '—',
                t.fechaIngresoFormato, t.fechaResolucionFormato, String(t.diasGestion ?? '—')
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [151, 190, 198], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-gestion-tramites-lexcontrol.pdf');
    }
}