package ward.peter.finance_calendar.controller.web;

import ward.peter.finance_calendar.model.Expense;
import ward.peter.finance_calendar.model.Debt;
import ward.peter.finance_calendar.service.AccountService;
import ward.peter.finance_calendar.dto.AccountData;
import ward.peter.finance_calendar.model.Account;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpSession;
import java.util.List;

@Controller
public class AccountController {

    private static final Logger logger = LoggerFactory.getLogger(AccountController.class);

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/")
    public String index(Model model, HttpSession session) {
        
        logger.info("GetMapping(/)");
        System.out.println("GetMapping(/)");

        Account user = (Account) session.getAttribute("user");


        logger.info(user.getName());


        // String userId = "9488c0b8-8656-11ef-bce3-5133723371b6"; // Replace with dynamic account logic
        // List<Expense> expenses = accountService.getExpensesByAccount(userId);
        // List<Debt> debts = accountService.getDebtsByAccount(userId);

        

        // // Add data to the model
        // model.addAttribute("data", new AccountData(expenses, debts));
        return "index"; // Thymeleaf resolves templates/index.html
    }
}
