package ward.peter.finance_calendar.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import ward.peter.finance_calendar.services.EventService;
import ward.peter.finance_calendar.dtos.Calendar;
import ward.peter.finance_calendar.dtos.Day;
import ward.peter.finance_calendar.utils.AuthUtil;
import ward.peter.finance_calendar.models.User;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/event")
public class EventController {
	private EventService eventService;
	private AuthUtil authUtil;
	
	public EventController(EventService eventService, AuthUtil authUtil) {
		this.eventService = eventService;
		this.authUtil = authUtil;
	}

	@GetMapping("/calendar")
	public ResponseEntity<Calendar> getCalendar(HttpServletRequest request) {
		User user = authUtil.getRequestUser(request);
		HttpSession session = request.getSession(true);
		return ResponseEntity.ok(eventService.getCalendar(user, session));
	}

}