import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AudienciasService } from '../../core/services/audiencias-service';
import { Audiencia } from '../../core/models/audiencia.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { AudienciaModal } from './audiencia-modal';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const COLORES_ESTADO: Record<string, string> = {
    'Programada': '#3498db',
    'Realizada': '#2ecc71',
    'Cancelada': '#e74c3c',
    'Reprogramada': '#f39c12'
};

@Component({
    selector: 'app-agenda-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, AudienciaModal],
    templateUrl: './agenda-page.html'
})
export class AgendaPage implements OnInit {
    private readonly audienciasSvc = inject(AudienciasService);
    private readonly router = inject(Router);

    protected readonly DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    protected readonly audiencias = signal<Audiencia[]>([]);
    protected readonly cargando = signal(false);
    protected readonly modalAbierto = signal(false);

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

    protected readonly eventosDelDia = computed(() => {
        const dia = this.diaSeleccionado();
        const mes = this.mesActual();
        const anio = this.anioActual();
        const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        return this.audiencias().filter(a => a.fecha === fechaStr);
    });

    ngOnInit(): void {
        this.cargarAudiencias();
    }

    cargarAudiencias(): void {
        this.cargando.set(true);
        const anio = this.anioActual();
        const mes = this.mesActual();
        const fechaInicio = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
        const fechaFin = `${anio}-${String(mes + 1).padStart(2, '0')}-${new Date(anio, mes + 1, 0).getDate()}`;

        this.audienciasSvc.listar({ fechaInicio, fechaFin }).subscribe({
            next: (datos) => { this.audiencias.set(datos); this.cargando.set(false); },
            error: () => { this.audiencias.set([]); this.cargando.set(false); }
        });
    }

    seleccionarDia(dia: number): void {
        if (dia > 0) this.diaSeleccionado.set(dia);
    }

    mesAnterior(): void {
        if (this.mesActual() === 0) {
            this.mesActual.set(11);
            this.anioActual.update(a => a - 1);
        } else {
            this.mesActual.update(m => m - 1);
        }
        this.diaSeleccionado.set(1);
        this.cargarAudiencias();
    }

    mesSiguiente(): void {
        if (this.mesActual() === 11) {
            this.mesActual.set(0);
            this.anioActual.update(a => a + 1);
        } else {
            this.mesActual.update(m => m + 1);
        }
        this.diaSeleccionado.set(1);
        this.cargarAudiencias();
    }

    irADetalle(id: number): void {
        this.router.navigate(['/agenda', id]);
    }

    colorEstado(estado: string): string {
        return COLORES_ESTADO[estado] ?? '#6c757d';
    }

    formatearHora(hora: string): string {
        if (!hora) return '';
        const partes = hora.split(':');
        if (partes.length >= 2) return `${partes[0]}:${partes[1]}`;
        return hora;
    }

    abrirModal(): void {
        this.modalAbierto.set(true);
    }

    cerrarModal(): void {
        this.modalAbierto.set(false);
    }

    alCrearAudiencia(): void {
        this.cerrarModal();
        this.cargarAudiencias();
    }
}
