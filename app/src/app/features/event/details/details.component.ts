import { Component, OnInit, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../core/data.service';
import { Event } from '../../../models/Event';

@Component({
  selector: 'app-event-details',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class EventDetailsComponent {
  event!: Event;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService
  ) {
    effect(() => {
      const state = this.router.getCurrentNavigation()?.extras.state as { event: Event };
      this.event = state?.event || null;

      if (!this.event) {
        const eventId = this.route.snapshot.paramMap.get('id') || '';
        this.event = this.data.fetchEvent(eventId);
      }
    })
  }

  saveThisEvent() {
    console.log(this.event)
    this.data.saveThisEvent(this.event);
  }
}
