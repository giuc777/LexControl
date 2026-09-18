import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

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
export class VisorArchivosComponent {
    private readonly documentosSvc = inject(DocumentosService);

    readonly abierto = input.required<boolean>();
    readonly cerrado = output<void>();
    readonly archivo = input.required<ArchivoVisor>();

    readonly previewUrl = computed(() =>
        this.documentosSvc.ver(this.archivo().rutaArchivo)
    );

    readonly esPdf = computed(() =>
        this.archivo().tipoArchivo.toUpperCase() === 'PDF'
    );

    readonly esImagen = computed(() =>
        this.archivo().tipoArchivo.toUpperCase() === 'IMAGEN'
    );

    readonly esTexto = computed(() =>
        this.archivo().nombreArchivo.toLowerCase().endsWith('.txt')
    );

    abrirEnNuevaVentana(): void {
        window.open(this.documentosSvc.descargar(this.archivo().rutaArchivo), '_blank');
    }
}
