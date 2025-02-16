import { Component, Inject, Renderer2 } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { filter } from 'rxjs/operators';
import { 
  LeftComponent
} from './layout/left/left.component'
import { 
  MainComponent
} from './layout/main/main.component'
import { Expense } from './models/Expense';
import { Sync } from './models/Sync';
import { HttpService } from './core/http.service';
import { DataService } from './core/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    LeftComponent,
    MainComponent,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'app';
  expanding: boolean = false;
  authenticated: boolean = false;
  
  sync!: () => any;

  constructor(
    private http: HttpService,
    private data: DataService,
    private renderer: Renderer2, 
    @Inject(DOCUMENT) private document: Document,
    private router: Router
  ) {
    console.log('AppComponent.constructor')
  }

  ngOnInit(): void {
    this.sync = this.data.sync;
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      console.log('Route change detected:', event.url);
      this.checkAuthentication();
    });
  }

  ngAfterViewInit() {
    console.log('AppComponent.ngAfterViewInit')
  }


  checkAuthentication() {
    if (!this.authenticated) {
      console.log("...")
      this.http.checkAuth().subscribe({
        next: res => {
          console.log(res)
          if (res) {
            this.authenticated = true;
            this.data.fetchSyncData();
            this.data.fetchEvents();
          } else {
            this.router.navigate(['/auth/login']);
          }
        },
        error: res => {
          this.router.navigate(['/auth/login']);
        }
      });

    }
  }

  expandToBudget() {
    if (this.expanding) return;
    this.expanding = true;

    const body = this.document.body;
    const header = this.document.querySelector('header');

    if (body.classList.contains('simple')) {
      this.renderer.removeClass(body, 'simple');
      // teardownnews();
    }

    if (!body.classList.contains('complex')) {
      if (header) this.renderer.addClass(header, 'visible');
      setTimeout(() => {
        this.renderer.addClass(body, 'complex');
        this.expanding = false;
      }, 0);
    } else {
      this.renderer.removeClass(body, 'complex');
      setTimeout(() => {
        if (header) this.renderer.removeClass(header, 'visible');
        this.expanding = false;
      }, 100);
    }
  }
}
