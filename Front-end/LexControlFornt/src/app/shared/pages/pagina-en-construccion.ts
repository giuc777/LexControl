import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/* Página provisional para los módulos aún no implementados (fases 3–10
   del plan en agents.md). Muestra el nombre del módulo desde route data. */
@Component({
    selector: 'app-pagina-en-construccion',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        .en-construccion {
            background: #ffffff;
            border: 1px solid var(--panel-line);
            border-radius: var(--radius-card);
            padding: 56px 32px;
            text-align: center;
        }
        h2 {
            font-size: 20px;
            font-weight: 600;
            color: var(--ink);
            margin-bottom: 8px;
        }
        p {
            font-size: 14px;
            color: var(--muted);
        }
    `,
    template: `
        <div class="en-construccion">
            <h2>{{ modulo }}</h2>
            <p>Módulo en construcción. Se implementará en las siguientes fases del plan.</p>
        </div>
    `
})
export class PaginaEnConstruccion {
    readonly modulo = inject(ActivatedRoute).snapshot.data['modulo'] ?? 'Módulo';
}
