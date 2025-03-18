import { Component, OnInit, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DataService } from '../../../core/data.service';
import { Event } from '../../../models/Event';
import { filter } from 'rxjs'

@Component({
  selector: 'app-event-details',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class EventDetailsComponent {
  event!: Event;

  constructor(private route: ActivatedRoute, private router: Router, private data: DataService) {}

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id') || '';
    this.data.events$.subscribe(events => {
      this.event = this.data.fetchEvent(eventId);
    });
    this.data.activity$.subscribe(activity => {
      if (activity.eventId !== this.event.id) {
        this.event = this.data.fetchEvent(activity.eventId);
      }
    });
  }

  saveThisEvent() {
    this.data.saveThisEvent(this.event);
  }

  editSummary(newTitle: string) {
  }

  deleteThisEvent() {
    this.data.deleteThisEvent(this.event).subscribe(res => {
      this.router.navigate([`/`]);
    })
  }

  deleteAllTheseEvents() {
    this.data.deleteAllTheseEvents(this.event).subscribe(res => {
      this.router.navigate([`/`]);
    })
  }
}
