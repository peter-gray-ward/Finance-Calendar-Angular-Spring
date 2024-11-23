package ward.peter.finance_calendar.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import ward.peter.finance_calendar.LoginInterceptor;

    @Configuration
    public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private LoginInterceptor loginInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/")
                .addPathPatterns("/api/**") // Specify the paths to protect
                .excludePathPatterns("/api/account/login") // Exclude login path
                .excludePathPatterns("/api/account/register") // Exclude login path
                .excludePathPatterns("/login"); // Exclude login path
    }
}
