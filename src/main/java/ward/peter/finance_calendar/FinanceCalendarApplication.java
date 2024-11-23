package ward.peter.finance_calendar;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FinanceCalendarApplication {
	private static final Logger logger = LoggerFactory.getLogger(FinanceCalendarApplication.class);

	public static void main(String[] args) {
		logger.info("Starting application initialization...");

		SpringApplication.run(FinanceCalendarApplication.class, args);
	}
}
