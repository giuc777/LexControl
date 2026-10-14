import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Modal } from '../../shared/components/modal/modal';
import { AudienciasService } from '../../core/services/audiencias-service';
import { ToastService } from '../../layout/toast/toast-service';
import { AudienciaDetalle, AudienciaResultado } from '../../core/models/audiencia.model';

@Component({
    selector: 'app-resultado-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Modal],
    templateUrl: './resultado-modal.html'
})
export class ResultadoModal implements OnInit {
    @Output() cerrar = new EventEmitter<void>();
    @Output() registrado = new EventEmitter<void>();

    readonly audiencia = input.required<AudienciaDetalle>();

    private readonly audienciasSvc = inject(AudienciasService);
    private readonly toast = inject(ToastService);

    protected readonly guardando = signal(false);
    protected readonly error = signal('');

    protected descripcionResultado = '';
    protected proximaActuacion = '';

    ngOnInit(): void {
        const aud = this.audiencia();
        this.descripcionResultado = aud.descripcionResultado ?? '';
        this.proximaActuacion = aud.proximaActuacion ?? '';
    }

    get esEdicion(): boolean {
        const aud = this.audiencia();
        return !!aud.resultadoId || !!aud.descripcionResultado;
    }

    alCerrar(): void {
        this.cerrar.emit();
    }

    alEnviar(evento: Event): void {
        evento.preventDefault();
        this.error.set('');

        if (!this.descripcionResultado.trim()) {
            this.error.set('La descripción del resultado es obligatoria.');
            return;
        }

        this.guardando.set(true);
        const dto: AudienciaResultado = {
            // Resultado "por escrito": sin vinculo al catalogo RESULTADO_AUDIENCIA.
            resultadoId: null,
            descripcionResultado: this.descripcionResultado.trim(),
            proximaActuacion: this.proximaActuacion.trim() || null
        };

        this.audienciasSvc.registrarResultado(this.audiencia().id, dto).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toast.mostrar(
                    this.esEdicion ? 'Resultado actualizado exitosamente.' : 'Resultado registrado exitosamente.',
                    2600
                );
                this.registrado.emit();
            },
            error: () => {
                this.guardando.set(false);
                this.error.set('Error al registrar el resultado.');
                this.toast.mostrar(this.error(), 3000);
            }
        });
    }
}
