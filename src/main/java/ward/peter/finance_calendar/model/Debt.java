package ward.peter.finance_calendar.model;

import org.springframework.data.annotation.Id;

public class Debt {
	@Id
	private String id;
	private String creditor;
	private Double balance;
	private Double interest;
	private String account_number;
	private String link;
	private String user_id;
	private String recurrenceid;
}