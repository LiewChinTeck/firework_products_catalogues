import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
export const routes: Routes = [
 { path: '', title: 'GlowFest | Firework Catalogue', loadComponent: () => import('./home/home').then(m => m.Home) },
 { path: 'login', title: 'Admin Login | GlowFest', loadComponent: () => import('./login/login').then(m => m.Login) },
 { path: 'admin/manage', title: 'Manage Products | GlowFest', canActivate: [authGuard], loadComponent: () => import('./admin/manage/manage').then(m => m.Manage) },
 { path: 'admin', title: 'Dashboard | GlowFest', canActivate: [authGuard], loadComponent: () => import('./admin/admin').then(m => m.Admin) },
 { path: 'category/:category', title: 'Collection | GlowFest', loadComponent: () => import('./category/category').then(m => m.Category) },
 { path: '**', redirectTo: '' }
];
