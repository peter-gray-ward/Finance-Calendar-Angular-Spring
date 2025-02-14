package ward.peter.finance_calendar.repositories;

import ward.peter.finance_calendar.models.Expense;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
	public List<Expense> findAllByUserId(UUID userId);
}