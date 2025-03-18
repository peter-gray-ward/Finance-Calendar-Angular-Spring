import { Component, OnInit, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { ResizeService } from '../../core/resize.service';
import { Event } from '../../models/Event';
import { EventDetailsComponent } from './details/details.component';

@Component({
  selector: 'app-event',
  imports: [RouterOutlet, CommonModule, FormsModule, RouterLink, EventDetailsComponent],
  standalone: true,
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent implements OnInit {
  eventId!: string;
  event: Event | null = null;
  activity!: any;

  constructor(private route: ActivatedRoute, private data: DataService) {}

  ngOnInit(): void {
    this.data.activity$.subscribe(activity => {
      this.activity = activity;
      this.adjustModal();
      if (this.activity.eventId !== this.eventId) {
        this.setEvent(this.activity.eventId);
      }
    });
    this.setEvent();
    this.data.events$.subscribe(events => {
      this.event = this.data.fetchEvent(this.eventId);
    });
  }

  setEvent(eventId?: string) {
    this.eventId = eventId ? eventId : this.route.snapshot.paramMap.get('id') || '';
    this.event = this.data.fetchEvent(this.eventId);
  }

  adjustModal() {
    var modalWidth = 400;
    var modalHeight = 200;
    if (this.activity.left > window.innerWidth - modalWidth) {
      this.activity.left -= (this.activity.left + modalWidth) - window.innerWidth
    }
    if (this.activity.top > window.innerHeight - modalHeight) {
      this.activity.top -= (this.activity.top + modalHeight) - window.innerHeight
    }
  }

  mousedown(event: any) {
     // isModal.classList.add('gripped')
     //  $(isModal).data().offset = JSON.stringify({
     //    x: event.clientX - $(isModal).offset().left,
     //    y: event.clientY - $(isModal).offset().top
     //  });
  }
  mousemove(event: any) {

  }
  mouseup(event: any) {
    
  }
}
