package ward.peter.finance_calendar.dtos;

import java.util.List;

import ward.peter.finance_calendar.models.Event;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Day {
	private Integer date;
	private String day;
	private List<Event> events;
	public boolean hasEvents = false;
	private Integer year;
	private Integer month;
	private Boolean todayOrLater;
	private Boolean today;
	private Double total;
}