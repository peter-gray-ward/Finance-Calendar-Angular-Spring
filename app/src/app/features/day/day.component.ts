import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Event } from '../../models/Event';
import { DataService } from '../../core/data.service'

@Component({
  selector: 'app-day',
  standalone: true,
  imports: [],
  templateUrl: './day.component.html',
  styleUrl: './day.component.scss'
})
export class DayComponent {
  @Input() day: any;
  @Input() checking_balance?: number;

  constructor(private router: Router, private data: DataService) {}

  editEvent($event: any, event: Event) {
    console.log('edit event', event)
    this.data.setActivity({ left: $event.clientX, top: $event.clientY });
    this.router.navigate([`/event/${event.id}`])
  }
}
