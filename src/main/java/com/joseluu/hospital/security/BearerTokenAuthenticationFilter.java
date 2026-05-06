package com.joseluu.hospital.security;

import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Component
public class BearerTokenAuthenticationFilter extends OncePerRequestFilter {
    private final AuthService authService;

    public BearerTokenAuthenticationFilter(AuthService authService) {
        this.authService = authService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return HttpMethod.OPTIONS.matches(request.getMethod())
                || "/api/auth/login".equals(path)
                || "/api/auth/refresh".equals(path)
                || "/api/auth/forgot-password".equals(path)
                || "/api/auth/reset-password".equals(path)
                || "/actuator/health".equals(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            UserDto user = authService.getUserFromBearer(authorization);
            AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(user);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    principal.getAuthorities()
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (ResponseStatusException exception) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Token no valido\"}");
        }
    }
}
