import { Component, OnInit, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
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

  constructor(private route: ActivatedRoute, private data: DataService) {
    // effect(() => {
    //   const activity = this.activity();
    //   if (!activity) return;
    //   var modalWidth = window.innerWidth / 2.5;
    //   var modalHeight = window.innerHeight / 3;
    //   if (activity.left > window.innerWidth - modalWidth) {
    //     activity.left -= (activity.left + modalWidth) - window.innerWidth
    //   }
    //   if (activity.top > window.innerHeight - modalHeight) {
    //     activity.top -= (activity.top + modalHeight) - window.innerHeight
    //   }
    // });
  }

  ngOnInit(): void {
    this.data.activity$.subscribe(activity => {
      console.log("-- new activity in event", activity)
      this.activity = activity;
    });
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.data.events$.subscribe(events => {
      this.event = this.data.fetchEvent(this.eventId);
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
