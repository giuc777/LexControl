import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReportesService } from '../../core/services/reportes-service';
import { ClientesPorTipoDetalle, ClientesPorTipoResumen } from '../../core/models/reporte.model';
import { formatearFecha, iniciales } from './reportes-utils';

const COLORES_TIPO: Record<string, string> = {
    Particular: '#358292',
    Empresa: '#B2845A'
};

@Component({
    selector: 'app-reportes-clientes-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-clientes-page.html'
})
export class ReportesClientesPage {
    private readonly svc = inject(ReportesService);

    readonly cargando = signal(true);

    private readonly reporte = toSignal(
        this.svc.clientesPorTipo().pipe(catchError(() =>
            of({ resumen: [] as ClientesPorTipoResumen[], detalle: [] as ClientesPorTipoDetalle[] }))),
        { initialValue: { resumen: [] as ClientesPorTipoResumen[], detalle: [] as ClientesPorTipoDetalle[] } }
    );

    readonly resumen = computed(() => this.reporte().resumen);
    readonly detalle = computed(() => this.reporte().detalle);

    readonly total = computed(() => this.resumen().reduce((a, t) => a + t.total, 0));
    readonly activos = computed(() => this.resumen().reduce((a, t) => a + t.activos, 0));
    readonly inactivos = computed(() => this.resumen().reduce((a, t) => a + t.inactivos, 0));
    readonly conExpedientes = computed(() => this.detalle().filter(d => d.expedientes > 0).length);

    colorTipo(tipo: string): string {
        return COLORES_TIPO[tipo] ?? '#8b9aa0';
    }

    readonly detalleTabla = computed(() =>
        this.detalle().map(d => ({
            ...d,
            iniciales: iniciales(d.cliente),
            color: this.colorTipo(d.tipo ?? ''),
            fechaCreacionFormato: formatearFecha(d.fechaCreacion)
        })));

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Clientes por Tipo — LexControl', 14, 18);

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
        doc.text(`Total: ${this.total()}  |  Activos: ${this.activos()}  |  Inactivos: ${this.inactivos()}`, 14, 41);

        autoTable(doc, {
            startY: 48,
            head: [['Cliente', 'Tipo', 'Estado', 'Expedientes', 'Alta']],
            body: this.detalleTabla().map(c => [
                c.cliente ?? '—', c.tipo ?? '—', c.activo ? 'Activo' : 'Inactivo',
                String(c.expedientes), c.fechaCreacionFormato
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [53, 130, 146], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-clientes-por-tipo-lexcontrol.pdf');
    }
}