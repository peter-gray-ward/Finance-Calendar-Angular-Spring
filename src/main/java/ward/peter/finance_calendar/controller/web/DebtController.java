package ward.peter.finance_calendar.controller;

import ward.peter.finance_calendar.model.Debt;
import ward.peter.finance_calendar.service.DebtService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
public class DebtController {

    private final DebtService expenseService;

    public DebtController(DebtService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/")
    public String index(Model model) {
        String userId = "";
        List<Debt> debt = expenseService.getDebtsByAccount(userId);
        model.addAttribute("debt", debt);
        return "index";
    }
}
