package ward.peter.finance_calendar.model;

import java.time.LocalDate;
import org.springframework.data.annotation.Id;

public class Expense {
	@Id
	private String id;
	private String name;
	private String frequency;
	private Double amount;
	private LocalDate startdate;
	private LocalDate recurrenceenddate;
	private String userId;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getFrequency() {
		return frequency;
	}

	public void setFrequency(String frequency) {
		this.frequency = frequency;
	}

	public Double getAmount() {
		return amount;
	}

	public void setAmount(Double amount) {
		this.amount = amount;
	}

	public LocalDate getStartdate() {
		return startdate;
	}

	public void setStartdate(LocalDate startdate) {
		this.startdate = startdate;
	}

	public LocalDate getRecurrenceenddate() {
		return recurrenceenddate;
	}

	public void setRecurrenceenddate(LocalDate recurrenceenddate) {
		this.recurrenceenddate = recurrenceenddate;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}
}