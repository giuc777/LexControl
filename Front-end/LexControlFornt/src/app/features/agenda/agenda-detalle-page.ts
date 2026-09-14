import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AudienciasService } from '../../core/services/audiencias-service';
import { AudienciaDetalle, AudienciaResultado } from '../../core/models/audiencia.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-agenda-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader],
    templateUrl: './agenda-detalle-page.html'
})
export class AgendaDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly audienciasSvc = inject(AudienciasService);
    private readonly toast = inject(ToastService);

    protected readonly audiencia = signal<AudienciaDetalle | null>(null);
    protected readonly cargando = signal(true);
    protected readonly registrandoResultado = signal(false);

    protected resultadoSeleccionado = 0;
    protected descripcionResultado = '';
    protected proximaActuacion = '';

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.cargarDetalle(id);
    }

    cargarDetalle(id: number): void {
        this.cargando.set(true);
        this.audienciasSvc.obtenerPorId(id).subscribe({
            next: (datos) => { this.audiencia.set(datos); this.cargando.set(false); },
            error: () => {
                this.toast.mostrar('Error al cargar la audiencia.', 3000);
                this.cargando.set(false);
            }
        });
    }

    irAVolver(): void {
        this.router.navigate(['/agenda']);
    }

    abrirRegistroResultado(): void {
        this.registrandoResultado.set(true);
    }

    cancelarResultado(): void {
        this.registrandoResultado.set(false);
        this.descripcionResultado = '';
        this.proximaActuacion = '';
    }

    guardarResultado(): void {
        const id = this.audiencia()?.id;
        if (!id || !this.resultadoSeleccionado || !this.descripcionResultado.trim()) {
            this.toast.mostrar('Complete todos los campos obligatorios.', 3000);
            return;
        }

        const dto: AudienciaResultado = {
            resultadoId: this.resultadoSeleccionado,
            descripcionResultado: this.descripcionResultado.trim(),
            proximaActuacion: this.proximaActuacion.trim() || null
        };

        this.audienciasSvc.registrarResultado(id, dto).subscribe({
            next: () => {
                this.toast.mostrar('Resultado registrado exitosamente.', 2600);
                this.registrandoResultado.set(false);
                this.cargarDetalle(id);
            },
            error: () => {
                this.toast.mostrar('Error al registrar el resultado.', 3000);
            }
        });
    }

    esPendiente(): boolean {
        const estado = this.audiencia()?.estado;
        return estado === 'Programada' || estado === 'Reprogramada';
    }
}
