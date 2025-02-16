import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { AppComponent } from './app.component';
import { EventComponent } from './features/event/event.component';
import { EventDetailsComponent } from './features/event/details/details.component';
import { NewsComponent } from './features/event/news/news.component';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent }
    ]
  },
  {
    path: 'event/:id',
    component: EventComponent,
    children: [
      {
        path: '',
        component: EventDetailsComponent
      },
      {
        path: 'news',
        component: NewsComponent
      }
    ]
  },
  { path: '**', redirectTo: '' } // Default route
];
