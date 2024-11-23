package ward.peter.finance_calendar.model;

import org.springframework.data.annotation.Id;

public class Account {
	@Id
	private String id;
    private String name;
    private String password;
    private Double checkingBalance;
    
    // Getter and Setter for id
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    // Getter and Setter for name
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    // Getter and Setter for password
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Getter and Setter for checkingBalance
    public Double getCheckingBalance() {
        return checkingBalance;
    }

    public void setCheckingBalance(Double checkingBalance) {
        this.checkingBalance = checkingBalance;
    }
}
