import { Account } from './Account';

export interface Sync {
	api: object;
	dow: string[];
	months: string[];
	frequencies: string[];
	account: Account;
}