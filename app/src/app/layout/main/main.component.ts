import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  sync?: Sync;
  @Input() expanding: boolean = false;
  constructor(private data: DataService) {}
  ngOnInit() {
    this.data.sync$.subscribe(sync => {
      this.sync = sync;
    });
  }
}
