import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../core/data.service';
import { Sync } from '../../models/Sync';
import { CalendarComponent } from '../../features/calendar/calendar.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, CalendarComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  sync!: Sync;
  @Input() expanding: boolean = false;
  constructor(private data: DataService, private router: Router) {}
  ngOnInit() {
    this.data.sync$.subscribe(sync => {
      console.log(sync)
      this.sync = sync;
    });
    this.data.account$.subscribe(account => {
      this.sync.account = account;
    });
  }
  prevMonth(): void {
    this.data.updateMonthYear('prev').subscribe();
  }
  nextMonth(): void {
    this.data.updateMonthYear('next').subscribe();
  }
  currentMonth(): void {
    this.data.updateMonthYear('current').subscribe();
  }
  blurEvent(event: any): void {
    let src = event.srcElement;
    while (src && !src.classList.contains("event")) {
      src = src.parentElement;
    }
    if (!src || !src.classList.contains('event')) {
      this.router.navigate(["/"]);
    }
  }
}
