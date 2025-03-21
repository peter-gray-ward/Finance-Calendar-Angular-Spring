package ward.peter.finance_calendar.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

import reactor.core.publisher.Mono;

import ward.peter.finance_calendar.services.EventService;
import ward.peter.finance_calendar.services.NewsService;
import ward.peter.finance_calendar.dtos.Calendar;
import ward.peter.finance_calendar.dtos.Day;
import ward.peter.finance_calendar.utils.AuthUtil;
import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.models.Event;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/event")
public class EventController {
	private EventService eventService;
	private AuthUtil authUtil;

	@Autowired
	private NewsService newsService;
	
	public EventController(EventService eventService, AuthUtil authUtil) {
		this.eventService = eventService;
		this.authUtil = authUtil;
	}

	@GetMapping("/calendar")
	public ResponseEntity<Calendar> getCalendar(User user, HttpSession session) {
		return ResponseEntity.ok(eventService.getCalendar(user, session));
	}

	@PostMapping
	public ResponseEntity<Calendar> createEvent(@RequestBody Event event, HttpSession session, User user) {
		return ResponseEntity.ok(eventService.createEvent(event, user, session));
	}
 
	@PutMapping("/{id}")
	public ResponseEntity<Calendar> saveThisEvent(@RequestBody Event event, HttpSession session, User user) {
		return ResponseEntity.ok(eventService.saveThisEvent(event, user, session));
	}

	@PutMapping("/{id}/{recurrenceid}")
	public ResponseEntity<Calendar> saveAllTheseEvents(@RequestBody Event event, HttpSession session, User user) {
		System.out.println("\tsaveAllTheseEvents");
		return ResponseEntity.ok(eventService.saveAllTheseEvents(event, user, session));
	}

	@GetMapping("/get-event-news/{keyword}/{dateStr}")
	public Mono<String> getEventNews(@PathVariable String keyword, @PathVariable String dateStr) {
		return newsService.fetchNewsForEvent(keyword, dateStr);
	}

	@DeleteMapping("/{eventId}")
	public ResponseEntity<Calendar> deleteThisEvent(@PathVariable UUID eventId, HttpSession session, User user) {
		return ResponseEntity.ok(eventService.deleteThisEvent(eventId, session, user));
	}

	@DeleteMapping("/all/{eventRecurrenceid}")
	public ResponseEntity<Calendar> deleteAllTheseEvents(@PathVariable UUID eventRecurrenceid, HttpSession session, User user) {
		return ResponseEntity.ok(eventService.deleteAllTheseEvents(eventRecurrenceid, session, user));
	}
}