package ward.peter.finance_calendar.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import ward.peter.finance_calendar.services.ExpenseService;
import ward.peter.finance_calendar.utils.AuthUtil;
import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.models.Expense;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/expense")
public class ExpenseController {
	private ExpenseService expenseService;
	private AuthUtil authUtil;
	
	public ExpenseController(ExpenseService expenseService, AuthUtil authUtil) {
		this.expenseService = expenseService;
		this.authUtil = authUtil;
	}

	@PostMapping
	public ResponseEntity<Expense> addExpense(User user) {
		return ResponseEntity.ok(expenseService.addExpense(user));
	}

	@PutMapping
	public ResponseEntity<Expense> updateExpense(@RequestBody Expense expense) {
		return ResponseEntity.ok(expenseService.updateExpense(expense));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Boolean> deleteExpense(@PathVariable String id) {
		return ResponseEntity.ok(expenseService.deleteExpense(id));
	}
}