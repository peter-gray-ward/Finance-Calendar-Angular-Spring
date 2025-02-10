import { Debt } from './Debt';
import { Expense } from './Expense';

export interface Account {
	checking_balance: number;
	debts: Debt[];
	expenses: Expense[];
	id: string;
	month: number;
	name: string;
	year: number;
}