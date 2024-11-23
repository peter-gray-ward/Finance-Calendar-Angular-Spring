package ward.peter.finance_calendar.repository;

import ward.peter.finance_calendar.model.Expense;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface ExpenseRepository extends CrudRepository<Expense, String> {
    List<Expense> findByUserId(String user_id);
}
