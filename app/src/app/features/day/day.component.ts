import { Component, Input } from '@angular/core';
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
}
