import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DiligenciasService } from '../../core/services/diligencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { DiligenciaActualizar, DiligenciaCrear, DiligenciaDetalle } from '../../core/models/diligencia.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-diligencia-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './diligencia-modal.html'
})
export class DiligenciaModal implements OnInit {
    @Input() expedientes: { id: number; noExpediente: string }[] = [];
    @Input() clientes: { id: number; nombre: string }[] = [];
    @Input() fechaInicial: string | null = null;
    /** Si se recibe una diligencia, el modal entra en modo edición. */
    @Input() diligencia: DiligenciaDetalle | null = null;
    @Output() cerrar = new EventEmitter<void>();
    @Output() alGuardar = new EventEmitter<void>();

    private readonly diligenciasSvc = inject(DiligenciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly tiposDiligencia = signal<CatalogoItem[]>([]);
    protected readonly estadosDiligencia = signal<CatalogoItem[]>([]);

    protected readonly expedienteId = signal<number | null>(null);
    protected readonly clienteId = signal<number | null>(null);
    protected readonly tipoId = signal<number>(0);
    protected readonly tipoTexto = signal<string>('');
    protected readonly titulo = signal<string>('');
    protected readonly descripcion = signal<string>('');
    protected readonly fecha = signal<string>(new Date().toISOString().split('T')[0]);
    protected readonly horaInicio = signal<string>('');
    protected readonly diaCompleto = signal<boolean>(false);
    protected readonly ubicacion = signal<string>('');
    protected readonly oficina = signal<string>('');
    protected readonly estadoId = signal<number>(0);
    protected readonly notas = signal<string>('');
    protected readonly tiempoDedicado = signal<string>('');

    protected readonly guardando = signal(false);

    /** Valor reservado del select para "Otro (escribir…)". */
    protected readonly valorOtro = -1;

    protected get esEdicion(): boolean {
        return this.diligencia !== null;
    }

    protected esOtro(valor: number | string): boolean {
        return Number(valor) === this.valorOtro;
    }

    /** Opciones del select de expediente: las recibidas (sin archivados)
        más el expediente actual en edición si quedó fuera de la lista. */
    protected get opcionesExpediente(): { id: number; noExpediente: string }[] {
        const lista = [...this.expedientes];
        const d = this.diligencia;
        if (d?.expedienteId && !lista.some(e => e.id === d.expedienteId)) {
            lista.unshift({ id: d.expedienteId, noExpediente: d.noExpediente ?? `Expediente #${d.expedienteId}` });
        }
        return lista;
    }

    ngOnInit(): void {
        if (this.diligencia) this.precargar();
        else if (this.fechaInicial) this.fecha.set(this.fechaInicial);
        this.cargarCatalogos();
    }

    private precargar(): void {
        const d = this.diligencia;
        if (!d) return;
        this.expedienteId.set(d.expedienteId);
        this.clienteId.set(d.clienteId);
        this.tipoId.set(d.tipoId > 0 ? d.tipoId : 0);
        this.titulo.set(d.titulo);
        this.descripcion.set(d.descripcion ?? '');
        this.fecha.set(d.fecha);
        this.horaInicio.set(d.horaInicio ?? '');
        this.diaCompleto.set(d.diaCompleto);
        this.ubicacion.set(d.ubicacion ?? '');
        this.oficina.set(d.oficina ?? '');
        this.estadoId.set(d.estadoId);
        this.notas.set(d.notas ?? '');
        this.tiempoDedicado.set(d.tiempoDedicado ?? '');
    }

    cargarCatalogos(): void {
        // En edición se incluyen inactivos para que el valor ya asignado
        // siga visible en el select.
        const incluirInactivos = this.diligencia !== null;
        this.catalogosSvc.buscarCatalogo('TIPO_DILIGENCIA', { incluirInactivos }).subscribe({
            next: (data) => {
                this.tiposDiligencia.set(data.items);
                // Si el tipo actual ya no está en el catálogo, se captura
                // como "Otro" con su nombre para no perderlo.
                const d = this.diligencia;
                if (d && d.tipoId > 0 && !data.items.some(i => i.id === d.tipoId)) {
                    this.tipoId.set(this.valorOtro);
                    this.tipoTexto.set(d.tipo);
                }
            }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_DILIGENCIA', { incluirInactivos }).subscribe({
            next: (data) => {
                const items = [...data.items];
                const d = this.diligencia;
                if (d && !items.some(i => i.id === d.estadoId)) {
                    items.push({
                        id: d.estadoId, nombre: d.estado, valor: null, descripcion: null,
                        color: null, orden: 999, activo: false, fechaCreacion: null
                    });
                }
                this.estadosDiligencia.set(items);
                if (!d) {
                    const primerEstado = data.items.find(e => e.nombre === 'Programada')
                        ?? data.items.find(e => e.nombre === 'Pendiente')
                        ?? data.items[0];
                    if (primerEstado) this.estadoId.set(primerEstado.id);
                }
            }
        });
    }

    onCerrar(): void { this.cerrar.emit(); }

    guardar(): void {
        const tipoOtro = this.esOtro(this.tipoId());
        if (!this.titulo().trim() || !this.fecha()) {
            this.toast.mostrar('Complete los campos obligatorios.', 3000);
            return;
        }
        if (!this.clienteId()) {
            this.toast.mostrar('Seleccione un cliente.', 3000);
            return;
        }
        if (tipoOtro && !this.tipoTexto().trim()) {
            this.toast.mostrar('Escriba el nuevo tipo de diligencia.', 3000);
            return;
        }
        this.guardando.set(true);
        if (this.diligencia) this.actualizar(tipoOtro);
        else this.crear(tipoOtro);
    }

    private crear(tipoOtro: boolean): void {
        const dto: DiligenciaCrear = {
            expedienteId: this.expedienteId(),
            clienteId: this.clienteId(),
            tipoId: tipoOtro ? null : (this.tipoId() || null),
            tipoTexto: tipoOtro ? this.tipoTexto().trim() : null,
            titulo: this.titulo().trim(),
            descripcion: this.descripcion() || null,
            fecha: this.fecha(),
            horaInicio: this.horaInicio() || null,
            diaCompleto: this.diaCompleto(),
            ubicacion: this.ubicacion() || null,
            oficina: this.oficina() || null,
            estadoId: this.estadoId(),
            notas: this.notas() || null,
            tiempoDedicado: this.tiempoDedicado() || null,
            recordatorioMinutos: 30
        };
        this.diligenciasSvc.crear(dto).subscribe({
            next: () => {
                this.toast.mostrar('Diligencia creada correctamente.', 3000);
                this.alGuardar.emit();
            },
            error: () => {
                this.toast.mostrar('Error al crear la diligencia.', 3000);
                this.guardando.set(false);
            }
        });
    }

    private actualizar(tipoOtro: boolean): void {
        const original = this.diligencia;
        if (!original) return;
        const dto: DiligenciaActualizar = {
            expedienteId: this.expedienteId(),
            clienteId: this.clienteId(),
            tipoId: tipoOtro ? null : (this.tipoId() || null),
            tipoTexto: tipoOtro ? this.tipoTexto().trim() : null,
            titulo: this.titulo().trim(),
            descripcion: this.descripcion() || null,
            fecha: this.fecha(),
            horaInicio: this.horaInicio() || null,
            diaCompleto: this.diaCompleto(),
            ubicacion: this.ubicacion() || null,
            oficina: this.oficina() || null,
            estadoId: this.estadoId(),
            notas: this.notas() || null,
            tiempoDedicado: this.tiempoDedicado() || null,
            recordatorioMinutos: original.recordatorioMinutos
        };
        this.diligenciasSvc.actualizar(original.id, dto).subscribe({
            next: () => {
                this.toast.mostrar('Diligencia actualizada correctamente.', 3000);
                this.alGuardar.emit();
            },
            error: () => {
                this.toast.mostrar('Error al actualizar la diligencia.', 3000);
                this.guardando.set(false);
            }
        });
    }
}
