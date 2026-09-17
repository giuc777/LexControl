import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    inject,
    signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NotificacionesService } from '../../core/services/notificaciones-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import {
    NotificacionActualizar,
    NotificacionCrear,
    NotificacionDetalle,
    NotificacionDuplicado
} from '../../core/models/notificacion.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-notificacion-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './notificacion-modal.html'
})
export class NotificacionModal implements OnInit {
    @Input() expedientes: { id: number; noExpediente: string }[] = [];
    @Input() juzgados: { id: number; nombre: string }[] = [];
    /** Si se recibe una notificación, el modal entra en modo edición. */
    @Input() notificacion: NotificacionDetalle | null = null;
    @Output() cerrar = new EventEmitter<void>();
    @Output() alGuardar = new EventEmitter<void>();

    private readonly notificacionesSvc = inject(NotificacionesService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly tiposNotificacion = signal<CatalogoItem[]>([]);
    protected readonly estadosNotificacion = signal<CatalogoItem[]>([]);

    protected readonly esEdicion = signal(false);

    protected readonly expedienteId = signal<number>(0);
    protected readonly juzgadoId = signal<number>(0);
    protected readonly fechaRecepcion = signal<string>(new Date().toISOString().split('T')[0]);
    protected readonly tipoId = signal<number>(0);
    protected readonly contenido = signal<string>('');
    protected readonly resumen = signal<string>('');
    protected readonly estadoId = signal<number>(0);
    protected readonly numeroExpedienteOj = signal<string>('');
    protected readonly numeroResolucion = signal<string>('');
    protected readonly esResolucion = signal<boolean>(false);
    protected readonly favorable = signal<boolean | null>(null);
    protected readonly notas = signal<string>('');

    protected readonly archivoPdf = signal<File | null>(null);
    protected readonly nombreArchivoPdf = signal<string>('');

    protected readonly guardando = signal(false);
    protected readonly verificando = signal(false);
    protected readonly confirmadoDuplicado = signal(false);
    protected readonly duplicados = signal<NotificacionDuplicado[]>([]);

    ngOnInit(): void {
        this.cargarCatalogos();
        if (this.notificacion) {
            this.esEdicion.set(true);
            this.precargar(this.notificacion);
        }
    }

    cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_NOTIFICACION_OJ').subscribe({
            next: (data) => { this.tiposNotificacion.set(data.items); }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_NOTIFICACION_OJ').subscribe({
            next: (data) => {
                this.estadosNotificacion.set(data.items);
                if (!this.esEdicion()) {
                    const primerEstado = data.items.find(e => e.nombre === 'Pendiente') ?? data.items[0];
                    if (primerEstado) this.estadoId.set(primerEstado.id);
                }
            }
        });
    }

    private precargar(n: NotificacionDetalle): void {
        this.expedienteId.set(n.expedienteId);
        this.juzgadoId.set(n.juzgadoId);
        this.fechaRecepcion.set(n.fechaRecepcion);
        this.tipoId.set(n.tipoId);
        this.contenido.set(n.contenido ?? '');
        this.resumen.set(n.resumen ?? '');
        this.estadoId.set(n.estadoId);
        this.numeroExpedienteOj.set(n.numeroExpedienteOj ?? '');
        this.numeroResolucion.set(n.numeroResolucion ?? '');
        this.esResolucion.set(n.esResolucion);
        this.favorable.set(n.favorable);
        this.notas.set(n.notas ?? '');
        if (n.pdfRuta) this.nombreArchivoPdf.set(n.pdfRuta);
    }

    onCerrar(): void { this.cerrar.emit(); }

    onArchivoPdf(event: Event): void {
        const input = event.target as HTMLInputElement;
        const archivo = input.files?.[0];
        if (!archivo) return;

        const extension = archivo.name.substring(archivo.name.lastIndexOf('.')).toLowerCase();
        const permitidos = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
        if (!permitidos.includes(extension)) {
            this.toast.mostrar('Tipo de archivo no permitido. Solo se aceptan PDF, Word, JPG, PNG y TXT.', 3000);
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const buffer = new Uint8Array(reader.result as ArrayBuffer);
            if (!this.validarMagicBytes(buffer, extension)) {
                this.toast.mostrar(`El contenido del archivo no coincide con la extension ${extension} indicada.`, 3000);
                input.value = '';
                return;
            }
            this.archivoPdf.set(archivo);
            this.nombreArchivoPdf.set(archivo.name);
        };
        reader.readAsArrayBuffer(archivo.slice(0, 8));
    }

    quitarPdf(): void {
        this.archivoPdf.set(null);
        this.nombreArchivoPdf.set('');
    }

    private validarMagicBytes(buffer: Uint8Array, extension: string): boolean {
        if (buffer.length < 4) return false;
        switch (extension) {
            case '.pdf':
                return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
            case '.doc':
                return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
            case '.docx':
                return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
            case '.jpg':
            case '.jpeg':
                return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
            case '.png':
                return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
            case '.txt':
                return true;
            default:
                return false;
        }
    }

    /** Verificación manual de duplicados (botón). */
    verificarDuplicados(): void {
        if (!this.expedienteId()) {
            this.toast.mostrar('Seleccione un expediente para verificar duplicados.', 3000);
            return;
        }
        this.verificando.set(true);
        this.consultarDuplicados().subscribe({
            next: (duplicados) => {
                this.duplicados.set(duplicados);
                this.verificando.set(false);
                if (duplicados.length === 0) {
                    this.toast.mostrar('No se encontraron duplicados.', 3000);
                } else {
                    this.confirmadoDuplicado.set(true);
                    this.toast.mostrar(`Se encontraron ${duplicados.length} posible(s) duplicado(s).`, 5000);
                }
            },
            error: () => {
                this.verificando.set(false);
                this.toast.mostrar('No se pudo verificar duplicados.', 3000);
            }
        });
    }

    guardar(): void {
        if (!this.expedienteId() || !this.juzgadoId() || !this.tipoId() || !this.fechaRecepcion()) {
            this.toast.mostrar('Complete los campos obligatorios.', 3000);
            return;
        }

        // Verificación automática de duplicados solo al crear.
        if (!this.esEdicion() && !this.confirmadoDuplicado()) {
            this.guardando.set(true);
            this.consultarDuplicados().subscribe({
                next: (duplicados) => {
                    this.guardando.set(false);
                    if (duplicados.length > 0) {
                        this.duplicados.set(duplicados);
                        this.confirmadoDuplicado.set(true);
                        this.toast.mostrar(
                            `Se encontraron ${duplicados.length} posible(s) duplicado(s). Pulse Guardar de nuevo para continuar.`,
                            5000);
                        return;
                    }
                    this.guardarReal();
                },
                error: () => { this.guardando.set(false); this.guardarReal(); }
            });
            return;
        }

        this.guardarReal();
    }

    private consultarDuplicados() {
        return this.notificacionesSvc.verificarDuplicado({
            expedienteId: this.expedienteId(),
            numeroResolucion: this.numeroResolucion() || null,
            numeroExpedienteOj: this.numeroExpedienteOj() || null
        });
    }

    private guardarReal(): void {
        this.guardando.set(true);

        const actual = this.notificacion;
        if (this.esEdicion() && actual) {
            const dto: NotificacionActualizar = {
                juzgadoId: this.juzgadoId(),
                fechaRecepcion: this.fechaRecepcion(),
                tipoId: this.tipoId(),
                contenido: this.contenido() || null,
                resumen: this.resumen() || null,
                estadoId: this.estadoId(),
                numeroExpedienteOj: this.numeroExpedienteOj() || null,
                pdfRuta: null,
                notas: this.notas() || null,
                esResolucion: this.esResolucion(),
                numeroResolucion: this.numeroResolucion() || null,
                favorable: this.favorable()
            };
            this.notificacionesSvc.actualizar(actual.id, dto).subscribe({
                next: () => this.subirPdfSiHay(actual.id),
                error: () => {
                    this.toast.mostrar('Error al actualizar la notificacion.', 3000);
                    this.guardando.set(false);
                }
            });
            return;
        }

        const dto: NotificacionCrear = {
            expedienteId: this.expedienteId(),
            juzgadoId: this.juzgadoId(),
            fechaRecepcion: this.fechaRecepcion(),
            tipoId: this.tipoId(),
            contenido: this.contenido() || null,
            resumen: this.resumen() || null,
            estadoId: this.estadoId(),
            numeroExpedienteOj: this.numeroExpedienteOj() || null,
            pdfRuta: null,
            duplicadoDeId: null,
            notas: this.notas() || null,
            esResolucion: this.esResolucion(),
            numeroResolucion: this.numeroResolucion() || null,
            favorable: this.favorable()
        };
        this.notificacionesSvc.crear(dto).subscribe({
            next: (id) => this.subirPdfSiHay(id),
            error: () => {
                this.toast.mostrar('Error al crear la notificacion.', 3000);
                this.guardando.set(false);
            }
        });
    }

    private subirPdfSiHay(id: number): void {
        const archivo = this.archivoPdf();
        if (!archivo) {
            this.finalizar();
            return;
        }
        this.notificacionesSvc.subirPdf(id, archivo).subscribe({
            next: () => this.finalizar(),
            error: () => {
                this.toast.mostrar('La notificacion se guardo, pero el PDF no se pudo subir.', 4000);
                this.finalizar();
            }
        });
    }

    private finalizar(): void {
        this.guardando.set(false);
        this.toast.mostrar(
            this.esEdicion() ? 'Notificacion actualizada correctamente.' : 'Notificacion creada correctamente.',
            3000);
        this.alGuardar.emit();
    }
}