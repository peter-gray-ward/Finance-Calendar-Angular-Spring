import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map, distinctUntilChanged } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpService } from './http.service';
import { Expense } from '../models/Expense';
import { Account } from '../models/Account';
import { Sync } from '../models/Sync';
import { Event } from '../models/Event';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private syncSubject = new BehaviorSubject<any | null>(null);
  private eventsSubject = new BehaviorSubject<any | null>(null);
  public sync$ = this.syncSubject.asObservable();
  public events$ = this.eventsSubject.asObservable();
  public account$ = this.sync$.pipe(
    map((sync: Sync) => sync?.account),
    distinctUntilChanged() 
  );

  constructor(private http: HttpService) {}

  fetchSyncData(): Observable<any> {
    return this.http.sync().pipe(
      tap(syncData => this.syncSubject.next(syncData)) // Store sync data
    );
  }

  fetchEvents(): Observable<any> {
    return this.http.getEvents().pipe(
      tap(events => this.eventsSubject.next(events))
    );
  }

  updateMonthYear(which: string): Observable<any> {
    return this.http.updateMonthYear(which).pipe(
      tap((events: any) => {
        this.syncSubject.next({
          ...this.syncSubject.value,
          account: {
            ...this.syncSubject.value.account,
            year: events.year,
            month: events.month
          }
        })
        return this.eventsSubject.next(events)
      })
    );
  }

  fetchEvent(eventId: string): Observable<Event | null> {
    const val = this.eventsSubject.value;
    if (val) {
      const event = val.events.find((e: any) => e.id === eventId);
      if (event) {
        return of(event);
      }
    }
    return of(null); // Return null if the event is not found
  }

  addExpense(): void {
    this.http.addExpense().pipe(
      tap(res => {
        console.log("data service addExpense", res)
        const currentSync = this.syncSubject.value;
        if (!currentSync) return;

        const expense = res.expense;
        const updatedExpenses = [...currentSync.account.expenses, expense];

        console.log('added expense', updatedExpenses)

        this.syncSubject.next({ 
          ...currentSync,
          account: {
            ...currentSync.account,
            expenses: updatedExpenses 
          }
        });
      })
    ).subscribe();
  }

  updateExpense(expense: Expense): void {
    const currentSync = this.syncSubject.value;
    if (!currentSync) return;

    const updatedExpenses = currentSync.account.expenses.map((e: Expense) => {
      return e.id == expense.id ? expense : e
    });

    // emit update
    this.syncSubject.next({
      ...currentSync,
      expenses: updatedExpenses
    });

    this.http.updateExpense(expense).subscribe();
  }

  getCurrentSyncData(): any | null {
    return this.syncSubject.value;
  }

  getAccount(): Account {
    return this.syncSubject.value.account;
  }
}
