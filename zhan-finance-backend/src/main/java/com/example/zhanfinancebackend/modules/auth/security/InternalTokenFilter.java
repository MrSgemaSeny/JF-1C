package com.example.zhanfinancebackend.modules.auth.security;

import com.example.zhanfinancebackend.common.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.UUID;

@Component
public class InternalTokenFilter extends OncePerRequestFilter {

    public static final String INTERNAL_TOKEN_HEADER = "X-Internal-Token";
    public static final String INTERNAL_BOT_PRINCIPAL = "INTERNAL_BOT_SYSTEM";
    public static final String ROLE_INTERNAL_BOT = "ROLE_INTERNAL_BOT";

    private final String configuredToken;
    private final ObjectMapper objectMapper;

    public InternalTokenFilter(String configuredToken, ObjectMapper objectMapper) {
        this(configuredToken, objectMapper, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public InternalTokenFilter(
            @Value("${app.security.internal-bot-token:}") String configuredToken,
            ObjectMapper objectMapper,
            org.springframework.core.env.Environment env
    ) {
        String trimmed = configuredToken != null ? configuredToken.trim() : "";
        boolean isTest = env == null || java.util.Arrays.asList(env.getActiveProfiles()).contains("test");
        boolean isProd = env != null && java.util.Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (!isTest && isProd && (trimmed.toLowerCase().contains("dev-") || trimmed.toLowerCase().contains("default-secret") || trimmed.length() < 32)) {
            throw new IllegalStateException("CRITICAL: Default or insecure INTERNAL_BOT_TOKEN is strictly forbidden in production. Minimum 32 characters required.");
        }
        this.configuredToken = trimmed;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String servletPath = request.getServletPath();
        String requestUri = request.getRequestURI();

        boolean isInternal = (servletPath != null && servletPath.startsWith("/v1/internal"))
                || (requestUri != null && (requestUri.startsWith("/api/v1/internal") || requestUri.startsWith("/v1/internal")));

        if (!isInternal) {
            filterChain.doFilter(request, response);
            return;
        }

        String providedToken = request.getHeader(INTERNAL_TOKEN_HEADER);

        if (providedToken != null) {
            if (!isValidToken(providedToken)) {
                sendUnauthorizedResponse(request, response);
                return;
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    INTERNAL_BOT_PRINCIPAL,
                    null,
                    List.of(new SimpleGrantedAuthority(ROLE_INTERNAL_BOT))
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isValidToken(String providedToken) {
        if (providedToken == null || configuredToken.isEmpty()) {
            return false;
        }
        byte[] expectedBytes = configuredToken.getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = providedToken.trim().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expectedBytes, providedBytes);
    }

    private void sendUnauthorizedResponse(HttpServletRequest request, HttpServletResponse response) throws IOException {
        SecurityContextHolder.clearContext();
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ErrorResponse errorResponse = new ErrorResponse(
                HttpServletResponse.SC_UNAUTHORIZED,
                "UNAUTHORIZED",
                "Invalid or missing internal token",
                request.getRequestURI(),
                UUID.randomUUID().toString()
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
