package ward.peter.finance_calendar.utils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.lang.reflect.*;

import org.springframework.stereotype.Component;

import ward.peter.finance_calendar.dtos.Day;
import ward.peter.finance_calendar.models.Event;
import ward.peter.finance_calendar.models.Expense;
import ward.peter.finance_calendar.models.User;

@Component
public class CalendarUtil {

    public List<List<Day>> getWeeks(User user, int month, int year, List<Event> events) {
        System.out.println("\t\t" + year + ": " + month);

        List<List<Day>> weeks = new ArrayList<>();
        String[] DOW = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};

        // Set the date to the first day of the current month
        LocalDate cal = LocalDate.of(year, month, 1);

        // Adjust date to the nearest previous Sunday
        cal = cal.minusDays(cal.getDayOfWeek().getValue() % 7);

        // Get today's date for comparison
        LocalDate today = LocalDate.now();

        List<Day> currentWeek = new ArrayList<>();

        while (weeks.size() < 6 || cal.getMonthValue() == month) {
            int dayOfMonth = cal.getDayOfMonth();
            int dayOfWeekIndex = cal.getDayOfWeek().getValue() % 7; // Sunday = 0, Monday = 1, etc.

            boolean isToday = cal.isEqual(today);
            boolean isAfterToday = isToday || cal.isAfter(today);

            Day day = new Day();
            day.setDate(dayOfMonth);
            day.setDay(DOW[dayOfWeekIndex]);
            day.setYear(cal.getYear());
            day.setMonth(cal.getMonthValue());

            // Check for events on this day
            List<Event> dayEvents = new ArrayList<>();
            for (Event event : events) {
                LocalDate eventDate = event.getDate();
                if (cal.isEqual(eventDate)) {
                    day.hasEvents = true;
                    dayEvents.add(event);
                    day.setTotal(event.getTotal());
                }
            }
            day.setEvents(dayEvents);
            day.setToday(isToday);
            day.setTodayOrLater(isAfterToday);

            if (isToday) {
                System.out.println("found today");
                day.setTotal(user.getCheckingBalance());
            } else if (!day.hasEvents) {
                day.setTotal(0.0);
            }

            currentWeek.add(day);

            // If the week has 7 days, add it to the list of weeks
            if (currentWeek.size() == 7) {
                weeks.add(currentWeek);
                currentWeek = new ArrayList<>();
            }

            // Move to the next day
            cal = cal.plusDays(1);
        }

        return weeks;
    }

    public Event cloneEvent(Event fromEvent) {
        Event newEvent = new Event();
        for (Field field : Arrays.stream(fromEvent.getClass().getDeclaredFields())
                .filter(f -> !f.getName().equals("id"))
                .toArray(Field[]::new)) {
            field.setAccessible(true);
            try {
                Object value = field.get(fromEvent);
                field.set(newEvent, value);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
        newEvent.setId(UUID.randomUUID());
        return newEvent;
    }

    public List<Event> generateEvents(User user, Event event) {
        if (event.getId() == null) {
            event.setId(UUID.randomUUID());
        }

        if (event.getUserId() == null) {
            event.setUserId(user.getId());
        }

        List<Event> events = new ArrayList<>();

        String frequency = event.getFrequency();
        LocalDate start = event.getDate();
        LocalDate end = event.getRecurrenceenddate();
        UUID userId = user.getId();
        UUID recurrenceid = UUID.randomUUID();
        event.setRecurrenceid(recurrenceid);

        while (!start.isAfter(end)) {
            event.setDate(start);
            event.setRecurrenceenddate(end);
            
            events.add(event);

            switch (frequency) {
                case "daily" -> start = start.plusDays(1);
                case "weekly" -> start = start.plusWeeks(1);
                case "biweekly" -> start = start.plusWeeks(2);
                case "monthly" -> start = start.plusMonths(1);
                case "yearly" -> start = start.plusYears(1);
            }
        }

        return events;
    }

    public List<Event> generateEventsFromExpenses(User user, List<Expense> expenses) {
        List<Event> events = new ArrayList<>();

        for (Expense expense : expenses) {
            String frequency = expense.getFrequency();

            LocalDate start = expense.getStartdate();
            LocalDate end = expense.getRecurrenceenddate();

            UUID userId = expense.getUserId();
            UUID recurrenceid = UUID.randomUUID();

            while (!start.isAfter(end)) {
                Event event = new Event(
                    UUID.randomUUID(),
                    recurrenceid,
                    expense.getName(),
                    start,
                    end,
                    expense.getAmount(),
                    0.0,
                    expense.getAmount(),
                    false,
                    frequency,
                    userId
                );

                events.add(event);

                // Increment `start` based on the frequency
                switch (frequency) {
                    case "daily" -> start = start.plusDays(1);
                    case "weekly" -> start = start.plusWeeks(1);
                    case "biweekly" -> start = start.plusWeeks(2);
                    case "monthly" -> start = start.plusMonths(1);
                    case "yearly" -> start = start.plusYears(1);
                }
            }
        }

        events = this.calculateTotals(user, events);

        return events;
    }

    public List<Event> calculateTotals(User user, List<Event> events) {
        double total = user.getCheckingBalance();
        LocalDate today = LocalDate.now().atStartOfDay().toLocalDate();

        events = events.stream()
                .sorted(Comparator.comparing(event -> event.getDate()))
                .collect(Collectors.toList());

        boolean started = false;
        for (Event event : events) {
            LocalDate eventDate = event.getDate().atStartOfDay().toLocalDate();
            if ((!started && eventDate.isEqual(today)) || (!started && eventDate.isAfter(today))) {
                started = true;
            }
            if (started) {
                if (!event.getExclude()) {
                    total += event.getAmount();
                }
                event.setTotal(total);
            } else {
                event.setTotal(0.0);
            }
        }
        return events;
    }
}
