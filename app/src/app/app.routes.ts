import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { AppComponent } from './app.component';
import { EventComponent } from './features/event/event.component';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent }
    ]
  },
  {
    path: 'event/:id',
    component: EventComponent
  },
  { path: '**', redirectTo: '' } // Default route
];
