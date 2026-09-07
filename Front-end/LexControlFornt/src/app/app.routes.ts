import { Routes } from '@angular/router';

import { authGuard, loginGuard } from './core/auth/auth-guard';
import { moduloGuard } from './core/auth/modulo-guard';
import { MODULOS } from './core/permisos/permisos';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [loginGuard],
        loadComponent: () => import('./features/login/login-page').then(m => m.LoginPage)
    },
    {
        path: '',
        component: Shell,
        canActivate: [authGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
            {
                path: 'dashboard',
                canActivate: [moduloGuard('dashboard')],
                loadComponent: () => import('./features/dashboard/dashboard-page').then(m => m.DashboardPage)
            },
            {
                path: 'clientes',
                canActivate: [moduloGuard('clientes')],
                loadComponent: () => import('./features/clientes/clientes-page').then(m => m.ClientesPage)
            },
            {
                path: 'clientes/:id',
                canActivate: [moduloGuard('clientes')],
                loadComponent: () => import('./features/clientes/cliente-detalle-page').then(m => m.ClienteDetallePage)
            },
            {
                path: 'ajustes',
                canActivate: [moduloGuard('ajustes')],
                loadComponent: () => import('./features/ajustes/ajustes-page').then(m => m.AjustesPage)
            },
            {
                path: 'expedientes',
                canActivate: [moduloGuard('expedientes')],
                loadComponent: () => import('./features/expedientes/expedientes-page').then(m => m.ExpedientesPage)
            },
            {
                path: 'expedientes/:id',
                canActivate: [moduloGuard('expedientes')],
                loadComponent: () => import('./features/expedientes/expediente-detalle-page').then(m => m.ExpedienteDetallePage)
            },
            {
                path: 'reportes',
                canActivate: [moduloGuard('reportes')],
                loadComponent: () => import('./features/reportes/reportes-page').then(m => m.ReportesPage)
            },
            {
                path: 'mantenimiento',
                canActivate: [moduloGuard('mantenimiento')],
                loadComponent: () => import('./features/mantenimiento/mantenimiento-page').then(m => m.MantenimientoPage)
            },
            {
                path: 'mantenimiento/:catalogo',
                canActivate: [moduloGuard('mantenimiento')],
                loadComponent: () => import('./features/mantenimiento/mantenimiento-detalle-page').then(m => m.MantenimientoDetallePage)
            },
            /* Los demás módulos se registran con la página provisional;
               cada fase del plan reemplazará su loadComponent. */
            ...MODULOS.filter(m => m.key !== 'dashboard' && m.key !== 'ajustes' && m.key !== 'reportes' && m.key !== 'clientes' && m.key !== 'expedientes' && m.key !== 'mantenimiento').map(m => ({
                path: m.ruta,
                canActivate: [moduloGuard(m.key)],
                loadComponent: () =>
                    import('./shared/pages/pagina-en-construccion').then(mod => mod.PaginaEnConstruccion),
                data: { modulo: m.label }
            }))
        ]
    },
    { path: '**', redirectTo: '' }
];
