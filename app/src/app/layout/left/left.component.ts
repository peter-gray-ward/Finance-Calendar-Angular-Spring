import { Component, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sync } from '../../models/Sync';
import { Expense } from '../../models/Expense';
import { ExpenseComponent } from '../../features/expense/expense.component';
import { HttpService } from '../../core/http.service';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-left',
  standalone: true,
  imports: [ExpenseComponent, CommonModule],
  templateUrl: './left.component.html',
  styleUrl: './left.component.scss'
})
export class LeftComponent {
  @Input() expanding!: boolean;
  sync?: Sync;

  constructor(private http: HttpService, private data: DataService) {}

  ngOnInit() {
    this.data.sync$.subscribe(sync => {
      console.log('left sync', sync)
      this.sync = sync;
    });
  }

  logout() {
    this.http.logout().subscribe(() => {});
  }

  addExpense() {
    this.data.addExpense();
  }

  refreshCalendar() {
    this.data.refreshCalendar();
  }
}
