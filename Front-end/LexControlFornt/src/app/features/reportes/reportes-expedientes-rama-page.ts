import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ExpedientesService } from '../../core/services/expedientes-service';
import { ExpedienteLista } from '../../core/models/expediente.model';

interface RamaConteo {
    nombre: string;
    cantidad: number;
    color: string;
    porcentaje: number;
}

interface EstadoConteo {
    nombre: string;
    cantidad: number;
    color: string;
    porcentaje: number;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
    selector: 'app-reportes-expedientes-rama-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-expedientes-rama-page.html'
})
export class ReportesExpedientesRamaPage {
    private readonly expedientesSvc = inject(ExpedientesService);

    readonly cargando = signal(true);

    private readonly expedientes = toSignal(
        this.expedientesSvc.listar({ tamanioPagina: 9999 }).pipe(
            map(resp => resp.expedientes),
            catchError(() => of([] as ExpedienteLista[]))
        ),
        { initialValue: [] as ExpedienteLista[] }
    );

    readonly total = computed(() => this.expedientes().length);
    readonly activos = computed(() => this.expedientes().filter(e => e.estadoId === 1).length);
    readonly enEspera = computed(() => this.expedientes().filter(e => e.estadoId === 2).length);
    readonly cerrados = computed(() => this.expedientes().filter(e => e.estadoId === 3 || e.estadoId === 4).length);

    readonly porRama = computed<RamaConteo[]>(() => {
        const lista = this.expedientes();
        const total = lista.length || 1;
        const mapa = new Map<string, { cantidad: number; color: string }>();
        for (const e of lista) {
            const key = e.rama || 'Sin rama';
            const existente = mapa.get(key);
            if (existente) {
                existente.cantidad++;
            } else {
                mapa.set(key, { cantidad: 1, color: e.ramaColor || '#8b9aa0' });
            }
        }
        return Array.from(mapa.entries())
            .map(([nombre, datos]) => ({
                nombre,
                cantidad: datos.cantidad,
                color: datos.color,
                porcentaje: Math.round((datos.cantidad / total) * 100)
            }))
            .sort((a, b) => b.cantidad - a.cantidad);
    });

    readonly porEstado = computed<EstadoConteo[]>(() => {
        const lista = this.expedientes();
        const total = lista.length || 1;
        const mapa = new Map<string, { cantidad: number; color: string }>();
        for (const e of lista) {
            const key = e.estado || 'Sin estado';
            const existente = mapa.get(key);
            if (existente) {
                existente.cantidad++;
            } else {
                mapa.set(key, { cantidad: 1, color: e.estadoColor || '#8b9aa0' });
            }
        }
        return Array.from(mapa.entries())
            .map(([nombre, datos]) => ({
                nombre,
                cantidad: datos.cantidad,
                color: datos.color,
                porcentaje: Math.round((datos.cantidad / total) * 100)
            }))
            .sort((a, b) => b.cantidad - a.cantidad);
    });

    readonly expedientesTabla = computed(() => {
        return this.expedientes().map(e => ({
            ...e,
            fechaIngresoFormato: this.formatearFecha(e.fechaIngreso)
        }));
    });

    private formatearFecha(fecha: string | null): string {
        if (!fecha) return '—';
        const partes = fecha.split('T')[0].split('-');
        if (partes.length !== 3) return fecha;
        return `${parseInt(partes[2], 10)} ${MESES[parseInt(partes[1], 10) - 1]} ${partes[0]}`;
    }

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Expedientes por Rama — LexControl', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(139, 154, 160);
        const fecha = new Date();
        doc.text(`Generado: ${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()} ${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, '0')}`, 14, 25);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(26, 28, 30);
        doc.text('Resumen', 14, 35);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total: ${this.total()}  |  Activos: ${this.activos()}  |  En Espera: ${this.enEspera()}  |  Cerrados/Archivados: ${this.cerrados()}`, 14, 41);

        const encabezados = [['No. Expediente', 'Cliente', 'Rama', 'Tipo Proceso', 'Juzgado', 'Estado', 'Abogado', 'Fecha Ingreso']];
        const datos = this.expedientesTabla().map(e => [
            e.noExpediente,
            e.cliente,
            e.rama,
            e.tipoProceso || '—',
            e.juzgado,
            e.estado,
            e.abogado,
            e.fechaIngresoFormato
        ]);

        autoTable(doc, {
            startY: 48,
            head: encabezados,
            body: datos,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [178, 132, 90], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-expedientes-por-rama-lexcontrol.pdf');
    }
}
