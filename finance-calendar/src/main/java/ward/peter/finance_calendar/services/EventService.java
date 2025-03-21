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
import java.time.temporal.ChronoUnit;
import java.lang.reflect.*;

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

    public Calendar createEvent(Event event, User user, HttpSession session) {
        List<Event> events = calendarUtil.generateEvents(user, event);
        eventRepository.saveAllAndFlush(events);
        return getCalendar(user, session);
    }

    public Calendar saveThisEvent(Event event, User user, HttpSession session) {
        Optional<Event> _currentEvent = eventRepository.findById(event.getId());
        if (_currentEvent.isPresent()) {
            Event currentEvent = _currentEvent.get();
            if (!currentEvent.getDate().equals(event.getDate())) {
                event.setRecurrenceid(UUID.randomUUID());
            }
            eventRepository.save(event);
        }
        return getCalendar(user, session);
    }

    public Calendar saveAllTheseEvents(Event event, User user, HttpSession session) {
        Optional<Event> _currentEvent = eventRepository.findById(event.getId());
        System.out.println("\t\tsaveAllTheseEvents");
        if (_currentEvent.isPresent()) {
            System.out.println("\t\t\tsaveAllTheseEvents");
            Event currentEvent = _currentEvent.get();
            List<Event> events = eventRepository.findAllByRecurrenceid(event.getRecurrenceid());

            // date shift
            if (!currentEvent.getDate().equals(event.getDate())) {
                long daysDiff = ChronoUnit.DAYS.between(currentEvent.getDate(), event.getDate());
                for (Event e : events) {
                    e.setDate(e.getDate().plusDays(daysDiff));
                }
            }

            // recurrence end change
            if (!currentEvent.getRecurrenceenddate().equals(event.getRecurrenceenddate())) {
                LocalDate newEnd = event.getRecurrenceenddate();
                if (event.getRecurrenceenddate().isAfter(currentEvent.getRecurrenceenddate())) {
                    Event lastEvent = events.stream().max(Comparator.comparing(Event::getDate)).get();
                    LocalDate start = lastEvent.getDate();
                    while (start.isBefore(newEnd)) {
                        switch (event.getFrequency()) {
                            case "daily" -> start = start.plusDays(1);
                            case "weekly" -> start = start.plusWeeks(1);
                            case "biweekly" -> start = start.plusWeeks(2);
                            case "monthly" -> start = start.plusMonths(1);
                            case "yearly" -> start = start.plusYears(1);
                        }
                        Event newEvent = calendarUtil.cloneEvent(event);
                        newEvent.setDate(start);
                        events.add(newEvent);
                    }
                } else if (event.getRecurrenceenddate().isBefore(currentEvent.getRecurrenceenddate())) {
                    events = events.stream().filter(e -> e.getDate().isBefore(newEnd)).toList();
                }
            }

            System.out.println("\t\t\t\tsaveAllTheseEvents");
            for (Event e : events) {
                for (Field field : Arrays.stream(e.getClass().getDeclaredFields())
                        .filter(f -> !f.getName().equals("id") && !f.getName().equals("date"))
                        .toArray(Field[]::new)) {
                    field.setAccessible(true);
                    try {
                        Object value = field.get(event);
                        field.set(e, value);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            }

            eventRepository.saveAll(events);
        }
        return getCalendar(user, session);
    }

    public Calendar deleteThisEvent(UUID eventId, HttpSession session, User user) {
        eventRepository.deleteById(eventId);
        return getCalendar(user, session);
    }

    public Calendar deleteAllTheseEvents(UUID eventRecurrenceid, HttpSession session, User user) {
        eventRepository.deleteByRecurrenceid(eventRecurrenceid);
        return getCalendar(user, session);
    }
}