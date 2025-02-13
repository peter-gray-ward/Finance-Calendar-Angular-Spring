package ward.peter.finance_calendar.repositories;

import ward.peter.finance_calendar.models.Event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, UUID> {

	@Query(value = "SELECT * FROM event e WHERE e.user_id = :userId " +
                   "AND e.date >= DATE_TRUNC('month', TO_DATE(:year || '-' || :month || '-01', 'YYYY-MM-DD') - INTERVAL '1 month') " +
                   "AND e.date < DATE_TRUNC('month', TO_DATE(:year || '-' || :month || '-01', 'YYYY-MM-DD') + INTERVAL '2 months')",
           nativeQuery = true)
    List<Event> findAllByUserIdInRange(@Param("userId") UUID userId,
                                       @Param("month") int month,
                                       @Param("year") int year);
}
