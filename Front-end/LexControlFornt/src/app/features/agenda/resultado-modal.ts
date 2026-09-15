import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Modal } from '../../shared/components/modal/modal';
import { AudienciasService } from '../../core/services/audiencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
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
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly guardando = signal(false);
    protected readonly error = signal('');
    protected readonly resultados = signal<{ id: number; nombre: string; color: string }[]>([]);

    protected resultadoSeleccionado = 0;
    protected descripcionResultado = '';
    protected proximaActuacion = '';

    ngOnInit(): void {
        this.catalogosSvc.buscarCatalogo('RESULTADO_AUDIENCIA').subscribe({
            next: (datos) => this.resultados.set(
                datos.items.map(i => ({ id: i.id, nombre: i.nombre, color: i.color ?? '#6c757d' }))
            )
        });
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
        const dto: AudienciaResultado = {
            resultadoId: this.resultadoSeleccionado,
            descripcionResultado: this.descripcionResultado.trim(),
            proximaActuacion: this.proximaActuacion.trim() || null
        };

        this.audienciasSvc.registrarResultado(this.audiencia().id, dto).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toast.mostrar('Resultado registrado exitosamente.', 2600);
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
