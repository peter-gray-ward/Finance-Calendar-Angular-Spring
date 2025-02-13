package ward.peter.finance_calendar.utils;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpSession;

import java.time.LocalDate;

@Component
public class SessionUtil {
	public Integer getMonth(String userId, HttpSession session) {
		Integer month = (Integer) session.getAttribute(userId + ":month");
		if (month == null) {
			LocalDate today = LocalDate.now();
			month = today.getMonthValue();
			setMonth(userId, month, session);
		}
		return month;
	}
	public Integer getYear(String userId, HttpSession session) {
		Integer year = (Integer) session.getAttribute(userId + ":year");
		if (year == null) {
			LocalDate today = LocalDate.now();
			year = today.getYear();
			setYear(userId, year, session);
		}
		return year;
	}
	public void setYear(String userId, int year, HttpSession session) {
		System.out.println("session.setYear " + year);
		session.setAttribute(userId + ":year", year);
	}
	public void setMonth(String userId, int month, HttpSession session) {
		System.out.println("session.setMonth " + month);
		session.setAttribute(userId + ":month", month);
	}
}