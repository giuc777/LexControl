import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CatalogosService } from '../../core/services/catalogos-service';
import { CatalogoDef } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { CATALOGOS } from './catalogos-metadata';

const ICONO_GRID = 'M3 3h7v7H3V3zM14 3h7v7h-7V3zM14 14h7v7h-7v-7zM3 14h7v7H3v-7z';

@Component({
    selector: 'app-mantenimiento-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState],
    templateUrl: './mantenimiento-page.html'
})
export class MantenimientoPage implements OnInit {
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly router = inject(Router);

    protected readonly catalogos = signal<CatalogoDef[]>(CATALOGOS);
    protected readonly cargando = signal(false);
    protected filtroBusqueda = '';

    protected readonly iconoGrid = ICONO_GRID;

    ngOnInit(): void {
        this.cargarConteos();
    }

    get catalogosFiltrados(): CatalogoDef[] {
        const busqueda = this.filtroBusqueda.toLowerCase().trim();
        if (!busqueda) return this.catalogos();
        return this.catalogos().filter(c =>
            c.titulo.toLowerCase().includes(busqueda) ||
            c.tabla.toLowerCase().includes(busqueda) ||
            c.texto.toLowerCase().includes(busqueda)
        );
    }

    irADetalle(catalogo: CatalogoDef): void {
        this.router.navigate(['/mantenimiento', catalogo.key]);
    }

    trackByKey(_index: number, catalogo: CatalogoDef): string {
        return catalogo.key;
    }

    private cargarConteos(): void {
        this.cargando.set(true);
        let completados = 0;
        const total = CATALOGOS.length;

        const completar = () => {
            completados++;
            if (completados === total) this.cargando.set(false);
        };

        for (const cat of CATALOGOS) {
            if (cat.tipo === 'juzgado') {
                this.catalogosSvc.buscarJuzgados({ tamanoPagina: 1 }).subscribe({
                    next: completar,
                    error: completar
                });
            } else {
                this.catalogosSvc.buscarCatalogo(cat.tabla, { tamanoPagina: 1 }).subscribe({
                    next: completar,
                    error: completar
                });
            }
        }
    }
}
