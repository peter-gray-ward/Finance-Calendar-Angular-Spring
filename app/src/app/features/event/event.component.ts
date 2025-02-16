import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../core/data.service';
import { Event } from '../../models/Event';

@Component({
  selector: 'app-event',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent implements OnInit {
  eventId!: string;
  event!: Event;

  activity!: () => any;

  constructor(private route: ActivatedRoute, private data: DataService) {
    effect(() => {
      const activity = this.activity();
      if (!activity) return;
      var modalWidth = window.innerWidth / 2.5;
      var modalHeight = window.innerHeight / 3;
      if (activity.left > window.innerWidth - modalWidth) {
        activity.left -= (activity.left + modalWidth) - window.innerWidth
      }
      if (activity.top > window.innerHeight - modalHeight) {
        activity.top -= (activity.top + modalHeight) - window.innerHeight
      }
    })
  }

  ngOnInit(): void {
    this.activity = this.data.activity;
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.event = this.data.fetchEvent(this.eventId);
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

  saveThisEvent() {
    console.log(this.event)
    this.data.saveThisEvent(this.event);
  }
}
