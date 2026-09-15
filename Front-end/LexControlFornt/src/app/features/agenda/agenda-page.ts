import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AudienciasService } from '../../core/services/audiencias-service';
import { EventosService } from '../../core/services/eventos-service';
import { DiligenciasService } from '../../core/services/diligencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { Audiencia } from '../../core/models/audiencia.model';
import { Evento } from '../../core/models/evento.model';
import { Diligencia } from '../../core/models/diligencia.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { AudienciaModal } from './audiencia-modal';
import { DiligenciaModal } from '../diligencias/diligencia-modal';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const COLORES_ESTADO: Record<string, string> = {
    'Programada': '#3498db',
    'Realizada': '#2ecc71',
    'Cancelada': '#e74c3c',
    'Reprogramada': '#f39c12',
    'Pendiente': '#f39c12',
    'En Progreso': '#3498db',
    'Completada': '#2ecc71'
};
const COLORES_TIPO: Record<string, string> = {
    'Audiencia': '#3498db',
    'Plazo': '#e74c3c',
    'Diligencia': '#9b59b6',
    'Cita': '#2ecc71',
    'Otro': '#95a5a6'
};
const COLORES_TIPO_DILIGENCIA: Record<string, string> = {
    'Asesoria': '#3498db',
    'Redaccion': '#2ecc71',
    'Revision': '#f39c12',
    'Llamada': '#9b59b6',
    'Visita': '#e74c3c',
    'Correo': '#1abc9c'
};

@Component({
    selector: 'app-agenda-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, AudienciaModal, DiligenciaModal],
    templateUrl: './agenda-page.html'
})
export class AgendaPage implements OnInit {
    private readonly audienciasSvc = inject(AudienciasService);
    private readonly eventosSvc = inject(EventosService);
    private readonly diligenciasSvc = inject(DiligenciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly router = inject(Router);

    protected readonly DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    protected readonly audiencias = signal<Audiencia[]>([]);
    protected readonly eventos = signal<Evento[]>([]);
    protected readonly diligencias = signal<Diligencia[]>([]);
    protected readonly cargando = signal(false);
    protected readonly modalAudienciaAbierto = signal(false);
    protected readonly modalDiligenciaAbierto = signal(false);

    protected readonly expedientes = signal<{ id: number; noExpediente: string }[]>([]);
    protected readonly tiposDiligencia = signal<CatalogoItem[]>([]);

    protected readonly mesActual = signal(new Date().getMonth());
    protected readonly anioActual = signal(new Date().getFullYear());
    protected readonly diaSeleccionado = signal(new Date().getDate());

    protected readonly nombreMes = computed(() =>
        `${MESES[this.mesActual()]} ${this.anioActual()}`);

    protected readonly diasCalendario = computed(() => {
        const anio = this.anioActual();
        const mes = this.mesActual();
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);
        const diasEnMes = ultimoDia.getDate();

        let ajuste = primerDia.getDay() - 1;
        if (ajuste < 0) ajuste = 6;

        const dias: { numero: number; vacio: boolean; esHoy: boolean }[] = [];
        for (let i = 0; i < ajuste; i++) {
            dias.push({ numero: 0, vacio: true, esHoy: false });
        }

        const hoy = new Date();
        for (let d = 1; d <= diasEnMes; d++) {
            dias.push({
                numero: d,
                vacio: false,
                esHoy: d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
            });
        }
        return dias;
    });

    protected readonly fechaSeleccionada = computed(() => {
        const anio = this.anioActual();
        const mes = this.mesActual();
        const dia = this.diaSeleccionado();
        return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    });

    protected readonly eventosDelDia = computed(() => {
        const dia = this.diaSeleccionado();
        const mes = this.mesActual();
        const anio = this.anioActual();
        const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const audienciasDia = this.audiencias()
            .filter(a => a.fecha === fechaStr)
            .map(a => ({
            id: a.id,
            titulo: `${a.tipo} - ${a.noExpediente}`,
            horaInicio: a.horaInicio,
            tipo: a.tipo,
            noExpediente: a.noExpediente,
            juzgado: a.juzgado,
            sala: a.sala,
            estado: a.estado,
            esAudiencia: true as const,
            esDiligencia: false as const,
            colorTipo: COLORES_TIPO['Audiencia'] ?? '#6c757d'
        }));

        const eventosDia = this.eventos().map(e => ({
            id: e.id,
            titulo: e.titulo,
            horaInicio: e.horaInicio,
            tipo: e.tipoEvento,
            noExpediente: e.noExpediente ?? '—',
            juzgado: e.ubicacion ?? '',
            sala: null as string | null,
            estado: e.estado,
            esAudiencia: false as const,
            esDiligencia: false as const,
            colorTipo: COLORES_TIPO[e.tipoEvento] ?? '#6c757d'
        }));

        const diligenciasDia = this.diligencias()
            .filter(d => d.fecha === fechaStr)
            .map(d => ({
                id: d.id,
                titulo: d.titulo,
                horaInicio: d.horaInicio ?? '00:00',
                tipo: d.tipo,
                noExpediente: d.noExpediente ?? '—',
                juzgado: d.ubicacion ?? '',
                sala: null as string | null,
                estado: d.estado,
                esAudiencia: false as const,
                esDiligencia: true as const,
                colorTipo: COLORES_TIPO_DILIGENCIA[d.tipo] ?? '#9b59b6'
            }));

        return [...audienciasDia, ...eventosDia, ...diligenciasDia].sort((a, b) =>
            a.horaInicio.localeCompare(b.horaInicio));
    });

    ngOnInit(): void {
        this.cargarDatos();
        this.cargarExpedientes();
    }

    cargarDatos(): void {
        this.cargando.set(true);
        const anio = this.anioActual();
        const mes = this.mesActual();
        const fechaInicio = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
        const fechaFin = `${anio}-${String(mes + 1).padStart(2, '0')}-${new Date(anio, mes + 1, 0).getDate()}`;

        this.audienciasSvc.listar({ fechaInicio, fechaFin }).subscribe({
            next: (datos) => { this.audiencias.set(datos); this.cargando.set(false); },
            error: () => { this.audiencias.set([]); this.cargando.set(false); }
        });

        this.diligenciasSvc.listar({ fechaInicio, fechaFin }).subscribe({
            next: (datos) => { this.diligencias.set(datos); },
            error: () => { this.diligencias.set([]); }
        });

        this.cargarEventosDelDia();
    }

    cargarExpedientes(): void {
        this.expedientesSvc.listar({}).subscribe({
            next: (data) => {
                this.expedientes.set(
                    data.expedientes.map((e: { id: number; noExpediente: string }) => ({
                        id: e.id,
                        noExpediente: e.noExpediente
                    }))
                );
            }
        });
    }

    seleccionarDia(dia: number): void {
        if (dia > 0) {
            this.diaSeleccionado.set(dia);
            this.cargarEventosDelDia();
        }
    }

    cargarEventosDelDia(): void {
        const anio = this.anioActual();
        const mes = this.mesActual();
        const dia = this.diaSeleccionado();
        const fechaDia = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        this.eventosSvc.obtenerDelDia(fechaDia).subscribe({
            next: (datos) => { this.eventos.set(datos); },
            error: () => { this.eventos.set([]); }
        });
    }

    mesAnterior(): void {
        if (this.mesActual() === 0) {
            this.mesActual.set(11);
            this.anioActual.update(a => a - 1);
        } else {
            this.mesActual.update(m => m - 1);
        }
        this.diaSeleccionado.set(1);
        this.cargarDatos();
    }

    mesSiguiente(): void {
        if (this.mesActual() === 11) {
            this.mesActual.set(0);
            this.anioActual.update(a => a + 1);
        } else {
            this.mesActual.update(m => m + 1);
        }
        this.diaSeleccionado.set(1);
        this.cargarDatos();
    }

    irADetalle(evento: { id: number; esAudiencia: boolean; esDiligencia: boolean }): void {
        if (evento.esDiligencia) {
            this.router.navigate(['/diligencias', evento.id]);
        } else if (evento.esAudiencia) {
            this.router.navigate(['/agenda', evento.id]);
        } else {
            this.router.navigate(['/agenda', evento.id]);
        }
    }

    colorEstado(estado: string): string {
        return COLORES_ESTADO[estado] ?? '#6c757d';
    }

    colorTipo(tipo: string): string {
        return COLORES_TIPO[tipo] ?? '#9b59b6';
    }

    formatearHora(hora: string): string {
        if (!hora) return '';
        const partes = hora.split(':');
        if (partes.length >= 2) return `${partes[0]}:${partes[1]}`;
        return hora;
    }

    abrirModalAudiencia(): void {
        this.modalAudienciaAbierto.set(true);
    }

    cerrarModalAudiencia(): void {
        this.modalAudienciaAbierto.set(false);
    }

    alCrearAudiencia(): void {
        this.cerrarModalAudiencia();
        this.cargarDatos();
    }

    abrirModalDiligencia(): void {
        this.modalDiligenciaAbierto.set(true);
    }

    cerrarModalDiligencia(): void {
        this.modalDiligenciaAbierto.set(false);
    }

    alCrearDiligencia(): void {
        this.cerrarModalDiligencia();
        this.cargarDatos();
    }
}
