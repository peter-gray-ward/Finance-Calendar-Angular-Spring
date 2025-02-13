import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Expense } from '../../models/Expense';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'expense',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss'
})
export class ExpenseComponent {
  @Input() expense!: Expense;
  @Input() frequencies!: string[];
  // @Output() expenseChange = new EventEmitter<Expense>();

  constructor(private data: DataService) {}

  formatDate(date: Date | string | null): string {
    console.log('formatting expense date', date, this.expense)

    if (!date) return '';

    const d = new Date(date);
    return d.toISOString().split('T')[0]; // ✅ Converts Date to yyyy-MM-dd
  }

  updateExpense(field: keyof Expense, value: any) {

    this.expense.startdate = this.formatDate(this.expense.startdate || new Date());
    this.expense.recurrenceenddate = this.formatDate(this.expense.recurrenceenddate || new Date());

    // this.expenseChange.emit({
    //   ...this.expense,
    //   [field]: value
    // });
    this.data.updateExpense({
      ...this.expense,
      [field]: value
    });
  }

  deleteExpense(event: any) {
    this.data.deleteExpense(this.expense);
  }
}
