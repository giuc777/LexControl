import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Modal } from '../../shared/components/modal/modal';
import { DiligenciasService } from '../../core/services/diligencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
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
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly guardando = signal(false);
    protected readonly error = signal('');
    protected readonly resultados = signal<{ id: number; nombre: string; color: string }[]>([]);

    protected resultadoSeleccionado = 0;
    protected descripcionResultado = '';

    ngOnInit(): void {
        const d = this.diligencia();
        if (d.resultadoId) {
            this.resultadoSeleccionado = d.resultadoId;
            this.descripcionResultado = d.descripcionResultado ?? '';
        }

        this.catalogosSvc.buscarCatalogo('RESULTADO_DILIGENCIA').subscribe({
            next: (datos) => this.resultados.set(
                datos.items.map(i => ({ id: i.id, nombre: i.nombre, color: i.color ?? '#6c757d' }))
            )
        });
    }

    get esEdicion(): boolean {
        return !!this.diligencia().resultadoId;
    }

    alCerrar(): void {
        this.cerrar.emit();
    }

    alEnviar(evento: Event): void {
        evento.preventDefault();
        this.error.set('');

        if (!this.resultadoSeleccionado) {
            this.error.set('Seleccione un resultado.');
            return;
        }
        if (!this.descripcionResultado.trim()) {
            this.error.set('La descripción del resultado es obligatoria.');
            return;
        }

        this.guardando.set(true);
        const dto: DiligenciaResultado = {
            resultadoId: this.resultadoSeleccionado,
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
