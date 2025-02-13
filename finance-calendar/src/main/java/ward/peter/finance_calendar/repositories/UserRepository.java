package ward.peter.finance_calendar.repositories;

import ward.peter.finance_calendar.models.User;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
	public User findByName(String name);
}