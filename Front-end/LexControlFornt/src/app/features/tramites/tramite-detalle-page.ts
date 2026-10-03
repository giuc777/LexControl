import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TramitesService } from '../../core/services/tramites-service';
import { TramiteDetalle, TramiteActualizarEstado, NotaTramite, DocTramite } from '../../core/models/tramite.model';
import { CatalogosService } from '../../core/services/catalogos-service';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Modal } from '../../shared/components/modal/modal';
import { ArchivoVisor, VisorArchivosComponent } from '../../shared/components/visor-archivos/visor-archivos';
import { ToastService } from '../../layout/toast/toast-service';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const EXTENSIONES_PERMITIDAS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];

@Component({
    selector: 'app-tramite-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, Modal, VisorArchivosComponent],
    templateUrl: './tramite-detalle-page.html'
})
export class TramiteDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly tramitesSvc = inject(TramitesService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly tramite = signal<TramiteDetalle | null>(null);
    protected readonly cargando = signal(true);
    protected readonly estadosTramite = signal<CatalogoItem[]>([]);

    protected readonly mostrarFormEstado = signal(false);
    protected readonly nuevoEstadoId = signal<number>(0);
    protected readonly fechaResolucion = signal<string>('');
    protected readonly resumenResolucion = signal<string>('');
    protected readonly cambiando = signal(false);
    protected readonly error = signal('');

    protected readonly notas = signal<NotaTramite[]>([]);
    protected readonly cargandoNotas = signal(false);
    protected readonly modalNotaAbierto = signal(false);
    protected readonly notaContenido = signal('');
    protected readonly guardandoNota = signal(false);
    protected readonly errorNota = signal('');

    protected readonly documentos = signal<DocTramite[]>([]);
    protected readonly cargandoDocumentos = signal(false);
    protected readonly modalUploadAbierto = signal(false);
    protected readonly archivoSeleccionado = signal<File | null>(null);
    protected readonly subiendo = signal(false);
    protected readonly errorArchivo = signal('');
    protected readonly archivoPreview = signal<ArchivoVisor | null>(null);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.cargarDetalle(id);
        this.cargarEstados();
    }

    cargarDetalle(id: number): void {
        this.cargando.set(true);
        this.tramitesSvc.obtenerPorId(id).subscribe({
            next: (datos) => {
                this.tramite.set(datos);
                this.nuevoEstadoId.set(datos.estadoId);
                this.fechaResolucion.set(datos.fechaResolucion ?? '');
                this.resumenResolucion.set(datos.resumenResolucion ?? '');
                this.cargando.set(false);
                this.cargarNotas(id);
                this.cargarDocumentos(id);
            },
            error: () => {
                this.toast.mostrar('Error al cargar el trámite.', 3000);
                this.cargando.set(false);
            }
        });
    }

    cargarEstados(): void {
        this.catalogosSvc.buscarCatalogo('ESTADO_TRAMITE').subscribe({
            next: (data) => { this.estadosTramite.set(data.items); }
        });
    }

    irAVolver(): void {
        this.router.navigate(['/tramites']);
    }

    abrirFormEstado(): void {
        const t = this.tramite();
        if (!t) return;
        this.nuevoEstadoId.set(t.estadoId);
        this.fechaResolucion.set(t.fechaResolucion ?? '');
        this.resumenResolucion.set(t.resumenResolucion ?? '');
        this.error.set('');
        this.mostrarFormEstado.set(true);
    }

    cerrarFormEstado(): void {
        this.mostrarFormEstado.set(false);
        this.error.set('');
    }

    /* Nombre del estado elegido en el select (para la vista previa en color). */
    nombreEstado(): string {
        const id = this.nuevoEstadoId();
        if (!id) return '';
        return this.estadosTramite().find(e => e.id === id)?.nombre ?? '';
    }

    guardarEstado(): void {
        const id = this.tramite()?.id;
        if (!id || this.cambiando()) return;

        if (!this.nuevoEstadoId()) {
            this.error.set('Seleccione el nuevo estado del trámite.');
            return;
        }

        const dto: TramiteActualizarEstado = {
            estadoId: this.nuevoEstadoId(),
            fechaResolucion: this.fechaResolucion() || null,
            resumenResolucion: this.resumenResolucion() || null
        };

        this.cambiando.set(true);
        this.error.set('');
        this.tramitesSvc.actualizarEstado(id, dto).subscribe({
            next: () => {
                this.cambiando.set(false);
                this.toast.mostrar('Estado actualizado correctamente.', 3000);
                this.mostrarFormEstado.set(false);
                this.cargarDetalle(id);
            },
            error: (err) => {
                this.cambiando.set(false);
                this.error.set(err.error?.error || 'Error al actualizar el estado.');
            }
        });
    }

    // ── Notas internas ───────────────────────────────────────

    cargarNotas(tramiteId: number): void {
        this.cargandoNotas.set(true);
        this.tramitesSvc.listarNotas(tramiteId).subscribe({
            next: (notas) => {
                this.notas.set(notas);
                this.cargandoNotas.set(false);
            },
            error: () => {
                this.cargandoNotas.set(false);
                this.toast.mostrar('Error al cargar las notas.', 3000);
            }
        });
    }

    abrirModalNota(): void {
        this.notaContenido.set('');
        this.errorNota.set('');
        this.modalNotaAbierto.set(true);
    }

    cerrarModalNota(): void {
        this.modalNotaAbierto.set(false);
        this.errorNota.set('');
    }

    guardarNota(): void {
        const tramiteId = this.tramite()?.id;
        const contenido = this.notaContenido().trim();
        if (!tramiteId || this.guardandoNota()) return;

        if (!contenido) {
            this.errorNota.set('Escriba el contenido de la nota.');
            return;
        }

        this.guardandoNota.set(true);
        this.errorNota.set('');
        this.tramitesSvc.crearNota(tramiteId, {
            contenido,
            etiquetaId: null,
            fijado: false,
            prioritario: false
        }).subscribe({
            next: () => {
                this.guardandoNota.set(false);
                this.cerrarModalNota();
                this.cargarNotas(tramiteId);
                this.toast.mostrar('Nota agregada correctamente.', 3000);
            },
            error: (err) => {
                this.guardandoNota.set(false);
                this.errorNota.set(err.error?.error || 'Error al guardar la nota.');
            }
        });
    }

    eliminarNota(nota: NotaTramite): void {
        if (!confirm('¿Eliminar esta nota?')) return;
        this.tramitesSvc.eliminarNota(nota.id).subscribe({
            next: () => {
                const tramiteId = this.tramite()?.id;
                if (tramiteId) this.cargarNotas(tramiteId);
                this.toast.mostrar('Nota eliminada.', 3000);
            },
            error: (err) => {
                this.toast.mostrar(err.error?.error || 'Error al eliminar la nota.', 3000);
            }
        });
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

    // ── Documentos adjuntos ──────────────────────────────────

    cargarDocumentos(tramiteId: number): void {
        this.cargandoDocumentos.set(true);
        this.tramitesSvc.listarDocumentos(tramiteId).subscribe({
            next: (documentos) => {
                this.documentos.set(documentos);
                this.cargandoDocumentos.set(false);
            },
            error: () => {
                this.cargandoDocumentos.set(false);
                this.toast.mostrar('Error al cargar los documentos.', 3000);
            }
        });
    }

    abrirModalUpload(): void {
        this.archivoSeleccionado.set(null);
        this.errorArchivo.set('');
        this.modalUploadAbierto.set(true);
    }

    cerrarModalUpload(): void {
        this.modalUploadAbierto.set(false);
        this.errorArchivo.set('');
    }

    onArchivoSeleccionado(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.archivoSeleccionado.set(input.files?.[0] ?? null);
        this.errorArchivo.set('');
        // Permite volver a elegir el mismo archivo tras quitarlo.
        input.value = '';
    }

    quitarArchivo(): void {
        this.archivoSeleccionado.set(null);
        this.errorArchivo.set('');
    }

    subirArchivo(): void {
        const tramiteId = this.tramite()?.id;
        const archivo = this.archivoSeleccionado();
        if (!tramiteId || !archivo || this.subiendo()) return;

        const extension = archivo.name.substring(archivo.name.lastIndexOf('.')).toLowerCase();
        if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
            this.errorArchivo.set('Tipo de archivo no permitido. Solo se aceptan PDF, Word, JPG, PNG y TXT.');
            return;
        }

        this.subiendo.set(true);
        this.errorArchivo.set('');

        const reader = new FileReader();
        reader.onload = () => {
            const buffer = new Uint8Array(reader.result as ArrayBuffer);
            if (!this.validarMagicBytes(buffer, extension)) {
                this.subiendo.set(false);
                this.errorArchivo.set(`El contenido del archivo no coincide con la extension ${extension} indicada.`);
                return;
            }
            this.tramitesSvc.subirDocumento(tramiteId, archivo, null).subscribe({
                next: () => {
                    this.subiendo.set(false);
                    this.cerrarModalUpload();
                    this.cargarDocumentos(tramiteId);
                    this.toast.mostrar('Archivo subido correctamente.', 3000);
                },
                error: (err) => {
                    this.subiendo.set(false);
                    this.errorArchivo.set(err.error?.error || 'Error al subir el archivo.');
                }
            });
        };
        reader.onerror = () => {
            this.subiendo.set(false);
            this.errorArchivo.set('No se pudo leer el archivo.');
        };
        reader.readAsArrayBuffer(archivo.slice(0, 8));
    }

    /* Firma de los primeros 8 bytes según la extensión declarada. */
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

    abrirPreview(doc: DocTramite): void {
        this.archivoPreview.set({
            nombreArchivo: doc.nombreArchivo,
            tipoArchivo: doc.tipoArchivo,
            previewUrl: this.tramitesSvc.verDocumento(doc.id),
            downloadUrl: this.tramitesSvc.descargarUrl(doc.id)
        });
    }

    cerrarPreview(): void {
        this.archivoPreview.set(null);
    }

    descargarDocumento(doc: DocTramite): void {
        this.tramitesSvc.descargarDocumento(doc.id, doc.nombreArchivo);
    }

    eliminarDocumento(doc: DocTramite): void {
        if (!confirm(`¿Eliminar el documento "${doc.nombreArchivo}"?`)) return;
        this.tramitesSvc.eliminarDocumento(doc.id).subscribe({
            next: () => {
                const tramiteId = this.tramite()?.id;
                if (tramiteId) this.cargarDocumentos(tramiteId);
                this.toast.mostrar('Documento eliminado.', 3000);
            },
            error: (err) => {
                this.toast.mostrar(err.error?.error || 'Error al eliminar el documento.', 3000);
            }
        });
    }

    tipoIcono(tipo: string): string {
        const t = (tipo || '').toUpperCase();
        if (t === 'PDF') return 'pdf';
        if (t === 'WORD' || t === 'DOC' || t === 'DOCX') return 'word';
        if (t === 'EXCEL') return 'excel';
        if (t === 'IMAGEN' || t === 'JPG' || t === 'JPEG' || t === 'PNG') return 'imagen';
        return 'otro';
    }

    colorEstado(estado: string): string {
        const colores: Record<string, string> = {
            'Ingresado': '#3498db',
            'En Proceso': '#f39c12',
            'Resuelto': '#2ecc71',
            'Rechazado': '#e74c3c'
        };
        return colores[estado] ?? '#6c757d';
    }

    esResuelto(): boolean {
        return this.tramite()?.estado === 'Resuelto' || this.tramite()?.estado === 'Rechazado';
    }
}
