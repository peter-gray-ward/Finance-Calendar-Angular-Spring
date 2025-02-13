import { Debt } from './Debt';
import { Expense } from './Expense';
import { User } from './User';

export interface Account {
	expenses: Expense[];
	user: User;
	month: number;
	name: string;
	year: number;
}