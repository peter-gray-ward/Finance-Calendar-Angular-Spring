import { Injectable, signal } from '@angular/core';
import { HttpService } from './http.service';
import { Expense } from '../models/Expense';
import { Event } from '../models/Event';
import { Account } from '../models/Account';
import { Sync } from '../models/Sync';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  sync = signal<Sync | null>(null);
  events = signal<any | null>(null);
  activity = signal<any>({});

  constructor(private http: HttpService) {}

  fetchSyncData() {
    this.http.sync().subscribe(syncData => this.sync.set(syncData));
  }

  fetchEvents() {
    this.http.getCalendar().subscribe(events => this.events.set(events));
  }

  updateMonthYear(which: string) {
    this.http.updateMonthYear(which).subscribe((calendar: any) => {
      this.sync.update((sync) =>
        sync
          ? {
              ...sync,
              account: {
                ...sync.account,
                year: calendar.year,
                month: calendar.month
              }
            }
          : null
      );
      this.events.set(calendar);
    });
  }

  createEvent(event: Event) {
    this.http.createEvent(event).subscribe((calendar: any) => {
      this.events.update(events => (events ? { ...events, months: calendar.months } : null));
    });
  }

  fetchEvent(eventId: string): Event {
    const events = this.events();
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
      const events = this.events();
      if (events) {
        for (const week of events.months) {
          for (const day of week) {
            if (day.events) {
              const foundEvent = day.events.find((e: Event) => e.id === event.id);
              if (foundEvent) {

                foundEvent.news = res;

                console.log(foundEvent);
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
      this.events.update(events => (events ? { ...events, months: res.months } : null));
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
              expenses: sync.account.expenses.map((e) => (e.id === expense.id ? expense : e))
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
                expenses: sync.account.expenses.filter((e) => e.id !== expense.id)
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
      this.events.update(events => (events ? { ...events, months: res.months } : null));
    });
  }

  refreshCalendar() {
    this.http.refreshCalendar().subscribe((res: any) => {
      console.log('refreshed calendar', res);
      this.events.update(events => (events ? { ...events, months: res.months } : null));
    });
  }
}
