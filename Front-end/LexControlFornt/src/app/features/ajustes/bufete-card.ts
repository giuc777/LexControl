import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ToastService } from '../../layout/toast/toast-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { ICONO_EDIFICIO, ICONO_INFO } from './ajustes-iconos';

interface ConfiguracionBufete {
    clave: string;
    etiqueta: string;
    tipo: 'text' | 'email';
    codigo: boolean;
    ayuda: string;
}

const CLAVE_STORAGE = 'lexcontrol_bufete';

/* MOCK: pendiente endpoint /api/configuracion en el backend (agents.md §11).
   Réplica de Pototipo/js/ajustes-comun.js BUFETE (seed 11 de CONFIGURACION). */
const CAMPOS_SEED: readonly ConfiguracionBufete[] = [
    {
        clave: 'NombreBufete',
        etiqueta: 'Nombre del bufete',
        tipo: 'text',
        codigo: false,
        ayuda: 'Nombre que aparece en reportes y documentos.'
    },
    {
        clave: 'EmailBufete',
        etiqueta: 'Email de contacto',
        tipo: 'email',
        codigo: false,
        ayuda: 'Correo de contacto del despacho.'
    },
    {
        clave: 'FormatoExpediente',
        etiqueta: 'Formato de expediente',
        tipo: 'text',
        codigo: true,
        ayuda: 'Use {AÑO} y {NUM} como variables del número de expediente.'
    }
];

@Component({
    selector: 'app-bufete-card',
    imports: [ReactiveFormsModule, IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './bufete-card.html'
})
export class BufeteCard {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly toast = inject(ToastService);

    protected readonly iconoEdificio = ICONO_EDIFICIO;
    protected readonly iconoInfo = ICONO_INFO;
    protected readonly campos = CAMPOS_SEED;

    protected readonly formulario = this.fb.group({
        NombreBufete: [this.valorInicial('NombreBufete'), Validators.required],
        EmailBufete: [this.valorInicial('EmailBufete'), [Validators.required, Validators.email]],
        FormatoExpediente: [this.valorInicial('FormatoExpediente'), Validators.required]
    });

    guardar(): void {
        if (this.formulario.invalid) return;

        try {
            localStorage.setItem(CLAVE_STORAGE, JSON.stringify(this.formulario.getRawValue()));
        } catch {
            /* almacenamiento no disponible */
        }

        this.toast.mostrar('Configuración del bufete guardada.');
    }

    private valorInicial(clave: string): string {
        try {
            const guardadas = JSON.parse(localStorage.getItem(CLAVE_STORAGE) ?? 'null') as Record<string, string> | null;
            if (guardadas?.[clave]) return guardadas[clave];
        } catch {
            /* valores del seed */
        }

        const seed: Record<string, string> = {
            NombreBufete: 'Bufete Jurídico Mátzar',
            EmailBufete: 'info@bufete.com',
            FormatoExpediente: 'C-{AÑO}-{NUM}'
        };
        return seed[clave];
    }
}
