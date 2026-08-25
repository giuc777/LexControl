import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

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
   MOCK: las estadísticas son semillas del prototipo; la agenda semanal se
   dibuja vacía pendiente de conectar /api/eventos y /api/reportes (fase 2). */
const ESTADISTICAS_SEED: readonly StatCard[] = [
    { label: 'Expedientes Activos', valor: 8, detalle: '+2 este mes', tono: '' },
    { label: 'Audiencias Próximas', valor: 3, detalle: 'Próxima: Mañana', tono: '' },
    { label: 'Trámites Pendientes', valor: 5, detalle: '3 críticos', tono: 'warn' },
    { label: 'Notificaciones OJ', valor: 2, detalle: 'Urgente', tono: 'danger' }
];

const EVENTOS_SEED: readonly EventoAgenda[] = [
    {
        id: 1,
        titulo: 'Caso C-2025-0012 · Laboral',
        tipoEvento: 'Audiencia',
        dia: 0,
        horaInicio: '08:00',
        horaFin: '09:00',
        ubicacion: 'Sala 4, Torre de Justicia',
        noExpediente: 'C-2025-0012',
        cliente: 'Carlos Morales Ortiz',
        prioridad: 1,
        colorEvento: '#B2845A'
    },
    {
        id: 2,
        titulo: 'Reunión Clientes',
        tipoEvento: 'Cita',
        dia: 2,
        horaInicio: '10:00',
        horaFin: '11:30',
        ubicacion: 'Oficina - Panajachel',
        noExpediente: null,
        cliente: null,
        prioridad: 0,
        colorEvento: null
    }
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
export class DashboardPage {
    private readonly router = inject(Router);

    readonly estadisticas = ESTADISTICAS_SEED;

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
    private readonly eventosVisuales: readonly EventoVisual[] = EVENTOS_SEED.map(evento => {
        const inicio = this.horaEnMinutos(evento.horaInicio);
        const fin = this.horaEnMinutos(evento.horaFin);
        const rangoTotal = HORAS * 60;

        let alto = ((fin - inicio) / rangoTotal) * 100;
        if (alto < 10) alto = 10;

        return {
            ...evento,
            arriba: Math.max(((inicio - HORA_INICIO * 60) / rangoTotal) * 100, 0),
            alto,
            outline: !evento.colorEvento
        };
    });

    eventosDeDia(dia: number): readonly EventoVisual[] {
        return this.eventosVisuales.filter(evento => evento.dia === dia);
    }

    irAExpedientes(): void {
        this.router.navigateByUrl('/expedientes');
    }

    /* El prototipo navega a agenda-detalle.html?id=N; la ruta de detalle
       llega en fase 5, por ahora se lleva al módulo de Agenda. */
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
}
