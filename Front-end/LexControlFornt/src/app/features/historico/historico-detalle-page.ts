import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ExpedientesService } from '../../core/services/expedientes-service';
import { DocumentosService } from '../../core/services/documentos-service';
import {
    ExpedienteDetalle,
    NotaExpediente,
    ParteProcesal,
    DocExpediente
} from '../../core/models/expediente.model';

@Component({
    selector: 'app-historico-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink],
    templateUrl: './historico-detalle-page.html'
})
export class HistoricoDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly documentosSvc = inject(DocumentosService);

    protected readonly expediente = signal<ExpedienteDetalle | null>(null);
    protected readonly partes = signal<ParteProcesal[]>([]);
    protected readonly notas = signal<NotaExpediente[]>([]);
    protected readonly documentos = signal<DocExpediente[]>([]);
    protected readonly cargando = signal(true);

    private expedienteId = 0;

    ngOnInit(): void {
        this.expedienteId = Number(this.route.snapshot.paramMap.get('id'));
        if (!this.expedienteId) {
            this.router.navigate(['/historico']);
            return;
        }
        this.cargarDetalle();
        this.cargarPartes();
        this.cargarNotas();
        this.cargarDocumentos();
    }

    cargarDetalle(): void {
        this.cargando.set(true);
        this.expedientesSvc.obtenerPorId(this.expedienteId).subscribe({
            next: (dato) => {
                if (dato) this.expediente.set(dato);
                this.cargando.set(false);
            },
            error: () => { this.cargando.set(false); }
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

    volver(): void {
        this.router.navigate(['/historico']);
    }

    colorEstado(estado: string): string {
        if (estado === 'Cerrado') return '#B2845A';
        if (estado === 'Archivado') return '#95A5A6';
        return '#6c757d';
    }
}
