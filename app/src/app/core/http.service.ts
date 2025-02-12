import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Sync } from '../models/Sync';
import { Expense } from '../models/Expense';
import { User } from '../models/User';
import { Event } from '../models/Event';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient, private router: Router) {}

  checkAuth(): Observable<boolean> {
    return this.http.get<{ authenticated: boolean }>(`/auth/check-auth`, { withCredentials: true })
      .pipe(
        map(response => {
          console.log('checking auth', response)
          return response.authenticated
        }),
        catchError(() => of(false)) // If an error occurs, return false
      );
  }

  login(user: User): Observable<any> {
    return this.http.post<User>("/auth/login", user, { 
      headers: this.headers,
      withCredentials: true
    });
  }

  logout(): Observable<any> {
    return this.http.get('/auth/logout', { withCredentials: true }).pipe(
      map(() => {
        document.location.reload(); // 🔹 Hard refresh to clear everything
        this.router.navigate(['/auth/login']);  // Redirect to login page
      })
    );
  }


  register(user: User): Observable<any> {
    return this.http.post<User>("/auth/register", user, { headers: this.headers });
  }

  sync(): Observable<Sync> {
    return this.http.get<Sync>("/sync", { headers: this.headers });
  }

  addExpense(): Observable<any> {
    return this.http.post<any>("/api/add-expense", { headers: this.headers });
  }

  updateExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>("/api/update-expense", expense, { headers: this.headers });
  }

  deleteExpense(expense: Expense): Observable<Expense> {
    return this.http.delete<Expense>("/api/delete-expense/" + expense.id, { headers: this.headers });
  }

  getEvents(): Observable<any[]> {
    return this.http.get<any[]>("/api/get-events", { headers: this.headers });
  }

  updateMonthYear(which: string): Observable<any[]> {
    console.log("http.updateMonthYear")
    return this.http.post<any[]>("/api/update-month-year",
      { which },
      { headers: this.headers }
    );
  }

  saveThisEvent(event: Event): Observable<Event> {
    return this.http.put<Event>("/api/save-this-event/" + event.id, event, { headers: this.headers });
  }

  saveCheckingBalance(balance: number): Observable<any> {
    return this.http.post<number>(`/api/save-checking-balance/${balance}.0`, { headers: this.headers });
  }

}
