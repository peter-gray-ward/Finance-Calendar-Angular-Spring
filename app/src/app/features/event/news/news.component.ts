import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Event } from '../../../models/Event';
import { DataService } from '../../../core/data.service';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit {
  event!: Event;
  outlets: string[] = [];

  constructor(private route: ActivatedRoute, private data: DataService) {
    effect(() => {
      console.log("NEWS event: ", this.event);
      this.outlets = Array.from(new Set(this.event.news.articles.map((a: any) => a.source.name)))
    })
  }

  ngOnInit(): void {
    const eventId = window.location.pathname.split('/')[2]
    if (eventId) {
      this.event = this.data.fetchEvent(eventId);
      this.data.fetchEventNews(this.event)
    }
  }
}
