import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Event } from '../../models/Event';

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

  constructor(private router: Router) {}

  editEvent(event: Event) {
    console.log('edit event', event)
    this.router.navigate([`/event/${event.id}`])
  }
}
