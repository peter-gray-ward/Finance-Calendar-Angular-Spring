package ward.peter.finance_calendar.repositories;

import ward.peter.finance_calendar.models.Event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, UUID> {}