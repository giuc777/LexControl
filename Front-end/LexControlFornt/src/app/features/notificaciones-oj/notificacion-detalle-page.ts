import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NotificacionesService } from '../../core/services/notificaciones-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { NotificacionDetalle, NotificacionAtender } from '../../core/models/notificacion.model';
import { JuzgadoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { VisorArchivosComponent, ArchivoVisor } from '../../shared/components/visor-archivos/visor-archivos';
import { ToastService } from '../../layout/toast/toast-service';
import { NotificacionModal } from './notificacion-modal';

const COLORES_ESTADO: Record<string, string> = {
    'Pendiente': '#f39c12',
    'En Tramite': '#3498db',
    'Atendida': '#2ecc71',
    'Vencida': '#e74c3c',
    'Rechazada': '#95a5a6'
};

@Component({
    selector: 'app-notificacion-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, NotificacionModal, VisorArchivosComponent],
    templateUrl: './notificacion-detalle-page.html'
})
export class NotificacionDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly notificacionesSvc = inject(NotificacionesService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly toast = inject(ToastService);

    protected readonly notificacion = signal<NotificacionDetalle | null>(null);
    protected readonly cargando = signal(true);

    protected readonly mostrarFormAtender = signal(false);
    protected readonly notasAtencion = signal('');

    protected readonly mostrarModal = signal(false);
    protected readonly archivoPreview = signal<ArchivoVisor | null>(null);
    protected readonly expedientes = signal<{ id: number; noExpediente: string }[]>([]);
    protected readonly juzgados = signal<{ id: number; nombre: string }[]>([]);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.cargarDetalle(id);
        this.cargarExpedientes();
        this.cargarJuzgados();
    }

    cargarDetalle(id: number): void {
        this.cargando.set(true);
        this.notificacionesSvc.obtenerPorId(id).subscribe({
            next: (datos) => {
                this.notificacion.set(datos);
                this.cargando.set(false);
            },
            error: () => {
                this.toast.mostrar('Error al cargar la notificacion.', 3000);
                this.cargando.set(false);
            }
        });
    }

    cargarExpedientes(): void {
        this.expedientesSvc.listar({}).subscribe({
            next: (data) => {
                this.expedientes.set(
                    data.expedientes.map((e: { id: number; noExpediente: string }) => ({
                        id: e.id,
                        noExpediente: e.noExpediente
                    }))
                );
            }
        });
    }

    cargarJuzgados(): void {
        this.catalogosSvc.buscarJuzgados({}).subscribe({
            next: (data) => {
                this.juzgados.set(
                    data.items.map((j: JuzgadoItem) => ({ id: j.id, nombre: j.nombre }))
                );
            }
        });
    }

    irAVolver(): void {
        this.router.navigate(['/notificaciones-oj']);
    }

    abrirEditar(): void {
        this.mostrarModal.set(true);
    }

    cerrarModal(): void {
        this.mostrarModal.set(false);
    }

    alGuardar(): void {
        this.mostrarModal.set(false);
        const id = this.notificacion()?.id;
        if (id) this.cargarDetalle(id);
    }

    descargarPdf(): void {
        const ruta = this.notificacion()?.pdfRuta;
        if (!ruta) return;
        this.notificacionesSvc.descargar(ruta, 'Documento_adjunto.pdf');
    }

    abrirVisor(): void {
        const ruta = this.notificacion()?.pdfRuta;
        if (!ruta) return;
        this.archivoPreview.set({
            nombreArchivo: 'Documento adjunto',
            rutaArchivo: ruta,
            tipoArchivo: 'PDF'
        });
    }

    cerrarVisor(): void {
        this.archivoPreview.set(null);
    }

    toggleFormAtender(): void {
        this.mostrarFormAtender.set(!this.mostrarFormAtender());
        this.notasAtencion.set('');
    }

    atender(): void {
        const id = this.notificacion()?.id;
        if (!id) return;
        const dto: NotificacionAtender = {
            notas: this.notasAtencion() || null
        };
        this.notificacionesSvc.atender(id, dto).subscribe({
            next: () => {
                this.toast.mostrar('Notificacion atendida correctamente.', 3000);
                this.mostrarFormAtender.set(false);
                this.cargarDetalle(id);
            },
            error: () => { this.toast.mostrar('Error al atender la notificacion.', 3000); }
        });
    }

    colorEstado(estado: string): string {
        return COLORES_ESTADO[estado] ?? '#6c757d';
    }

    esAtendida(): boolean {
        return this.notificacion()?.estado === 'Atendida';
    }
}