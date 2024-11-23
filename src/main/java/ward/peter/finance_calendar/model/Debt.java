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
	private String userId;
	private String recurrenceid;

	// Getter and Setter for id
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	// Getter and Setter for creditor
	public String getCreditor() {
		return creditor;
	}

	public void setCreditor(String creditor) {
		this.creditor = creditor;
	}

	// Getter and Setter for balance
	public Double getBalance() {
		return balance;
	}

	public void setBalance(Double balance) {
		this.balance = balance;
	}

	// Getter and Setter for interest
	public Double getInterest() {
		return interest;
	}

	public void setInterest(Double interest) {
		this.interest = interest;
	}

	// Getter and Setter for account_number
	public String getAccountNumber() {
		return account_number;
	}

	public void setAccountNumber(String account_number) {
		this.account_number = account_number;
	}

	// Getter and Setter for link
	public String getLink() {
		return link;
	}

	public void setLink(String link) {
		this.link = link;
	}

	// Getter and Setter for userId
	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	// Getter and Setter for recurrenceid
	public String getRecurrenceId() {
		return recurrenceid;
	}

	public void setRecurrenceId(String recurrenceid) {
		this.recurrenceid = recurrenceid;
	}
}