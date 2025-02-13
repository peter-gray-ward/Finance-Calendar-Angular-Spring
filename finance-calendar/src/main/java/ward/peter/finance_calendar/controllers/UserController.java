package ward.peter.finance_calendar.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import ward.peter.finance_calendar.services.UserService;

import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.utils.AuthUtil;
import ward.peter.finance_calendar.dtos.Sync;
import ward.peter.finance_calendar.dtos.Authentication;
import ward.peter.finance_calendar.dtos.Calendar;

@RestController
@RequestMapping("/api/user")
public class UserController {
	private UserService userService;
	private AuthUtil authUtil;
	
	public UserController(UserService userService, AuthUtil authUtil) {
		this.userService = userService;
		this.authUtil = authUtil;
	}

	@PostMapping("/register")
	public ResponseEntity<Authentication> register(@RequestBody User user) {
		return ResponseEntity.ok(this.userService.register(user));
	}

	@PostMapping("/login")
	public ResponseEntity<Authentication> login(@RequestBody User user, HttpServletResponse response, HttpSession session) {
		return ResponseEntity.ok(this.userService.login(user, response, session));
	}

	@GetMapping("/check-auth")
	public ResponseEntity<Authentication> checkAuth(HttpServletRequest request) {
		return ResponseEntity.ok(new Authentication().builder().status("success").build());
	}

	@GetMapping("/sync")
	public ResponseEntity<Sync> sync(HttpServletRequest request) {
		return ResponseEntity.ok(this.userService.sync(request));
	}

	@PostMapping("/save-checking-balance/{balance}")
	public ResponseEntity<Calendar> saveCheckingBalance(HttpServletRequest request, @PathVariable Double balance) {
		User user = authUtil.getRequestUser(request);
		HttpSession session = request.getSession(true);
		return ResponseEntity.ok(this.userService.saveCheckingBalance(user, balance, session));
	}
}