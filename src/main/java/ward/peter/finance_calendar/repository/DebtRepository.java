package ward.peter.finance_calendar.repository;

import ward.peter.finance_calendar.model.Debt;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface DebtRepository extends CrudRepository<Debt, String> {
	List<Debt> findByUserId(String user_id);
}
