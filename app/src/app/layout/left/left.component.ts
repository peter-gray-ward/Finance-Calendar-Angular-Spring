import { Component, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sync } from '../../models/Sync';
import { Expense } from '../../models/Expense';
import { ExpenseComponent } from '../../features/expense/expense.component';

@Component({
  selector: 'app-left',
  standalone: true,
  imports: [ExpenseComponent, CommonModule],
  templateUrl: './left.component.html',
  styleUrl: './left.component.scss'
})
export class LeftComponent {
  @Input() expanding!: boolean;
  @Input() sync!: Sync;
  @Output() expenseChange = new EventEmitter<Expense>();

  updateExpenseLeft(expense: Expense) {
    console.log("calling updateExpenseLeft from Left");
    console.log("emitting updateExpense from Left");
    this.expenseChange.emit(expense);
  }
}
