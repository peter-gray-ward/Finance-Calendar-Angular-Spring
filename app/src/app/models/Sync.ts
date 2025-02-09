import { Account } from './Account';

export interface Sync {
	Api: object;
	DOW: string[];
	MONTHS: string[];
	FREQUENCIES: string[];
	Page: {
		[key: string]: number;
	};
	account: Account;
}