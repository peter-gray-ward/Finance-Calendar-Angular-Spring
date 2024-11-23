package ward.peter.finance_calendar.model;

import org.springframework.data.annotation.Id;

public class Expense {
	@Id
	private String id;
	private String name;
	private String frequency;
	private Double amount;
	private Calendar startdate;
	private Calendar recurrenceenddate;
	private String user_id;
}