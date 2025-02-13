package ward.peter.finance_calendar.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.nio.charset.StandardCharsets;
import java.security.Key;

import ward.peter.finance_calendar.dtos.Authentication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.annotation.Value;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.*;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    public static final String COOKIE_NAME = "fcToken";
    private static final String AUTH_ERROR_MESSAGE = "User authentication failed.";

    @Value("${jwt.secret}")
    private String secretKey;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
    
    private static final String[] EXCLUDED_PATHS = {
        "/api/user/login",
        "/api/user/register",
        "/static"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String path = request.getServletPath();

        System.out.println("doFilterInternal: " + path);

        if (isExcluded(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<Cookie> jwtAuthCookie = getCookie(request, COOKIE_NAME);
        if (jwtAuthCookie.isPresent()) {
            String jwt = jwtAuthCookie.get().getValue();

            try {
                Claims claims = validateToken(jwt);
                String username = claims.getSubject();

                authenticateUser(request, username);

            } catch (Exception e) {
                logger.error("Invalid JWT: " + e.getMessage());
            }
        } else {
            System.out.println("missing cookie");
        }

        filterChain.doFilter(request, response);
    }

    private Claims validateToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("JWT token is expired", e);
        } catch (UnsupportedJwtException e) {
            throw new RuntimeException("JWT token is unsupported", e);
        } catch (MalformedJwtException e) {
            throw new RuntimeException("JWT token is malformed", e);
        } catch (io.jsonwebtoken.SignatureException e) {
            throw new RuntimeException("JWT signature is invalid", e);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("JWT claims string is empty", e);
        }
    }

    private void authenticateUser(HttpServletRequest request, String userId) {
        logger.info("Authenticating user.");

        UserDetails userDetails = new User(userId, "", Collections.emptyList());
        UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        
        // Store authentication in SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        // Persist SecurityContext in session
        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, SecurityContextHolder.getContext());
    }

    private Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        if (request.getCookies() != null) {
            return Arrays.stream(request.getCookies())
                    .filter(cookie -> name.equals(cookie.getName()))
                    .findFirst();
        }
        return Optional.empty();
    }

    private boolean isExcluded(String path) {
        if ("/".equals(path)) return true;
        String normalizedPath = path.toLowerCase();
        return Arrays.stream(EXCLUDED_PATHS).anyMatch(normalizedPath::startsWith);
    }
}
