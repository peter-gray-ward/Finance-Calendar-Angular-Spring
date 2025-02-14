import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { DataService } from '../../core/data.service';
import { Sync } from '../../models/Sync';
import { Event } from '../../models/Event';
import { DayComponent } from '../day/day.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, DayComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  sync?: Sync;
  months?: any[];
  @ViewChild('calendarContainer') calendarContainer!: ElementRef;

  constructor(private data: DataService,  @Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
    this.data.sync$.subscribe(sync => {
      this.sync = sync;
    });
    this.data.events$.subscribe(res => {
      this.months = res.months;
    });
  }

  ngAfterViewChecked() {
    var fomList = document.querySelectorAll('.first-of-month');
    console.log(document, fomList);

    if (fomList.length > 0) {
      var fom = fomList.length == 3 ? fomList[1] : fomList[0];
      var fomWeek = fom as HTMLElement;

      while (fomWeek && !fomWeek.classList.contains("week")) {
        fomWeek = fomWeek.parentElement as HTMLElement;
      }

      var headerHeight = +getComputedStyle(document.getElementById('calendar-month-header')!).height.split('px')[0];
      var weekHeaderHeight = +getComputedStyle(document.getElementById('calendar-week-header')!).height.split('px')[0];

      if (fomWeek) {
        this.calendarContainer.nativeElement.scrollTo(0, fomWeek.offsetTop - headerHeight - weekHeaderHeight);
      }
    }
  }

}
