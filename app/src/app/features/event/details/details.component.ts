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
    console.log('details: ', this.route.snapshot.paramMap)
    const eventId = this.route.snapshot.paramMap.get('id') || '';
    this.event = this.data.fetchEvent(eventId);
  }

  saveThisEvent() {
    this.data.saveThisEvent(this.event);
  }

  editSummary(newTitle: string) {
  }
}
