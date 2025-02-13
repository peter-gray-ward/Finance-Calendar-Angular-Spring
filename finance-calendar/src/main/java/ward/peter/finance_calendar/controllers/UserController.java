package ward.peter.finance_calendar.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import ward.peter.finance_calendar.services.UserService;

import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.dtos.Sync;
import ward.peter.finance_calendar.dtos.Authentication;

@RestController
@RequestMapping("/api/user")
public class UserController {
	private UserService userService;
	
	public UserController(UserService userService) {
		this.userService = userService;
	}

	@PostMapping("/register")
	public ResponseEntity<Authentication> register(@RequestBody User user) {
		return ResponseEntity.ok(this.userService.register(user));
	}

	@PostMapping("/login")
	public ResponseEntity<Authentication> login(@RequestBody User user, HttpServletResponse response) {
		return ResponseEntity.ok(this.userService.login(user, response));
	}

	@GetMapping("/check-auth")
	public ResponseEntity<Authentication> checkAuth(HttpServletRequest request) {
		return ResponseEntity.ok(new Authentication().builder().status("success").build());
	}

	@GetMapping("/sync")
	public ResponseEntity<Sync> sync(HttpServletRequest request) {
		return ResponseEntity.ok(this.userService.sync(request));
	}
}