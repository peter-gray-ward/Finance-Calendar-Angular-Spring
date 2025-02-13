package ward.peter.finance_calendar.services;

import java.util.*;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.core.context.SecurityContextHolder;

import io.jsonwebtoken.Claims;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import ward.peter.finance_calendar.utils.AuthUtil;
import ward.peter.finance_calendar.repositories.UserRepository;
import ward.peter.finance_calendar.repositories.ExpenseRepository;
import ward.peter.finance_calendar.models.User;
import ward.peter.finance_calendar.models.Expense;
import ward.peter.finance_calendar.dtos.Sync;
import ward.peter.finance_calendar.dtos.Calendar;
import ward.peter.finance_calendar.dtos.Account;
import ward.peter.finance_calendar.dtos.Authentication;
import ward.peter.finance_calendar.services.EventService;

import ward.peter.finance_calendar.security.JwtAuthFilter;

@Service
public class UserService {
	private UserRepository userRepository;
	private BCryptPasswordEncoder passwordEncoder;
	private ExpenseRepository expenseRepository;
	private EventService eventService;
	private AuthUtil authUtil;

	public UserService(
		UserRepository userRepository, 
		@Lazy BCryptPasswordEncoder passwordEncoder, 
		AuthUtil authUtil, 
		ExpenseRepository expenseRepository,
		EventService eventService
	) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authUtil = authUtil;
		this.expenseRepository = expenseRepository;
		this.eventService = eventService;
	}

	public Authentication register(User user) {
		User dbuser = this.userRepository.findByName(user.getName());


		if (dbuser != null) {
			return new Authentication().builder()
				.status("failure")
				.message("Username " + user.getName() + " is already taken")
				.build();
		}

		String hashedPassword = this.passwordEncoder.encode(user.getPassword());

		user.setPassword(hashedPassword);

		this.userRepository.save(user);

		return new Authentication().builder()
				.status("success")
				.message("Username " + user.getName() + " has been registered.")
				.user(user)
				.build();
	}

	public Authentication login(User user, HttpServletResponse response, HttpSession session) {
		User dbuser = this.userRepository.findByName(user.getName());


		System.out.println("Logging in");

		if (dbuser == null) {
			return null;
		}

        if (passwordEncoder.matches(user.getPassword(), dbuser.getPassword())) {
        	String userId = dbuser.getId().toString();
        	Map<String, Object> claims = new HashMap<>();
        	claims.put("userId", userId);
        	claims.put("role", dbuser.getRole());
            String jwt = authUtil.generateToken(dbuser.getName(), claims);

            Cookie jwtCookie = new Cookie(JwtAuthFilter.COOKIE_NAME, jwt);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge(3600);

            response.addCookie(jwtCookie);

        	session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());

        	LocalDate today = LocalDate.now();

        	session.setAttribute(userId + ":month", today.getMonthValue());
        	session.setAttribute(userId + ":year", today.getYear());

            return new Authentication().builder()
            	.status("success")
            	.message("User " + dbuser.getName() + " has logged-in.")
            	.user(dbuser)
            	.build();
        } else {
        	return new Authentication().builder()
				.status("failure")
				.message("Invalid password")
				.build();
        }
	}

	public Sync sync(HttpServletRequest request) {
		User user = authUtil.getRequestUser(request);
		List<Expense> expenses = expenseRepository.findAllByUserId(user.getId());

		return new Sync().builder()
			.account(new Account().builder()
				.user(user)
				.expenses(expenses)
				.build()
			)
			.build();
	}

	public Calendar saveCheckingBalance(User user, Double balance, HttpSession session) {
		user.setCheckingBalance(balance);
		userRepository.save(user);
		return eventService.getCalendar(user, session);
	}


}