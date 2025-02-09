import { Debt } from './Debt';
import { Expense } from './Expense';

export interface Account {
	checkingBalance: number;
	debts: Debt[];
	expenses: Expense[];
	id: string;
	month: number;
	name: string;
	year: number;
}