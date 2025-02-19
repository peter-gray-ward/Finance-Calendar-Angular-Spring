package ward.peter.finance_calendar.services;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import jakarta.annotation.PostConstruct;

@Service
public class NewsService {

	@Value("${news.api.base-url}")
	private String apiBaseUrl;
	@Value("${news.api.key}")
	private String apiKey;

	private final WebClient.Builder webClientBuilder;
	private WebClient webClient;

	private final DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd");

	public NewsService(WebClient.Builder webClientBuilder) {
		this.webClientBuilder = webClientBuilder;
	}

	@PostConstruct
	private void init() {
		this.webClient = webClientBuilder.baseUrl(this.apiBaseUrl).build();
	}

	public Mono<String> fetchNewsForEvent(String eventKeyword, String dateStr) {
		return webClient.get()
			.uri(uriBuilder -> uriBuilder
				.queryParam("q", eventKeyword)
				.queryParam("from", dateStr)
				.queryParam("to", dateStr)
				.queryParam("apiKey", apiKey)
				.build()
			)
			.retrieve()
			.bodyToMono(String.class);
	}

}
