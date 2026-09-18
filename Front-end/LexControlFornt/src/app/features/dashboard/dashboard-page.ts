import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EventosService } from '../../core/services/eventos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { AudienciasService } from '../../core/services/audiencias-service';
import { DiligenciasService } from '../../core/services/diligencias-service';
import { TramitesService } from '../../core/services/tramites-service';
import { NotificacionesService } from '../../core/services/notificaciones-service';

interface StatCard {
    label: string;
    valor: number;
    detalle: string;
    tono: '' | 'warn' | 'danger';
}

interface EventoAgenda {
    id: number;
    titulo: string;
    tipoEvento: string;
    fecha: string;             // ISO 'yyyy-MM-dd'
    horaInicio: string;        // 'HH:mm'
    horaFin: string;
    ubicacion: string;
    noExpediente: string | null;
    cliente: string | null;
    prioridad: number;
    colorEvento: string | null;
}

/* Posición calculada dentro de la columna del día (igual que dashboard.js). */
interface EventoVisual extends EventoAgenda {
    dia: number;               // 0..4 = lunes..viernes de la semana visible
    arriba: number;            // % desde el inicio de la jornada
    alto: number;              // % de duración
    outline: boolean;          // sin color → tarjeta blanca con borde
}

/* Réplica de Pototipo/dashboard.html + dashboard.js.
   Conectado a /api/eventos para mostrar la agenda semanal real. */
const ESTADISTICAS_SEED: readonly StatCard[] = [
    { label: 'Expedientes Activos', valor: 8, detalle: '+2 este mes', tono: '' },
    { label: 'Audiencias Próximas', valor: 3, detalle: 'Próxima: Mañana', tono: '' },
    { label: 'Trámites Pendientes', valor: 5, detalle: '3 críticos', tono: 'warn' },
    { label: 'Notificaciones OJ', valor: 2, detalle: 'Urgente', tono: 'danger' }
];

const DIAS_CORTOS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const HORA_INICIO = 8;
const HORA_FIN = 20;
const HORAS = HORA_FIN - HORA_INICIO;

@Component({
    selector: 'app-dashboard-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './dashboard-page.html'
})
export class DashboardPage implements OnInit {
    private readonly router = inject(Router);
    private readonly eventosSvc = inject(EventosService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly audienciasSvc = inject(AudienciasService);
    private readonly diligenciasSvc = inject(DiligenciasService);
    private readonly tramitesSvc = inject(TramitesService);
    private readonly notificacionesSvc = inject(NotificacionesService);

    readonly estadisticas = signal<StatCard[]>([
        { label: 'Expedientes Activos', valor: 0, detalle: 'Cargando...', tono: '' },
        { label: 'Audiencias Proximas', valor: 0, detalle: 'Cargando...', tono: '' },
        { label: 'Tramites Pendientes', valor: 0, detalle: 'Cargando...', tono: '' },
        { label: 'Notificaciones OJ', valor: 0, detalle: 'Cargando...', tono: '' }
    ]);
    private readonly agendaRaw = signal<EventoAgenda[]>([]);

    private readonly hoy = new Date();
    private readonly lunes = this.obtenerLunes(this.hoy);
    private readonly diasSemana: Date[] = Array.from({ length: 5 }, (_, i) =>
        new Date(this.lunes.getFullYear(), this.lunes.getMonth(), this.lunes.getDate() + i)
    );

    readonly dias = this.diasSemana.map((d, i) => ({
        etiqueta: `${DIAS_CORTOS[d.getDay()]} ${d.getDate()}`,
        esHoy: i === this.indiceHoy()
    }));

    readonly horas = Array.from({ length: HORAS }, (_, h) => {
        const hora = HORA_INICIO + h;
        return `${hora < 10 ? '0' : ''}${hora}:00`;
    });

    /* Filas del grid: cabecera + una por hora. */
    protected readonly totalFilas = HORAS + 2;

    readonly rangoAgenda = computed(() => this.formatoRango(this.diasSemana));

    /* Eventos posicionados una sola vez (misma fórmula de dashboard.js). */
    private readonly eventosVisuales = computed<readonly EventoVisual[]>(() => {
        return this.agendaRaw().map(evento => {
            const inicio = this.horaEnMinutos(evento.horaInicio);
            const fin = evento.horaFin ? this.horaEnMinutos(evento.horaFin) : inicio + 60;
            const rangoTotal = HORAS * 60;
            const fechaEvento = new Date(`${evento.fecha}T00:00:00`);
            const diaSemana = (fechaEvento.getDay() + 6) % 7;

            let alto = ((fin - inicio) / rangoTotal) * 100;
            if (alto < 10) alto = 10;
            if (alto > 100) alto = 100;

            /* Se limita la posición para que ningún evento se salga de la columna. */
            const tope = Math.max(100 - alto, 0);
            const arriba = Math.min(Math.max(((inicio - HORA_INICIO * 60) / rangoTotal) * 100, 0), tope);

            return {
                ...evento,
                dia: diaSemana,
                arriba,
                alto,
                outline: !evento.colorEvento
            };
        });
    });

    ngOnInit(): void {
        this.cargarAgendaSemana();
        this.cargarEstadisticas();
    }

    /* Agenda semanal: combina eventos propios, audiencias y diligencias
       de lunes a viernes, igual que la vista del módulo de Agenda. */
    cargarAgendaSemana(): void {
        const fechaInicio = this.formatoFechaISO(this.diasSemana[0]);
        const fechaFin = this.formatoFechaISO(this.diasSemana[4]);

        forkJoin({
            eventos: this.eventosSvc.obtenerDeLaSemana(fechaInicio, fechaFin),
            audiencias: this.audienciasSvc.listar({ fechaInicio, fechaFin }),
            diligencias: this.diligenciasSvc.listar({ fechaInicio, fechaFin })
        }).subscribe({
            next: ({ eventos, audiencias, diligencias }) => {
                const combinados: EventoAgenda[] = [
                    ...eventos.map(e => ({
                        id: e.id,
                        titulo: e.titulo,
                        tipoEvento: e.tipoEvento,
                        fecha: e.fecha,
                        horaInicio: e.horaInicio,
                        horaFin: e.horaFin ?? '',
                        ubicacion: e.ubicacion ?? '',
                        noExpediente: e.noExpediente,
                        cliente: e.cliente,
                        prioridad: e.prioridad,
                        colorEvento: e.colorEvento
                    })),
                    ...audiencias.map(a => ({
                        id: a.id,
                        titulo: `${a.tipo} - ${a.noExpediente}`,
                        tipoEvento: 'Audiencia',
                        fecha: a.fecha,
                        horaInicio: a.horaInicio,
                        horaFin: a.horaFin ?? '',
                        ubicacion: a.juzgado ?? '',
                        noExpediente: a.noExpediente,
                        cliente: a.cliente,
                        prioridad: 0,
                        colorEvento: null
                    })),
                    ...diligencias.map(d => ({
                        id: d.id,
                        titulo: d.titulo,
                        tipoEvento: 'Diligencia',
                        fecha: d.fecha,
                        horaInicio: d.horaInicio ?? '00:00',
                        horaFin: '',
                        ubicacion: d.ubicacion ?? '',
                        noExpediente: d.noExpediente,
                        cliente: d.cliente,
                        prioridad: 0,
                        colorEvento: null
                    }))
                ];
                this.agendaRaw.set(combinados);
            },
            error: () => { this.agendaRaw.set([]); }
        });
    }

    cargarEstadisticas(): void {
        const hoy = new Date();
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        const fechaFin = this.formatoFechaISO(finMes);

        this.expedientesSvc.listar({ estadoId: 1 }).subscribe({
            next: (data) => {
                this.estadisticas.update(s => {
                    const copia = [...s];
                    copia[0] = { label: 'Expedientes Activos', valor: data.total, detalle: `${data.total} activos`, tono: '' };
                    return copia;
                });
            },
            error: () => {}
        });

        this.audienciasSvc.listar({}).subscribe({
            next: (audiencias) => {
                const proximas = audiencias.filter(a => a.fecha >= this.formatoFechaISO(hoy)).length;
                this.estadisticas.update(s => {
                    const copia = [...s];
                    copia[1] = { label: 'Audiencias Proximas', valor: proximas, detalle: proximas > 0 ? `${proximas} programadas` : 'Sin proximas', tono: '' };
                    return copia;
                });
            },
            error: () => {}
        });

        this.tramitesSvc.listar({}).subscribe({
            next: (tramites) => {
                const pendientes = tramites.filter(t => t.estado !== 'Resuelto' && t.estado !== 'Rechazado').length;
                this.estadisticas.update(s => {
                    const copia = [...s];
                    copia[2] = { label: 'Tramites Pendientes', valor: pendientes, detalle: pendientes > 0 ? `${pendientes} pendientes` : 'Todo resuelto', tono: pendientes > 3 ? 'warn' : '' };
                    return copia;
                });
            },
            error: () => {}
        });

        this.notificacionesSvc.listar({}).subscribe({
            next: (notificaciones) => {
                const pendientes = notificaciones.filter(n => n.estado === 'Pendiente').length;
                this.estadisticas.update(s => {
                    const copia = [...s];
                    copia[3] = { label: 'Notificaciones OJ', valor: pendientes, detalle: pendientes > 0 ? `${pendientes} pendientes` : 'Al dia', tono: pendientes > 0 ? 'danger' : '' };
                    return copia;
                });
            },
            error: () => {}
        });
    }

    eventosDeDia(dia: number): readonly EventoVisual[] {
        return this.eventosVisuales().filter(evento => evento.dia === dia);
    }

    irAExpedientes(): void {
        this.router.navigateByUrl('/expedientes');
    }

    verEvento(_evento: EventoVisual): void {
        this.router.navigateByUrl('/agenda');
    }

    irHoy(): void {
        document.querySelector<HTMLElement>('.day-col[data-hoy="1"]')
            ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    private indiceHoy(): number {
        return (this.hoy.getDay() + 6) % 7;
    }

    private horaEnMinutos(hora: string): number {
        const partes = hora.split(':');
        return parseInt(partes[0], 10) * 60 + parseInt(partes[1], 10);
    }

    private obtenerLunes(hoy: Date): Date {
        const desfase = (hoy.getDay() + 6) % 7;
        return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - desfase);
    }

    private formatoRango(dias: Date[]): string {
        const primero = dias[0];
        const ultimo = dias[4];

        if (primero.getMonth() === ultimo.getMonth() && primero.getFullYear() === ultimo.getFullYear()) {
            return `${MESES[primero.getMonth()]} ${primero.getDate()} - ${ultimo.getDate()}, ${ultimo.getFullYear()}`;
        }
        return `${MESES[primero.getMonth()]} ${primero.getDate()} - ${MESES[ultimo.getMonth()]} ${ultimo.getDate()}, ${ultimo.getFullYear()}`;
    }

    private formatoFechaISO(fecha: Date): string {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }
}
