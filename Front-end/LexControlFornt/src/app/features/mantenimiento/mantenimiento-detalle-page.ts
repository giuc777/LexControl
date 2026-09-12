import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { CatalogosService } from '../../core/services/catalogos-service';
import { CatalogoDef, CatalogoItem, JuzgadoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Paginacion } from '../../shared/components/paginacion/paginacion';
import { MantenimientoItemModal } from './mantenimiento-item-modal';
import { CATALOGOS_MAP } from './catalogos-metadata';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
    selector: 'app-mantenimiento-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, Paginacion, MantenimientoItemModal],
    templateUrl: './mantenimiento-detalle-page.html'
})
export class MantenimientoDetallePage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly catalogosSvc = inject(CatalogosService);

    protected readonly catalogo = signal<CatalogoDef | null>(null);
    protected readonly items = signal<(CatalogoItem | JuzgadoItem)[]>([]);
    protected readonly total = signal(0);
    protected readonly paginaActual = signal(1);
    protected readonly cargando = signal(false);
    protected readonly modalAbierto = signal(false);
    protected readonly itemEditar = signal<CatalogoItem | JuzgadoItem | null>(null);
    protected readonly incluirInactivos = signal(false);

    protected readonly tamanioPagina = 10;
    protected filtroBusqueda = '';

    private sub!: Subscription;

    ngOnInit(): void {
        this.sub = this.route.params.subscribe(params => {
            const key = params['catalogo'];
            const def = CATALOGOS_MAP[key];
            if (!def) {
                this.router.navigate(['/mantenimiento']);
                return;
            }
            this.catalogo.set(def);
            this.paginaActual.set(1);
            this.cargarItems();
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    formatearFecha(iso: string | null): string {
        if (!iso) return '—';
        const partes = iso.split('T')[0].split('-');
        if (partes.length !== 3) return iso;
        return `${parseInt(partes[2], 10)} ${MESES_CORTO[parseInt(partes[1], 10) - 1]} ${partes[0]}`;
    }

    esJuzgado(item: CatalogoItem | JuzgadoItem): item is JuzgadoItem {
        return this.catalogo()?.tipo === 'juzgado';
    }

    toggleIncluirInactivos(): void {
        this.incluirInactivos.update(v => !v);
        this.paginaActual.set(1);
        this.cargarItems();
    }

    alBuscar(valor: string): void {
        this.filtroBusqueda = valor;
        this.paginaActual.set(1);
        this.cargarItems();
    }

    alPaginar(pagina: number): void {
        this.paginaActual.set(pagina);
        this.cargarItems();
    }

    abrirModalCrear(): void {
        this.itemEditar.set(null);
        this.modalAbierto.set(true);
    }

    abrirModalEditar(item: CatalogoItem | JuzgadoItem): void {
        this.itemEditar.set(item);
        this.modalAbierto.set(true);
    }

    cerrarModal(): void {
        this.modalAbierto.set(false);
        this.itemEditar.set(null);
    }

    alGuardar(): void {
        this.cerrarModal();
        this.paginaActual.set(1);
        this.cargarItems();
    }

    toggleActivo(item: CatalogoItem | JuzgadoItem): void {
        const cat = this.catalogo();
        if (!cat) return;

        const nuevoActivo = !item.activo;

        if (cat.tipo === 'juzgado') {
            this.catalogosSvc.cambiarEstadoJuzgado(item.id, { activo: nuevoActivo }).subscribe({
                next: () => this.cargarItems(),
                error: () => {}
            });
        } else {
            this.catalogosSvc.cambiarEstadoCatalogo(cat.tabla, item.id, { activo: nuevoActivo }).subscribe({
                next: () => this.cargarItems(),
                error: () => {}
            });
        }
    }

    irAVolver(): void {
        this.router.navigate(['/mantenimiento']);
    }

    trackById(_index: number, item: CatalogoItem | JuzgadoItem): number {
        return item.id;
    }

    private cargarItems(): void {
        const cat = this.catalogo();
        if (!cat) return;

        this.cargando.set(true);
        const filtros = {
            busqueda: this.filtroBusqueda || null,
            incluirInactivos: this.incluirInactivos(),
            pagina: this.paginaActual(),
            tamanoPagina: this.tamanioPagina
        };

        const onNext = (resultado: { items: (CatalogoItem | JuzgadoItem)[]; total: number }) => {
            this.items.set(resultado.items);
            this.total.set(resultado.total);
            this.cargando.set(false);
        };

        const onError = () => this.cargando.set(false);

        if (cat.tipo === 'juzgado') {
            this.catalogosSvc.buscarJuzgados(filtros).subscribe({ next: onNext, error: onError });
        } else {
            this.catalogosSvc.buscarCatalogo(cat.tabla, filtros).subscribe({ next: onNext, error: onError });
        }
    }
}
