package ward.peter.finance_calendar.controller;

import ward.peter.finance_calendar.model.Expense;
import ward.peter.finance_calendar.service.ExpenseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseRESTController {

    private final ExpenseService expenseService;

    public ExpenseRESTController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/account/{userId}")
    public List<Expense> getExpensesByAccount(@PathVariable String userId) {
        return expenseService.getExpensesByAccount(userId);
    }

    @PostMapping
    public Expense createExpense(@RequestBody Expense expense) {
        return expenseService.saveExpense(expense);
    }

    @DeleteMapping("/{id}")
    public void deleteExpense(@PathVariable String id) {
        expenseService.deleteExpense(id);
    }
}
