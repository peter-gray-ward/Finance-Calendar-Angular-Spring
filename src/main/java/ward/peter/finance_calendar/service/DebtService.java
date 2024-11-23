package ward.peter.finance_calendar.service;

import ward.peter.finance_calendar.model.Debt;
import ward.peter.finance_calendar.repository.DebtRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DebtService {

    private final DebtRepository expenseRepository;

    public DebtService(DebtRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public List<Debt> getDebtsByAccount(String user_id) {
        return expenseRepository.findByUserId(user_id);
    }

    public Debt saveDebt(Debt expense) {
        return expenseRepository.save(expense);
    }

    public void deleteDebt(Long expenseId) {
        expenseRepository.deleteById(expenseId);
    }
}
