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

/* Catálogos disponibles (misma lista que mantenimiento-page.ts). */
const CATALOGOS_MAP: Record<string, CatalogoDef> = {
    'rama': { key: 'rama', titulo: 'Ramas del Derecho', tabla: 'RAMA', texto: 'Clasificación por materia del proceso.', color: '#358292', tipo: 'estandar' },
    'estado-expediente': { key: 'estado-expediente', titulo: 'Estados de Expediente', tabla: 'ESTADO_EXPEDIENTE', texto: 'Estado procesal actual de cada expediente.', color: '#358292', tipo: 'estandar' },
    'tipo-audiencia': { key: 'tipo-audiencia', titulo: 'Tipos de Audiencia', tabla: 'TIPO_AUDIENCIA', texto: 'Clases de audiencia que pueden celebrarse.', color: '#2ECC71', tipo: 'estandar' },
    'estado-audiencia': { key: 'estado-audiencia', titulo: 'Estados de Audiencia', tabla: 'ESTADO_AUDIENCIA', texto: 'Situación de una audiencia agendada.', color: '#3498DB', tipo: 'estandar' },
    'resultado-audiencia': { key: 'resultado-audiencia', titulo: 'Resultados de Audiencia', tabla: 'RESULTADO_AUDIENCIA', texto: 'Desenlace registrado de una audiencia.', color: '#2ECC71', tipo: 'estandar' },
    'tipo-tramite': { key: 'tipo-tramite', titulo: 'Tipos de Trámite', tabla: 'TIPO_TRAMITE', texto: 'Clases de trámite gestionadas ante las autoridades.', color: '#3498DB', tipo: 'estandar' },
    'estado-tramite': { key: 'estado-tramite', titulo: 'Estados de Trámite', tabla: 'ESTADO_TRAMITE', texto: 'Situación de cada trámite.', color: '#3498DB', tipo: 'estandar' },
    'tipo-diligencia': { key: 'tipo-diligencia', titulo: 'Tipos de Diligencia', tabla: 'TIPO_DILIGENCIA', texto: 'Clases de gestión o diligencia del despacho.', color: '#3498DB', tipo: 'estandar' },
    'estado-diligencia': { key: 'estado-diligencia', titulo: 'Estados de Diligencia', tabla: 'ESTADO_DILIGENCIA', texto: 'Situación de una diligencia.', color: '#F39C12', tipo: 'estandar' },
    'tipo-notificacion-oj': { key: 'tipo-notificacion-oj', titulo: 'Tipos de Notificación OJ', tabla: 'TIPO_NOTIFICACION_OJ', texto: 'Clases de notificación del Organismo Judicial.', color: '#3498DB', tipo: 'estandar' },
    'estado-notificacion-oj': { key: 'estado-notificacion-oj', titulo: 'Estados de Notificación OJ', tabla: 'ESTADO_NOTIFICACION_OJ', texto: 'Situación de cada notificación recibida.', color: '#3498DB', tipo: 'estandar' },
    'tipo-proceso': { key: 'tipo-proceso', titulo: 'Tipos de Proceso', tabla: 'TIPO_PROCESO', texto: 'Clases de proceso judicial.', color: '#3498DB', tipo: 'estandar' },
    'etiqueta-nota': { key: 'etiqueta-nota', titulo: 'Etiquetas de Notas', tabla: 'ETIQUETA_NOTA', texto: 'Clasificación de las notas internas.', color: '#E74C3C', tipo: 'estandar' },
    'estado-evento': { key: 'estado-evento', titulo: 'Estados de Evento', tabla: 'ESTADO_EVENTO', texto: 'Situación de los eventos de la agenda.', color: '#F39C12', tipo: 'estandar' },
    'tipo-juzgado': { key: 'tipo-juzgado', titulo: 'Tipos de Juzgado', tabla: 'TIPO_JUZGADO', texto: 'Clases de juzgados y tribunales.', color: '#358292', tipo: 'estandar' },
    'rol-procesal': { key: 'rol-procesal', titulo: 'Roles Procesales', tabla: 'ROL_PROCESAL', texto: 'Papel de cada parte dentro del proceso.', color: '#358292', tipo: 'estandar' },
    'juzgado': { key: 'juzgado', titulo: 'Juzgados / Tribunales', tabla: 'JUZGADO', texto: 'Órganos jurisdiccionales donde se tramitan los casos.', color: '#358292', tipo: 'juzgado' }
};

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
