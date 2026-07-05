import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RouteComponent } from './pages/route/route.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'route/:route/:direction', component: RouteComponent },
  { path: '**', redirectTo: '' }
];
