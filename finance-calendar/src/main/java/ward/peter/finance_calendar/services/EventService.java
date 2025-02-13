package ward.peter.finance_calendar.services;

import ward.peter.finance_calendar.repositories.EventRepository;
import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.models.Event;
import ward.peter.finance_calendar.dtos.Calendar;
import ward.peter.finance_calendar.utils.CalendarUtil;
import ward.peter.finance_calendar.utils.SessionUtil;

import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;

import java.util.*;
import java.time.LocalDate;

@Service
public class EventService {
	private EventRepository eventRepository;
	private CalendarUtil calendarUtil;
	private SessionUtil sessionUtil;

	public EventService(EventRepository eventRepository, CalendarUtil calendarUtil, SessionUtil sessionUtil) {
		this.eventRepository = eventRepository;
		this.calendarUtil = calendarUtil;
		this.sessionUtil = sessionUtil;
	}

	public Calendar getCalendar(User user, HttpSession session) {
		String userId = user.getId().toString();
		Integer month = sessionUtil.getMonth(userId, session);
		Integer year = sessionUtil.getYear(userId, session);
		List<Event> events = eventRepository.findAllByUserIdInRange(user.getId(), month, year);
		events = calendarUtil.calculateTotals(user, events);
		return new Calendar()
			.builder()
			.months(calendarUtil.getWeeks(user, month, year, events))
			.month(month)
			.year(year)
			.build();
	}
}