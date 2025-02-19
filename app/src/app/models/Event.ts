export interface Event {
	id: string;
    recurrenceid: string;
    summary: string;
    date: string;
    recurrenceenddate: string;
    amount: number;
    total: number;
    balance: number;
    exclude: number;
    frequency: string;
    user_id: string;
    news?: any;
}