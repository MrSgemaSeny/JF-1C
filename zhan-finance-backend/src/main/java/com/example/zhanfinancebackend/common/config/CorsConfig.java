package com.example.zhanfinancebackend.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:5173}") String allowedOrigins,
            @Value("${app.cors.allowed-origin-patterns:https://*.github.io,http://localhost:*,http://127.0.0.1:*,https://zhanfinance.fly.dev}") String allowedOriginPatterns
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        
        List<String> origins = split(allowedOrigins);
        List<String> normalizedOrigins = new java.util.ArrayList<>();
        for (String origin : origins) {
            normalizedOrigins.add(origin);
            if (origin.endsWith("/")) {
                normalizedOrigins.add(origin.substring(0, origin.length() - 1));
            } else {
                normalizedOrigins.add(origin + "/");
            }
        }

        configuration.setAllowedOrigins(normalizedOrigins);
        configuration.setAllowedOriginPatterns(split(allowedOriginPatterns));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> split(String value) {
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }
}
