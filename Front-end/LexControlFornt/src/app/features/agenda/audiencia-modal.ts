import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AudienciasService } from '../../core/services/audiencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { AudienciaCrear } from '../../core/models/audiencia.model';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-audiencia-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './audiencia-modal.html'
})
export class AudienciaModal implements OnInit {
    @Output() cerrar = new EventEmitter<void>();
    @Output() creado = new EventEmitter<void>();

    private readonly audienciasSvc = inject(AudienciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly guardando = signal(false);
    protected readonly tipos = signal<{ id: number; nombre: string }[]>([]);
    protected readonly estados = signal<{ id: number; nombre: string }[]>([]);
    protected readonly juzgados = signal<{ id: number; nombre: string }[]>([]);

    protected formulario: AudienciaCrear = {
        expedienteId: 0,
        tipoId: 0,
        fecha: '',
        horaInicio: '',
        horaFin: null,
        juzgadoId: 0,
        sala: null,
        estadoId: 0,
        descripcionResultado: null,
        proximaActuacion: null,
        notas: null,
        documentos: null
    };

    ngOnInit(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_AUDIENCIA').subscribe({
            next: (datos) => this.tipos.set(datos.items.map(i => ({ id: i.id, nombre: i.nombre })))
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_AUDIENCIA').subscribe({
            next: (datos) => this.estados.set(datos.items.map(i => ({ id: i.id, nombre: i.nombre })))
        });
        this.catalogosSvc.buscarJuzgados().subscribe({
            next: (datos) => this.juzgados.set(datos.items.map(j => ({ id: j.id, nombre: j.nombre })))
        });

        const hoy = new Date();
        this.formulario.fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    }

    alCerrar(): void {
        this.cerrar.emit();
    }

    alEnviar(): void {
        if (!this.formulario.expedienteId || !this.formulario.tipoId ||
            !this.formulario.fecha || !this.formulario.horaInicio ||
            !this.formulario.juzgadoId || !this.formulario.estadoId) {
        this.toast.mostrar('Complete todos los campos obligatorios.', 3000);
        return;
    }

    this.guardando.set(true);
    this.audienciasSvc.crear(this.formulario).subscribe({
        next: () => {
            this.toast.mostrar('Audiencia creada exitosamente.', 2600);
            this.creado.emit();
        },
        error: () => {
            this.toast.mostrar('Error al crear la audiencia.', 3000);
            this.guardando.set(false);
            }
        });
    }
}
