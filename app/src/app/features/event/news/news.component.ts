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

  constructor(private route: ActivatedRoute, private data: DataService) {}

  ngOnInit(): void {
    const eventId = window.location.pathname.split('/')[2]
    if (eventId) {
      this.event = this.data.fetchEvent(eventId);
      this.data.fetchEventNews(this.event).subscribe((news: any) => {
        console.log()
        this.event.news = news;
        this.outlets = Array.from(new Set(this.event.news.articles.map((a: any) => a.source.name)));
      })
    }
    this.data.activity$.subscribe(activity => {
      if (activity.eventId !== this.event.id) {
        this.event = this.data.fetchEvent(eventId);
      }
    })
  }
}
