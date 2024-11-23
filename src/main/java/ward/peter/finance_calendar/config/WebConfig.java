package ward.peter.finance_calendar.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Configure static resource handling.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static files from the /static directory
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
    }

    /**
     * Configure view controllers for simple mappings.
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Map "/" to "index.html" without a dedicated controller
        registry.addViewController("/")
                .setViewName("index");
    }

    /**
     * Configure CORS globally.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Allow CORS for specific paths
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000") // Frontend URL
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    /**
     * Register custom interceptors.
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Add an interceptor to log requests or perform other tasks
        registry.addInterceptor(new LoggingInterceptor())
                .addPathPatterns("/**")
                .excludePathPatterns("/static/**", "/error");
    }

    /**
     * Register custom formatters or converters.
     */
    @Override
    public void addFormatters(FormatterRegistry registry) {
        // Example: Custom converter for parsing dates
        registry.addConverter(new CustomDateConverter());
    }
}
