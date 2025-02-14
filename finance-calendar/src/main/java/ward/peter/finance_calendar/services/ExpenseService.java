package ward.peter.finance_calendar.services;

import org.springframework.stereotype.Service;

import java.util.UUID;
import java.time.LocalDate;

import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.models.Expense;
import ward.peter.finance_calendar.repositories.ExpenseRepository;

@Service
public class ExpenseService {
	private ExpenseRepository expenseRepository;

	public ExpenseService(ExpenseRepository expenseRepository) {
		this.expenseRepository = expenseRepository;
	}

	public Expense addExpense(User user) {
		Expense expense = new Expense().builder()
			.id(UUID.randomUUID())
			.userId(user.getId())
			.startdate(LocalDate.now())
			.recurrenceenddate(LocalDate.now())
			.amount(0.0)
			.name("")
			.frequency("monthly")
			.build();
		expenseRepository.save(expense);
		return expense;
	}

	public Expense updateExpense(Expense expense) {
		expenseRepository.save(expense);
		return expense;
	}

	public boolean deleteExpense(String id) {
		expenseRepository.deleteById(UUID.fromString(id));
		return true;
	}
}