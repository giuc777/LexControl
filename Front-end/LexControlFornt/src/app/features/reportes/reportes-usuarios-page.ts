import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { UsuariosService } from '../../core/services/usuarios-service';
import { UsuarioLista } from '../../core/models/usuario.model';

interface RolConteo {
    nombre: string;
    cantidad: number;
    color: string;
    porcentaje: number;
}

interface UsuarioAcceso {
    nombre: string;
    cuenta: string;
    iniciales: string;
    rol: string;
    colorRol: string;
    ultimoAcceso: string | null;
    ultimoAccesoFormato: string;
    activo: boolean;
}

const COLORES_ROL: Record<string, string> = {
    Administrador: '#358292',
    Secretaria: '#8e44ad',
    Abogado: '#b2845a'
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
    selector: 'app-reportes-usuarios-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reportes-usuarios-page.html'
})
export class ReportesUsuariosPage {
    private readonly usuariosService = inject(UsuariosService);

    readonly cargando = signal(true);

    private readonly usuarios = toSignal(
        this.usuariosService.listar().pipe(
            map(lista => lista),
            catchError(() => of([] as UsuarioLista[]))
        ),
        { initialValue: [] as UsuarioLista[] }
    );

    readonly total = computed(() => this.usuarios().length);
    readonly activos = computed(() => this.usuarios().filter(u => u.activo).length);
    readonly inactivos = computed(() => this.usuarios().filter(u => !u.activo).length);
    readonly bloqueados = computed(() => this.usuarios().filter(u => u.bloqueado).length);

    readonly porRol = computed<RolConteo[]>(() => {
        const lista = this.usuarios();
        const total = lista.length || 1;
        const mapa = new Map<string, number>();
        for (const u of lista) {
            mapa.set(u.rol, (mapa.get(u.rol) ?? 0) + 1);
        }
        return Array.from(mapa.entries())
            .map(([nombre, cantidad]) => ({
                nombre,
                cantidad,
                color: COLORES_ROL[nombre] ?? '#8b9aa0',
                porcentaje: Math.round((cantidad / total) * 100)
            }))
            .sort((a, b) => b.cantidad - a.cantidad);
    });

    readonly ultimosAccesos = computed<UsuarioAcceso[]>(() => {
        return this.usuarios()
            .filter(u => u.activo)
            .sort((a, b) => {
                const fa = a.ultimoAcceso ? new Date(a.ultimoAcceso).getTime() : 0;
                const fb = b.ultimoAcceso ? new Date(b.ultimoAcceso).getTime() : 0;
                return fb - fa;
            })
            .slice(0, 10)
            .map(u => ({
                nombre: u.nombreCompleto,
                cuenta: u.usuario,
                iniciales: this.obtenerIniciales(u.nombreCompleto),
                rol: u.rol,
                colorRol: COLORES_ROL[u.rol] ?? '#8b9aa0',
                ultimoAcceso: u.ultimoAcceso,
                ultimoAccesoFormato: this.formatearFecha(u.ultimoAcceso),
                activo: u.activo
            }));
    });

    readonly usuariosTabla = computed(() => {
        return this.usuarios().map(u => ({
            ...u,
            fechaCreacionFormato: this.formatearFechaCorta(u.fechaCreacion),
            ultimoAccesoFormato: this.formatearFecha(u.ultimoAcceso),
            colorRol: COLORES_ROL[u.rol] ?? '#8b9aa0',
            iniciales: this.obtenerIniciales(u.nombreCompleto)
        }));
    });

    private formatearFecha(fecha: string | null): string {
        if (!fecha) return 'Sin registro';
        const d = new Date(fecha);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()} ${hh}:${mm}`;
    }

    private formatearFechaCorta(fecha: string): string {
        const d = new Date(fecha);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    private obtenerIniciales(nombre: string): string {
        const partes = nombre.trim().split(/\s+/);
        if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
        return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
    }

    exportarPDF(): void {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 28, 30);
        doc.text('Reporte de Usuarios — LexControl', 14, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(139, 154, 160);
        const fecha = new Date();
        doc.text(`Generado: ${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()} ${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, '0')}`, 14, 25);

        // Resumen
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(26, 28, 30);
        doc.text('Resumen', 14, 35);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total: ${this.total()}  |  Activos: ${this.activos()}  |  Inactivos: ${this.inactivos()}  |  Bloqueados: ${this.bloqueados()}`, 14, 41);

        // Tabla de usuarios
        const encabezados = [['Nombre', 'Cuenta', 'Rol', 'Correo', 'Estado', 'Bloqueado', 'Creado', 'Último Acceso']];
        const datos = this.usuariosTabla().map(u => [
            u.nombreCompleto,
            u.usuario,
            u.rol,
            u.email,
            u.activo ? 'Activo' : 'Inactivo',
            u.bloqueado ? 'Sí' : 'No',
            u.fechaCreacionFormato,
            u.ultimoAccesoFormato
        ]);

        autoTable(doc, {
            startY: 48,
            head: encabezados,
            body: datos,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [53, 130, 146], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 245, 246] },
            margin: { left: 14, right: 14 }
        });

        doc.save('reporte-usuarios-lexcontrol.pdf');
    }
}
