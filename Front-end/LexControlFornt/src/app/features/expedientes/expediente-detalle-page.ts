import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ExpedientesService } from '../../core/services/expedientes-service';
import { DocumentosService } from '../../core/services/documentos-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ToastService } from '../../layout/toast/toast-service';
import {
    DocExpediente,
    ExpedienteActualizarDto,
    ExpedienteCrearDto,
    ExpedienteDetalle,
    NotaExpediente,
    ParteProcesal
} from '../../core/models/expediente.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { Modal } from '../../shared/components/modal/modal';
import { ExpedienteModal } from './expediente-modal';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
    selector: 'app-expediente-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, FormsModule, Modal, ExpedienteModal],
    templateUrl: './expediente-detalle-page.html'
})
export class ExpedienteDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly documentosSvc = inject(DocumentosService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toastSvc = inject(ToastService);

    protected readonly expediente = signal<ExpedienteDetalle | null>(null);
    protected readonly partes = signal<ParteProcesal[]>([]);
    protected readonly notas = signal<NotaExpediente[]>([]);
    protected readonly documentos = signal<DocExpediente[]>([]);
    protected readonly cargando = signal(true);

    protected rolesProcesales: CatalogoItem[] = [];

    // Modales
    protected readonly modalNotaAbierto = signal(false);
    protected readonly modalParteAbierto = signal(false);
    protected readonly modalUploadAbierto = signal(false);
    protected readonly modalEditarAbierto = signal(false);

    private expedienteId = 0;

    ngOnInit(): void {
        this.expedienteId = Number(this.route.snapshot.paramMap.get('id'));
        if (!this.expedienteId) {
            this.router.navigate(['/expedientes']);
            return;
        }
        this.cargarDetalle();
        this.cargarPartes();
        this.cargarNotas();
        this.cargarDocumentos();
    }

    formatearFecha(iso: string | null): string {
        if (!iso) return '—';
        const partes = iso.split('T')[0].split('-');
        if (partes.length !== 3) return iso;
        return `${parseInt(partes[2], 10)} ${MESES_CORTO[parseInt(partes[1], 10) - 1]} ${partes[0]}`;
    }

    formatearTamano(bytes: number | null): string {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    tipoIcono(tipo: string): string {
        const t = (tipo ?? '').toUpperCase();
        if (t === 'PDF') return 'pdf';
        if (t === 'WORD' || t === 'DOC' || t === 'DOCX') return 'word';
        if (t === 'IMAGEN' || t === 'JPG' || t === 'JPEG' || t === 'PNG') return 'imagen';
        return 'otro';
    }

    descargarDocumento(ruta: string): void {
        window.open(this.documentosSvc.descargar(ruta), '_blank');
    }

    eliminarDocumento(doc: DocExpediente): void {
        if (!confirm(`Eliminar el documento "${doc.nombreArchivo}"?`)) return;
        this.documentosSvc.eliminar(doc.id).subscribe({
            next: () => this.cargarDocumentos()
        });
    }

    // ── Editar ───────────────────────────────────────────────

    abrirModalEditar(): void {
        this.modalEditarAbierto.set(true);
    }

    cerrarModalEditar(): void {
        this.modalEditarAbierto.set(false);
    }

    alGuardarEdicion(datos: ExpedienteCrearDto | ExpedienteActualizarDto): void {
        if ('noExpediente' in datos) {
            this.expedientesSvc.crear(datos as ExpedienteCrearDto).subscribe({
                next: () => {
                    this.cerrarModalEditar();
                    this.cargarDetalle();
                    this.cargarPartes();
                    this.cargarNotas();
                    this.cargarDocumentos();
                }
            });
        } else {
            this.expedientesSvc.actualizar(this.expedienteId, datos as ExpedienteActualizarDto).subscribe({
                next: () => {
                    this.cerrarModalEditar();
                    this.cargarDetalle();
                    this.cargarPartes();
                    this.cargarNotas();
                    this.cargarDocumentos();
                }
            });
        }
    }

    // ── Notas ────────────────────────────────────────────────

    abrirModalNota(): void {
        this.modalNotaAbierto.set(true);
    }

    cerrarModalNota(): void {
        this.modalNotaAbierto.set(false);
    }

    alGuardarNota(contenido: string): void {
        if (!contenido.trim()) return;
        this.expedientesSvc.crearNota(this.expedienteId, {
            contenido: contenido.trim(),
            etiquetaId: null,
            fijado: false,
            prioritario: false
        }).subscribe({
            next: () => {
                this.cerrarModalNota();
                this.cargarNotas();
            }
        });
    }

    eliminarNota(nota: NotaExpediente): void {
        if (!confirm('Eliminar esta nota?')) return;
        this.expedientesSvc.eliminarNota(nota.id).subscribe({
            next: () => this.cargarNotas()
        });
    }

    // ── Partes ───────────────────────────────────────────────

    abrirModalParte(): void {
        this.cargarCatalogos();
        this.modalParteAbierto.set(true);
    }

    cerrarModalParte(): void {
        this.modalParteAbierto.set(false);
    }

    alGuardarParte(datos: { tipo: string; nombreCompleto: string; dpi: string | null; telefono: string | null; abogadoDefensor: string | null; rol: string | null; descripcion: string | null }): void {
        this.expedientesSvc.crearParte(this.expedienteId, datos).subscribe({
            next: () => {
                this.cerrarModalParte();
                this.cargarPartes();
            }
        });
    }

    eliminarParte(parte: ParteProcesal): void {
        if (!confirm(`Eliminar la parte "${parte.nombreCompleto}"?`)) return;
        this.expedientesSvc.eliminarParte(parte.id).subscribe({
            next: () => this.cargarPartes()
        });
    }

    // ── Upload ───────────────────────────────────────────────

    abrirModalUpload(): void {
        this.modalUploadAbierto.set(true);
    }

    cerrarModalUpload(): void {
        this.modalUploadAbierto.set(false);
    }

    alSubirArchivo(archivo: File): void {
        if (!archivo) return;

        const extension = archivo.name.substring(archivo.name.lastIndexOf('.')).toLowerCase();
        const permitidos = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
        if (!permitidos.includes(extension)) {
            this.toastSvc.mostrar('Tipo de archivo no permitido. Solo se aceptan PDF, Word, JPG, PNG y TXT.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const buffer = new Uint8Array(reader.result as ArrayBuffer);
            if (!this.validarMagicBytes(buffer, extension)) {
                this.toastSvc.mostrar(`El contenido del archivo no coincide con la extension ${extension} indicada.`);
                return;
            }
            this.documentosSvc.subir(this.expedienteId, archivo, null).subscribe({
                next: () => {
                    this.cerrarModalUpload();
                    this.cargarDocumentos();
                }
            });
        };
        reader.readAsArrayBuffer(archivo.slice(0, 8));
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

    // ── Carga de datos ───────────────────────────────────────

    private cargarDetalle(): void {
        this.expedientesSvc.obtenerPorId(this.expedienteId).subscribe({
            next: exp => {
                this.expediente.set(exp);
                this.cargando.set(false);
            },
            error: () => this.router.navigate(['/expedientes'])
        });
    }

    private cargarPartes(): void {
        this.expedientesSvc.listarPartes(this.expedienteId).subscribe({
            next: partes => this.partes.set(partes)
        });
    }

    private cargarNotas(): void {
        this.expedientesSvc.listarNotas(this.expedienteId).subscribe({
            next: notas => this.notas.set(notas)
        });
    }

    private cargarDocumentos(): void {
        this.documentosSvc.listar(this.expedienteId).subscribe({
            next: docs => this.documentos.set(docs)
        });
    }

    private cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('ROL_PROCESAL', { tamanoPagina: 500 }).subscribe({
            next: resp => this.rolesProcesales = resp.items,
            error: () => this.rolesProcesales = []
        });
    }
}
