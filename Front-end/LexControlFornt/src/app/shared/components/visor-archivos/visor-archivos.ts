import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DocumentosService } from '../../../core/services/documentos-service';
import { Modal } from '../modal/modal';

export interface ArchivoVisor {
    nombreArchivo: string;
    rutaArchivo: string;
    tipoArchivo: string;
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
    private readonly documentosSvc = inject(DocumentosService);

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

        const url = this.documentosSvc.ver(this.archivo().rutaArchivo);
        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                this.blobUrl = URL.createObjectURL(blob);
                this.previewUrl.set(
                    this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl)
                );
                this.cargandoPreview.set(false);
            },
            error: () => {
                this.cargandoPreview.set(false);
            }
        });
    }

    private limpiarBlob(): void {
        if (this.blobUrl) {
            URL.revokeObjectURL(this.blobUrl);
            this.blobUrl = null;
        }
    }

    abrirEnNuevaVentana(): void {
        this.documentosSvc.descargar(this.archivo().rutaArchivo, this.archivo().nombreArchivo);
    }
}
