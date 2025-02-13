package ward.peter.finance_calendar.dtos;

import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.models.Expense;

import java.util.List;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {
	private User user;
	private List<Expense> expenses;
	private int month;
	private int year;
}