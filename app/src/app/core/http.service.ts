import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sync } from '../models/Sync';
import { Expense } from '../models/Expense';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}


  sync(): Observable<Sync> {
    return this.http.get<Sync>("/sync", { headers: this.headers });
  }

  updateExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>("/api/update-expense", expense, { headers: this.headers });
  }

}
