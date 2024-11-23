package ward.peter.finance_calendar.controller;

import ward.peter.finance_calendar.model.Expense;
import ward.peter.finance_calendar.service.ExpenseService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/")
    public String index(Model model) {
        String userId = "";
        List<Expense> expenses = expenseService.getExpensesByAccount(userId);
        model.addAttribute("expenses", expenses);
        return "index";
    }
}
