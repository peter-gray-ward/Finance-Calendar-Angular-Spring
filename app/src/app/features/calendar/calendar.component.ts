import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  events?: Event[];
  months?: any[];

  constructor(private data: DataService) {}

  ngOnInit() {
    this.data.sync$.subscribe(sync => {
      this.sync = sync;
    });
    this.data.events$.subscribe(res => {
      console.log("events$ subscription change", res)
      this.events = res.events;
      this.months = res.months;
    });
  }
}
