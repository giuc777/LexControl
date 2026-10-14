import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Modal } from '../../shared/components/modal/modal';
import { DiligenciasService } from '../../core/services/diligencias-service';
import { ToastService } from '../../layout/toast/toast-service';
import { DiligenciaDetalle, DiligenciaResultado } from '../../core/models/diligencia.model';

@Component({
    selector: 'app-resultado-diligencia-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Modal],
    templateUrl: './resultado-diligencia-modal.html'
})
export class ResultadoDiligenciaModal implements OnInit {
    @Output() cerrar = new EventEmitter<void>();
    @Output() registrado = new EventEmitter<void>();

    readonly diligencia = input.required<DiligenciaDetalle>();

    private readonly diligenciasSvc = inject(DiligenciasService);
    private readonly toast = inject(ToastService);

    protected readonly guardando = signal(false);
    protected readonly error = signal('');

    protected descripcionResultado = '';

    ngOnInit(): void {
        this.descripcionResultado = this.diligencia().descripcionResultado ?? '';
    }

    get esEdicion(): boolean {
        const d = this.diligencia();
        return !!d.resultadoId || !!d.descripcionResultado;
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
        const dto: DiligenciaResultado = {
            // Resultado "por escrito": sin vinculo al catalogo RESULTADO_DILIGENCIA.
            resultadoId: null,
            descripcionResultado: this.descripcionResultado.trim()
        };

        this.diligenciasSvc.registrarResultado(this.diligencia().id, dto).subscribe({
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
                this.error.set('Error al guardar el resultado.');
                this.toast.mostrar(this.error(), 3000);
            }
        });
    }
}
