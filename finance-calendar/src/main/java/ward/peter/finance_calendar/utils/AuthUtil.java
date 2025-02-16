package ward.peter.finance_calendar.utils;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.*;

import jakarta.servlet.http.HttpServletRequest;

import ward.peter.finance_calendar.repositories.UserRepository;
import ward.peter.finance_calendar.models.User;

@Component
public class AuthUtil {

    private UserRepository userRepository;

    @Value("${jwt.secret}")
    private String secretKey;

    public AuthUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, Map<String, Object> claims) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1-hour expiry
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims validateToken(String token) {
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
        } catch (SignatureException e) {
            throw new RuntimeException("JWT signature is invalid", e);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("JWT claims string is empty", e);
        }
    }

    public Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        return Optional.ofNullable(request.getCookies())
                .flatMap(cookies -> Arrays.stream(cookies)
                        .filter(cookie -> name.equals(cookie.getName()))
                        .findFirst());
    }

    public User getRequestUser(HttpServletRequest request) {
        Optional<Cookie> fcTokenCookie = getCookie(request, "fcToken");
        if (fcTokenCookie.isPresent()) {
            String fcToken = fcTokenCookie.get().getValue();
            Claims claims = validateToken(fcToken);
            String username = claims.getSubject();
            User user = userRepository.findByName(username);
            return user;
        }
        return null;
    }
}
