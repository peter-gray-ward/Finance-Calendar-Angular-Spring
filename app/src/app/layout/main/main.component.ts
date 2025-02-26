import { 
  Component, 
  Input, 
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../core/data.service';
import { Sync } from '../../models/Sync';
import { CalendarComponent } from '../../features/calendar/calendar.component';
import { ApplyFocus } from '../../core/applyfocus.directive';
import { fromEvent, switchMap, debounceTime } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { ResizeService } from '../../core/resize.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, CalendarComponent, ApplyFocus],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  
  @Input() expanding: boolean = false;
  sync!: () => any;
  @ViewChild('searchbar') searchBar!: ElementRef;
  searching = signal(false);
  beans: any = null;
  blurTargets: string[] = ["event", "search"];
  searchWidth: string = '';

  constructor(private data: DataService, private router: Router, private resizer: ResizeService) {}

  ngOnInit() {
    this.sync = this.data.sync;
  }

  ngAfterViewInit() {
    this.initSearch();

    this.resizer.screenWidth$.subscribe(innerWidth => {
      this.searchWidth = getComputedStyle(this.searchBar.nativeElement).width.replace('px','');
    });
  }

  prevMonth(): void {
    this.data.updateMonthYear('prev');
  }

  nextMonth(): void {
    this.data.updateMonthYear('next');
  }

  currentMonth(): void {
    this.data.updateMonthYear('current');
  }

  blurMain(event: any): void {
    for (var target of this.blurTargets) {
      let src = event.srcElement;
      while (src && !src.classList.contains(target)) {
        src = src.parentElement;
      }
      if (!src || !src.classList.contains(target)) {
        switch (target) {
          case 'event':
            this.router.navigate(["/"]);
            break;
          case 'search':
            this.beans = null;
            break;
        }
      }
    }
  }

  initSearch() {
    fromEvent(this.searchBar.nativeElement, 'input').pipe(
      debounceTime(300),
      switchMap(event => ajax.getJSON('/actuator/beans', { withCredentials: 'true' }))
    ).subscribe((beans: any) => {
      this.beans = Object.keys(beans.contexts['finance-calendar'].beans);
      this.beans = this.beans.map((key: any) => ({
        ...beans.contexts['finance-calendar'].beans[key],
        name: key
      }));
    });
  }
}
