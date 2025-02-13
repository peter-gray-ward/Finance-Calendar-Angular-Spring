package ward.peter.finance_calendar.services;

import ward.peter.finance_calendar.repositories.EventRepository;
import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.models.Event;
import ward.peter.finance_calendar.dtos.Calendar;
import ward.peter.finance_calendar.utils.CalendarUtil;

import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;

import java.util.*;
import java.time.LocalDate;

@Service
public class EventService {
	private EventRepository eventRepository;
	private CalendarUtil calendarUtil;

	public EventService(EventRepository eventRepository, CalendarUtil calendarUtil) {
		this.eventRepository = eventRepository;
		this.calendarUtil = calendarUtil;
	}

	public Calendar getCalendar(User user, HttpSession session) {
		String userId = user.getId().toString();
		Integer month = (Integer) session.getAttribute(userId + ":month");
		Integer year = (Integer) session.getAttribute(userId + ":year");
		if (month == null || year == null) {
			LocalDate today = LocalDate.now();
			month = today.getMonthValue();
			year = today.getYear();
			session.setAttribute(userId + ":month", month);
			session.setAttribute(userId + ":year", year);
		}
		List<Event> events = eventRepository.findAllByUserIdInRange(user.getId(), month, year);
		events = calendarUtil.calculateTotals(user, events);
		return new Calendar()
			.builder()
			.months(calendarUtil.getWeeks(user, month, year, events))
			.build();
	}
}