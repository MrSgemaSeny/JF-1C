package com.example.zhanfinancebackend.common.config;

import com.example.zhanfinancebackend.modules.auth.security.ApiRateLimitFilter;
import com.example.zhanfinancebackend.modules.auth.security.AuthRateLimitFilter;
import com.example.zhanfinancebackend.modules.auth.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import com.example.zhanfinancebackend.common.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.security.config.Customizer;

import java.time.LocalDateTime;
import java.util.UUID;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthRateLimitFilter authRateLimitFilter,
            ApiRateLimitFilter apiRateLimitFilter,
            AuthenticationProvider authenticationProvider,
            CorsConfigurationSource corsConfigurationSource
    ) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .headers(headers -> headers
                    .contentSecurityPolicy(csp -> csp.policyDirectives(
                        "default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' data: https:; " +
                        "connect-src 'self' wss://zhanfinance.fly.dev https://zhanfinance.fly.dev"
                    ))
                    .frameOptions(frame -> frame.deny())
                    .contentTypeOptions(Customizer.withDefaults())
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            ErrorResponse errorResponse = new ErrorResponse(
                                    401,
                                    "UNAUTHORIZED",
                                    "Unauthorized",
                                    request.getRequestURI(),
                                    UUID.randomUUID().toString()
                            );
                            ObjectMapper mapper = new ObjectMapper();
                            mapper.findAndRegisterModules(); // Support LocalDateTime
                            response.getWriter().write(mapper.writeValueAsString(errorResponse));
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/contact-requests",
                                "/api/contact-requests/*/files",
                                "/api/services",
                                "/api/services/highlighted",
                                "/api/courses/certificates/verify/**",
                                "/uploads/avatars/**",
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).hasRole("ADMIN")
                        .requestMatchers("/api/internal/**").denyAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(apiRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
