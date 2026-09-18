import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ToastService } from '../../../layout/toast/toast-service';
import { Modal } from '../modal/modal';

export interface ArchivoVisor {
    nombreArchivo: string;
    tipoArchivo: string;
    /** URL de vista previa inline (ya resuelta por el backend). */
    previewUrl: string;
    /** URL de descarga (ya resuelta por el backend). */
    downloadUrl: string;
}

@Component({
    selector: 'app-visor-archivos',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Modal],
    templateUrl: './visor-archivos.html'
})
export class VisorArchivosComponent implements OnInit, OnDestroy {
    private readonly http = inject(HttpClient);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly toast = inject(ToastService);

    private blobUrl: string | null = null;

    readonly abierto = input.required<boolean>();
    readonly cerrado = output<void>();
    readonly archivo = input.required<ArchivoVisor>();

    readonly previewUrl = signal<SafeResourceUrl | null>(null);
    readonly cargandoPreview = signal(true);

    readonly esPdf = signal(false);
    readonly esImagen = signal(false);
    readonly esTexto = signal(false);

    ngOnInit(): void {
        this.esPdf.set(this.archivo().tipoArchivo.toUpperCase() === 'PDF');
        this.esImagen.set(this.archivo().tipoArchivo.toUpperCase() === 'IMAGEN');
        this.esTexto.set(this.archivo().nombreArchivo.toLowerCase().endsWith('.txt'));
        this.cargarPreview();
    }

    ngOnDestroy(): void {
        this.limpiarBlob();
    }

    private cargarPreview(): void {
        this.cargandoPreview.set(true);
        this.limpiarBlob();

        // Se obtiene vía HttpClient para que el interceptor adjunte el JWT.
        this.http.get(this.archivo().previewUrl, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                this.blobUrl = URL.createObjectURL(blob);
                this.previewUrl.set(
                    this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl)
                );
                this.cargandoPreview.set(false);
            },
            error: () => {
                this.cargandoPreview.set(false);
                this.toast.mostrar('No se pudo cargar la vista previa del archivo.');
            }
        });
    }

    private limpiarBlob(): void {
        if (this.blobUrl) {
            URL.revokeObjectURL(this.blobUrl);
            this.blobUrl = null;
        }
    }

    /** Abre el archivo en una nueva pestaña (autenticado vía blob). */
    abrirEnNuevaVentana(): void {
        this.http.get(this.archivo().previewUrl, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
            },
            error: () => this.toast.mostrar('No se pudo abrir el archivo en una nueva ventana.')
        });
    }
}
