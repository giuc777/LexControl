import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { EventosService } from '../../core/services/eventos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { AudienciasService } from '../../core/services/audiencias-service';
import { TramitesService } from '../../core/services/tramites-service';
import { NotificacionesService } from '../../core/services/notificaciones-service';
import { Evento } from '../../core/models/evento.model';

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
    dia: number;               // 0..4 = lunes..viernes de la semana visible
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
const HORAS = 5;

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
    private readonly tramitesSvc = inject(TramitesService);
    private readonly notificacionesSvc = inject(NotificacionesService);

    readonly estadisticas = signal<StatCard[]>([
        { label: 'Expedientes Activos', valor: 0, detalle: 'Cargando...', tono: '' },
        { label: 'Audiencias Proximas', valor: 0, detalle: 'Cargando...', tono: '' },
        { label: 'Tramites Pendientes', valor: 0, detalle: 'Cargando...', tono: '' },
        { label: 'Notificaciones OJ', valor: 0, detalle: 'Cargando...', tono: '' }
    ]);
    private readonly eventosRaw = signal<Evento[]>([]);

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

    readonly rangoAgenda = computed(() => this.formatoRango(this.diasSemana));

    /* Eventos posicionados una sola vez (misma fórmula de dashboard.js). */
    private readonly eventosVisuales = computed<readonly EventoVisual[]>(() => {
        return this.eventosRaw().map(evento => {
            const inicio = this.horaEnMinutos(evento.horaInicio);
            const fin = evento.horaFin ? this.horaEnMinutos(evento.horaFin) : inicio + 60;
            const rangoTotal = HORAS * 60;
            const fechaEvento = new Date(evento.fecha);
            const diaSemana = (fechaEvento.getDay() + 6) % 7;

            let alto = ((fin - inicio) / rangoTotal) * 100;
            if (alto < 10) alto = 10;

            return {
                id: evento.id,
                titulo: evento.titulo,
                tipoEvento: evento.tipoEvento,
                dia: diaSemana,
                horaInicio: evento.horaInicio,
                horaFin: evento.horaFin ?? `${String(inicio + 60).padStart(2, '0')}:00`,
                ubicacion: evento.ubicacion ?? '',
                noExpediente: evento.noExpediente,
                cliente: evento.cliente,
                prioridad: evento.prioridad,
                colorEvento: evento.colorEvento,
                arriba: Math.max(((inicio - HORA_INICIO * 60) / rangoTotal) * 100, 0),
                alto,
                outline: !evento.colorEvento
            };
        });
    });

    ngOnInit(): void {
        const fechaStr = this.formatoFechaISO(this.lunes);
        this.eventosSvc.obtenerDelDia(fechaStr).subscribe({
            next: (datos) => { this.eventosRaw.set(datos); },
            error: () => { this.eventosRaw.set([]); }
        });
        this.cargarEstadisticas();
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
