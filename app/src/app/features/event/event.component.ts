import { Component, OnInit } from '@angular/core';
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
  event!: Event | null;
  activity: any = {};

  constructor(private route: ActivatedRoute, private data: DataService) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.data.fetchEvent(this.eventId).subscribe(event => {
      console.log("fetched event", event)
      this.event = event;

    });
    this.data.activity$.subscribe(activity => {
      this.activity = activity;
      var modalWidth = window.innerWidth / 2.5;
      var modalHeight = window.innerHeight / 3;
      if (this.activity.left > window.innerWidth - modalWidth) {
        this.activity.left -= (this.activity.left + modalWidth) - window.innerWidth
      }
      if (this.activity.top > window.innerHeight - modalHeight) {
        this.activity.top -= (this.activity.top + modalHeight) - window.innerHeight
      }
    });
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
