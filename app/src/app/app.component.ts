import { Component, Inject, Renderer2 } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { 
  LeftComponent
} from './layout/left/left.component'
import { Expense } from './models/Expense';
import { Sync } from './models/Sync';
import { HttpService } from './core/http.service';
import { DataService } from './core/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    LeftComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'app';
  expanding: boolean = false;
  authenticated: boolean = true;
  sync!: Sync;

  constructor(
    private http: HttpService,
    private data: DataService,
    private renderer: Renderer2, 
    @Inject(DOCUMENT) private document: Document,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('in app init...')
    this.http.checkAuth().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.data.fetchSyncData().subscribe(sync => {
          this.sync = sync;
        });
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
    
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
