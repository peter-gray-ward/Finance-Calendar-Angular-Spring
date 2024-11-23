package ward.peter.finance_calendar.dto;

import ward.peter.finance_calendar.model.Expense;
import ward.peter.finance_calendar.model.Debt;

import java.util.List;

public class AccountData {
    private List<Expense> expenses;
    private List<Debt> debts;

    public AccountData(List<Expense> expenses, List<Debt> debts) {
        this.expenses = expenses;
        this.debts = debts;
    }

    public List<Expense> getExpenses() {
        return expenses;
    }

    public List<Debt> getDebts() {
        return debts;
    }
}