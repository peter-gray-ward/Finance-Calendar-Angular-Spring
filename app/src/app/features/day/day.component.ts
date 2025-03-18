import { Component, Input, ViewChild, ElementRef, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Event } from '../../models/Event';
import { fromEvent } from 'rxjs';
import { DataService } from '../../core/data.service';
import { ResizeService } from '../../core/resize.service';
import { HighlightDirective } from '../../core/highlight.directive';

@Component({
  selector: 'app-day',
  standalone: true,
  imports: [FormsModule, HighlightDirective],
  templateUrl: './day.component.html',
  styleUrl: './day.component.scss'
})
export class DayComponent {
  @ViewChild("dayBlock") dayBlock!: ElementRef;

  @Input() day: any;
  @Input() month!: number;
  @Input() year!: number;
  @Input() checkingBalance: number = 0;

  saveCheckingBalanceTimeout: number = 0;

  constructor(private router: Router, private data: DataService, private route: ActivatedRoute, private resize: ResizeService) {}

  ngAfterViewInit() {
    console.log('DayComponent')
    this.getActiveEventLocation();
    this.resize.resizeCallbacks.push(this.getActiveEventLocation.bind(this));
  }

  getActiveEventLocation() {
    let eventId: string | undefined = window.location.pathname.split('/')[2];
    if (eventId && this.day.events.find((e: Event) => e.id == eventId)) {
      let position = this.dayBlock.nativeElement.querySelector('#event-' + eventId).getBoundingClientRect();
      this.data.setActivity({
        left: position.left,
        top: position.top,
        eventId
      });
    }
  }

  editEvent($event: any, event: Event) {
    this.data.setActivity({ left: $event.clientX, top: $event.clientY, eventId: event.id });
    this.router.navigate([`/event/${event.id}`]);
  }

  updateCheckingBalance() {
      clearTimeout(this.saveCheckingBalanceTimeout);
      this.saveCheckingBalanceTimeout = setTimeout(() => {
          this.saveCheckingBalance();
      }, 800);
  }

  saveCheckingBalance() {
      this.data.saveCheckingBalance(this.checkingBalance);
  }

  createEvent(day: any) {
    const date = new Date().toISOString().split("T")[0];
    const event: any = {
        summary: 'string',
        date: date,
        recurrenceenddate: date,
        amount: 0,
        total: 0,
        balance: 0,
        exclude: 0,
        frequency: 'monthly'
    };
    this.data.createEvent(event);
  }
}
