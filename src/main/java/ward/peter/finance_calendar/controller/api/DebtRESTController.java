package ward.peter.finance_calendar.controller;

import ward.peter.finance_calendar.model.Debt;
import ward.peter.finance_calendar.service.DebtService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/debt")
public class DebtRESTController {

    private final DebtService expenseService;

    public DebtRESTController(DebtService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/account/{userId}")
    public List<Debt> getDebtsByAccount(@PathVariable String userId) {
        return expenseService.getDebtsByAccount(userId);
    }

    @PostMapping
    public Debt createDebt(@RequestBody Debt expense) {
        return expenseService.saveDebt(expense);
    }

    @DeleteMapping("/{id}")
    public void deleteDebt(@PathVariable String id) {
        expenseService.deleteDebt(id);
    }
}
