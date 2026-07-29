package com.example.zhanfinancebackend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.registerCustomCache("dashboard",
                Caffeine.newBuilder().expireAfterWrite(60, TimeUnit.SECONDS).maximumSize(100).build());
        manager.registerCustomCache("tasks",
                Caffeine.newBuilder().expireAfterWrite(30, TimeUnit.SECONDS).maximumSize(500).build());
        manager.registerCustomCache("users",
                Caffeine.newBuilder().expireAfterWrite(300, TimeUnit.SECONDS).maximumSize(200).build());
        manager.registerCustomCache("courses",
                Caffeine.newBuilder().expireAfterWrite(120, TimeUnit.SECONDS).maximumSize(100).build());
        manager.registerCustomCache("pipelines",
                Caffeine.newBuilder().expireAfterWrite(600, TimeUnit.SECONDS).maximumSize(50).build());
        manager.setCaffeine(
                Caffeine.newBuilder().expireAfterWrite(60, TimeUnit.SECONDS).maximumSize(300));
        return manager;
    }
}
