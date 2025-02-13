package ward.peter.finance_calendar.dtos;

import ward.peter.finance_calendar.models.User;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Authentication {
	private String status;
	private String message;
	private User user;
}