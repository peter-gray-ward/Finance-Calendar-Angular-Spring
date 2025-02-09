import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { AppComponent } from './app.component';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent }
    ]
  },
  {
    path: '',
    component: AppComponent
  },
  { path: '**', redirectTo: 'auth/login' } // Default route
];
