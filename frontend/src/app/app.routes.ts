import {Routes} from '@angular/router';
export const routes:Routes=[
 {path:'',title:'Pakatanmjn | Firework Catalogue',loadComponent:()=>import('./home/home').then(m=>m.Home)},
 {path:'category/:category',title:'Collection | Pakatanmjn',loadComponent:()=>import('./category/category').then(m=>m.Category)},
 {path:'admin',title:'Manage products | Pakatan MJN',loadComponent:()=>import('./admin/admin').then(m=>m.Admin)},
 {path:'**',redirectTo:''}
];