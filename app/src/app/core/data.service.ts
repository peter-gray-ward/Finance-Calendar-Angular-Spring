import { Injectable, signal } from '@angular/core';
import { HttpService } from './http.service';
import { Expense } from '../models/Expense';
import { Event } from '../models/Event';
import { Account } from '../models/Account';
import { Sync } from '../models/Sync';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  sync = signal<any | null>(null);
  eventsSubject = new BehaviorSubject<any | null>(null);
  events$ = this.eventsSubject.asObservable();
  activity = signal<any>({});

  constructor(private http: HttpService) {}

  fetchSyncData() {
    this.http.sync().subscribe(syncData => this.sync.set(syncData));
  }

  fetchEvents() {
    this.http.getCalendar().subscribe((events: any) => this.eventsSubject.next(events));
  }

  updateMonthYear(which: string): void {
    this.http.updateMonthYear(which).subscribe((events: any) => {
      this.sync.set({
        ...this.sync(),
        account: {
          ...this.sync().account,
          year: events.year,
          month: events.month
        }
      });
      this.eventsSubject.next(events)
    });
  }

  createEvent(event: Event) {
    this.http.createEvent(event).subscribe((events: any) => {
      this.eventsSubject.next({ ...this.eventsSubject.value, months: events.months });
    });
  }

  fetchEvent(eventId: string): Event {
    const events = this.eventsSubject.value;
    if (events) {
      for (const week of events.months) {
        for (const day of week) {
          if (day.events) {
            const foundEvent = day.events.find((event: Event) => event.id === eventId);
            if (foundEvent) return foundEvent;
          }
        }
      }
    }
    return {} as Event;
  }

  fetchEventNews(event: Event): any {
    this.http.getEventNews(event.summary, event.date).subscribe((res: any) => {
      console.log("news...", res);
      const events = this.eventsSubject.value;
      if (events) {
        for (const week of events.months) {
          for (const day of week) {
            if (day.events) {
              const foundEvent = day.events.find((e: Event) => e.id === event.id);
              if (foundEvent) {

                foundEvent.news = res;
              }
            }
          }
        }
      }
    });
  }

  saveThisEvent(event: Event) {
    this.http.saveThisEvent(event).subscribe((res: any) => {
      console.log('saved this event', res);
      this.eventsSubject.next({ ...this.eventsSubject.value, months: res.months });
    });
  }

  addExpense() {
    this.http.addExpense().subscribe((expense: Expense) => {
      this.sync.update((sync) =>
        sync
          ? {
              ...sync,
              account: {
                ...sync.account,
                expenses: [...sync.account.expenses, expense]
              }
            }
          : null
      );
    });
  }

  updateExpense(expense: Expense) {
    this.sync.update((sync) =>
      sync
        ? {
            ...sync,
            account: {
              ...sync.account,
              expenses: sync.account.expenses.map((e: any) => (e.id === expense.id ? expense : e))
            }
          }
        : null
    );

    this.http.updateExpense(expense).subscribe();
  }

  deleteExpense(expense: Expense) {
    this.http.deleteExpense(expense).subscribe(() => {
      console.log('deleted expense');
      this.sync.update((sync) =>
        sync
          ? {
              ...sync,
              account: {
                ...sync.account,
                expenses: sync.account.expenses.filter((e: any) => e.id !== expense.id)
              }
            }
          : null
      );
    });
  }

  getCurrentSyncData(): Sync | null {
    return this.sync();
  }

  getAccount(): Account | null {
    return this.sync()?.account ?? null;
  }

  setActivity(obj: any) {
    this.activity.update((current) => ({
      ...current,
      ...obj
    }));
  }

  saveCheckingBalance(balance: number) {
    this.http.saveCheckingBalance(balance).subscribe((res: any) => {
      this.sync.update((sync) =>
        sync
          ? {
              ...sync,
              account: {
                ...sync.account,
                checkingBalance: balance
              }
            }
          : null
      );
      this.eventsSubject.next({ ...this.eventsSubject.value, months: res.months });
    });
  }

  refreshCalendar() {
    this.http.refreshCalendar().subscribe((res: any) => {
      console.log('refreshed calendar', res);
      this.eventsSubject.next({ ...this.eventsSubject.value, months: res.months });
    });
  }
}
