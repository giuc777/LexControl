import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Modal } from '../../shared/components/modal/modal';
import { AudienciasService } from '../../core/services/audiencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { AudienciaActualizar, AudienciaDetalle } from '../../core/models/audiencia.model';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-audiencia-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Modal],
    templateUrl: './audiencia-modal.html'
})
export class AudienciaModal implements OnInit {
    /** Si se recibe una audiencia, el modal entra en modo edición. */
    @Input() audiencia: AudienciaDetalle | null = null;
    @Output() cerrar = new EventEmitter<void>();
    @Output() guardado = new EventEmitter<void>();

    private readonly audienciasSvc = inject(AudienciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly toast = inject(ToastService);

    protected readonly guardando = signal(false);
    protected readonly error = signal('');
    protected readonly expedientes = signal<{ id: number; noExpediente: string; cliente: string }[]>([]);
    protected readonly tipos = signal<{ id: number; nombre: string }[]>([]);
    protected readonly estados = signal<{ id: number; nombre: string }[]>([]);
    protected readonly juzgados = signal<{ id: number; nombre: string }[]>([]);

    protected expedienteId = 0;
    protected tipoId = 0;
    protected tipoTexto = '';
    protected estadoId = 0;
    protected fecha = '';
    protected horaInicio = '';
    protected horaFin = '';
    protected juzgadoId = 0;
    protected juzgadoTexto = '';
    protected sala = '';
    protected notas = '';

    /** Valor reservado del select para "Otro (escribir…)". */
    protected readonly valorOtro = -1;

    protected get esEdicion(): boolean {
        return this.audiencia !== null;
    }

    protected esOtro(valor: number | string): boolean {
        return Number(valor) === this.valorOtro;
    }

    ngOnInit(): void {
        if (this.audiencia) this.precargar(this.audiencia);

        this.expedientesSvc.listarParaSeleccion().subscribe({
            next: (items) => {
                const opciones = items.map(e => ({
                    id: e.id,
                    noExpediente: e.noExpediente,
                    cliente: e.cliente
                }));
                // En edición, si el expediente actual quedó archivado, se
                // conserva en el select para no perder el valor ya asignado.
                const aud = this.audiencia;
                if (aud && !opciones.some(o => o.id === aud.expedienteId)) {
                    opciones.unshift({
                        id: aud.expedienteId,
                        noExpediente: aud.noExpediente,
                        cliente: aud.cliente ?? ''
                    });
                }
                this.expedientes.set(opciones);
            }
        });

        // En edición se incluyen inactivos para que el valor ya asignado
        // (estado o tipo fuera de uso) siga visible en el select.
        const incluirInactivos = this.audiencia !== null;

        this.catalogosSvc.buscarCatalogo('TIPO_AUDIENCIA', { incluirInactivos }).subscribe({
            next: (datos) => {
                const items = datos.items.map(i => ({ id: i.id, nombre: i.nombre }));
                this.tipos.set(items);
                this.fallbackOtroSiAusente(items, this.audiencia?.tipoId, this.audiencia?.tipo,
                    (texto) => { this.tipoId = this.valorOtro; this.tipoTexto = texto; });
            }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_AUDIENCIA', { incluirInactivos }).subscribe({
            next: (datos) => {
                const items = datos.items.map(i => ({ id: i.id, nombre: i.nombre }));
                if (this.audiencia && !items.some(i => i.id === this.audiencia!.estadoId)) {
                    items.push({ id: this.audiencia.estadoId, nombre: this.audiencia.estado });
                }
                this.estados.set(items);
            }
        });
        this.catalogosSvc.buscarJuzgados({ incluirInactivos }).subscribe({
            next: (datos) => {
                const items = datos.items.map(j => ({ id: j.id, nombre: j.nombre }));
                this.juzgados.set(items);
                this.fallbackOtroSiAusente(items, this.audiencia?.juzgadoId, this.audiencia?.juzgado,
                    (texto) => { this.juzgadoId = this.valorOtro; this.juzgadoTexto = texto; });
            },
            error: () => this.juzgados.set([])
        });

        if (!this.fecha) {
            const hoy = new Date();
            this.fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        }
    }

    private precargar(n: AudienciaDetalle): void {
        this.expedienteId = n.expedienteId;
        this.tipoId = n.tipoId > 0 ? n.tipoId : 0;
        this.estadoId = n.estadoId;
        this.fecha = n.fecha;
        this.horaInicio = n.horaInicio;
        this.horaFin = n.horaFin ?? '';
        this.juzgadoId = n.juzgadoId > 0 ? n.juzgadoId : 0;
        this.sala = n.sala ?? '';
        this.notas = n.notas ?? '';
    }

    /** Si el valor actual ya no aparece en el catálogo (fila inactiva o
        eliminada), se captura como "Otro" con su nombre para no perderlo. */
    private fallbackOtroSiAusente(
        items: { id: number; nombre: string }[],
        idActual: number | undefined,
        nombreActual: string | undefined,
        aplicar: (nombre: string) => void
    ): void {
        if (!this.audiencia || !idActual || idActual <= 0) return;
        if (!items.some(i => i.id === idActual) && nombreActual) aplicar(nombreActual);
    }

    alCerrar(): void {
        this.cerrar.emit();
    }

    alEnviar(evento: Event): void {
        evento.preventDefault();
        this.error.set('');

        if (!this.expedienteId) {
            this.error.set('Seleccione un expediente.');
            return;
        }
        const tipoOtro = this.esOtro(this.tipoId);
        const juzgadoOtro = this.esOtro(this.juzgadoId);
        if (tipoOtro ? !this.tipoTexto.trim() : !this.tipoId) {
            this.error.set(tipoOtro
                ? 'Escriba el nuevo tipo de audiencia.'
                : 'Seleccione un tipo de audiencia.');
            return;
        }
        if (!this.estadoId) {
            this.error.set('Seleccione un estado.');
            return;
        }
        if (!this.fecha) {
            this.error.set('La fecha es obligatoria.');
            return;
        }
        if (!this.horaInicio) {
            this.error.set('La hora de inicio es obligatoria.');
            return;
        }
        if (juzgadoOtro ? !this.juzgadoTexto.trim() : !this.juzgadoId) {
            this.error.set(juzgadoOtro
                ? 'Escriba el nuevo juzgado.'
                : 'Seleccione un juzgado.');
            return;
        }

        this.guardando.set(true);
        if (this.audiencia) this.actualizar(tipoOtro, juzgadoOtro);
        else this.crear(tipoOtro, juzgadoOtro);
    }

    private crear(tipoOtro: boolean, juzgadoOtro: boolean): void {
        this.audienciasSvc.crear({
            expedienteId: this.expedienteId,
            tipoId: tipoOtro ? null : this.tipoId,
            tipoTexto: tipoOtro ? this.tipoTexto.trim() : null,
            estadoId: this.estadoId,
            fecha: this.fecha,
            horaInicio: this.horaInicio,
            horaFin: this.horaFin || null,
            juzgadoId: juzgadoOtro ? null : this.juzgadoId,
            juzgadoTexto: juzgadoOtro ? this.juzgadoTexto.trim() : null,
            sala: this.sala.trim() || null,
            descripcionResultado: null,
            proximaActuacion: null,
            notas: this.notas.trim() || null,
            documentos: null
        }).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toast.mostrar('Audiencia creada exitosamente.', 2600);
                this.guardado.emit();
            },
            error: (err: any) => {
                this.guardando.set(false);
                this.error.set(err?.message || 'Error al crear la audiencia.');
                this.toast.mostrar(this.error(), 3000);
            }
        });
    }

    private actualizar(tipoOtro: boolean, juzgadoOtro: boolean): void {
        const original = this.audiencia;
        if (!original) return;

        const dto: AudienciaActualizar = {
            expedienteId: this.expedienteId,
            fecha: this.fecha,
            horaInicio: this.horaInicio,
            horaFin: this.horaFin || null,
            // Si antes había hora fin y ahora el campo está vacío, se limpia.
            quitarHoraFin: !this.horaFin && !!original.horaFin,
            tipoId: tipoOtro ? null : this.tipoId,
            tipoTexto: tipoOtro ? this.tipoTexto.trim() : null,
            juzgadoId: juzgadoOtro ? null : this.juzgadoId,
            juzgadoTexto: juzgadoOtro ? this.juzgadoTexto.trim() : null,
            sala: this.sala.trim(),
            estadoId: this.estadoId,
            notas: this.notas.trim(),
            documentos: null
        };
        this.audienciasSvc.actualizar(original.id, dto).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toast.mostrar('Audiencia actualizada exitosamente.', 2600);
                this.guardado.emit();
            },
            error: (err: any) => {
                this.guardando.set(false);
                this.error.set(err?.message || 'Error al actualizar la audiencia.');
                this.toast.mostrar(this.error(), 3000);
            }
        });
    }
}
