import { ChangeDetectionStrategy, Component, input, output, inject, signal, OnInit, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogosService } from '../../core/services/catalogos-service';
import { CatalogoCrearDto, CatalogoDef, CatalogoItem, JuzgadoCrearDto, JuzgadoItem } from '../../core/models/catalogo.model';

@Component({
    selector: 'app-mantenimiento-item-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './mantenimiento-item-modal.html'
})
export class MantenimientoItemModal implements OnInit, OnChanges {
    private readonly catalogosSvc = inject(CatalogosService);

    readonly abierto = input.required<boolean>();
    readonly catalogo = input.required<CatalogoDef>();
    readonly item = input<CatalogoItem | JuzgadoItem | null>(null);
    readonly cerrado = output<void>();
    readonly guardado = output<void>();

    protected readonly modo = signal<'crear' | 'editar'>('crear');
    protected readonly guardando = signal(false);
    protected readonly error = signal('');

    // Campos estándar
    protected nombre = '';
    protected valor = '';
    protected descripcion = '';
    protected color = '#358292';
    protected orden = 0;

    // Campos juzgado
    protected tipoJuzgadoId = 0;
    protected municipioId = 0;
    protected direccion = '';
    protected telefono = '';
    protected email = '';

    ngOnInit(): void {
        this.sincronizarCampos();
    }

    ngOnChanges(): void {
        this.sincronizarCampos();
    }

    get tituloModal(): string {
        const cat = this.catalogo();
        const item = this.item();
        if (item) return `Editar · ${cat.titulo}`;
        return `Nuevo valor · ${cat.titulo}`;
    }

    get esJuzgado(): boolean {
        return this.catalogo().tipo === 'juzgado';
    }

    alCerrar(): void {
        this.error.set('');
        this.cerrado.emit();
    }

    alGuardar(): void {
        const cat = this.catalogo();
        const item = this.item();
        this.error.set('');
        this.guardando.set(true);

        if (this.esJuzgado) {
            const dto: JuzgadoCrearDto = {
                nombre: this.nombre.trim(),
                tipoJuzgadoId: this.tipoJuzgadoId,
                municipioId: this.municipioId,
                direccion: this.direccion.trim() || null,
                telefono: this.telefono.trim() || null,
                email: this.email.trim() || null
            };

            const obs = item
                ? this.catalogosSvc.actualizarJuzgado(item.id, dto)
                : this.catalogosSvc.insertarJuzgado(dto);

            obs.subscribe({
                next: () => {
                    this.guardando.set(false);
                    this.guardado.emit();
                },
                error: (err) => {
                    this.guardando.set(false);
                    this.error.set(err.error?.error || 'Error al guardar. Verifique los datos.');
                }
            });
        } else {
            const dto: CatalogoCrearDto = {
                nombre: this.nombre.trim(),
                valor: this.valor.trim() || null,
                descripcion: this.descripcion.trim() || null,
                color: this.color || null,
                orden: this.orden
            };

            const obs = item
                ? this.catalogosSvc.actualizarCatalogo(cat.tabla, item.id, dto)
                : this.catalogosSvc.insertarCatalogo(cat.tabla, dto);

            obs.subscribe({
                next: () => {
                    this.guardando.set(false);
                    this.guardado.emit();
                },
                error: (err) => {
                    this.guardando.set(false);
                    this.error.set(err.error?.error || 'Error al guardar. Verifique los datos.');
                }
            });
        }
    }

    private sincronizarCampos(): void {
        const item = this.item();
        if (item) {
            this.modo.set('editar');
            if (this.esJuzgado) {
                const j = item as JuzgadoItem;
                this.nombre = j.nombre;
                this.tipoJuzgadoId = j.tipoJuzgadoId;
                this.municipioId = j.municipioId;
                this.direccion = j.direccion || '';
                this.telefono = j.telefono || '';
                this.email = j.email || '';
            } else {
                const c = item as CatalogoItem;
                this.nombre = c.nombre;
                this.valor = c.valor || '';
                this.descripcion = c.descripcion || '';
                this.color = c.color || '#358292';
                this.orden = c.orden;
            }
        } else {
            this.modo.set('crear');
            this.nombre = '';
            this.valor = '';
            this.descripcion = '';
            this.color = '#358292';
            this.orden = 0;
            this.tipoJuzgadoId = 0;
            this.municipioId = 0;
            this.direccion = '';
            this.telefono = '';
            this.email = '';
        }
        this.error.set('');
    }
}
