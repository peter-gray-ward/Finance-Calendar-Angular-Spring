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
  
  @Input() expanding: boolean = false;
  sync!: () => any;

  constructor(private data: DataService, private router: Router) {}

  ngOnInit() {
    this.sync = this.data.sync;
    this.data.fetchSyncData();
    this.data.fetchEvents();
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
