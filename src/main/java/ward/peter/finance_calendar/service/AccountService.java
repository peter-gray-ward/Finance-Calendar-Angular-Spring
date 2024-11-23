package ward.peter.finance_calendar.service;

import ward.peter.finance_calendar.model.Expense;
import ward.peter.finance_calendar.model.Debt;
import ward.peter.finance_calendar.model.Account;
import ward.peter.finance_calendar.repository.ExpenseRepository;
import ward.peter.finance_calendar.repository.DebtRepository;
import ward.peter.finance_calendar.repository.AccountRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final ExpenseRepository expenseRepository;
    private final DebtRepository debtRepository;
    

    public AccountService(AccountRepository accountRepository, ExpenseRepository expenseRepository, DebtRepository debtRepository) {
        this.accountRepository = accountRepository;
        this.expenseRepository = expenseRepository;
        this.debtRepository = debtRepository;
    }

    public Optional<Account> findByName(String name) {
        return accountRepository.findByName(name);
    }

    public List<Expense> getExpensesByAccount(String userId) {
        return expenseRepository.findByUserId(userId);
    }

    public List<Debt> getDebtsByAccount(String userId) {
        return debtRepository.findByUserId(userId);
    }

    public void save(Account account) throws IllegalArgumentException {
        accountRepository.save(account);
    }
}
