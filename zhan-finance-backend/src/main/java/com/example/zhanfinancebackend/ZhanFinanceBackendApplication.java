package com.example.zhanfinancebackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableCaching
public class ZhanFinanceBackendApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(ZhanFinanceBackendApplication.class, args);
    }

    private static void loadDotEnv() {
        java.io.File[] candidates = new java.io.File[] {
            new java.io.File(".env"),
            new java.io.File("zhan-finance-backend/.env")
        };
        for (java.io.File envFile : candidates) {
            if (envFile.exists() && envFile.isFile()) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(envFile))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                            int eqIdx = line.indexOf('=');
                            String key = line.substring(0, eqIdx).trim();
                            String val = line.substring(eqIdx + 1).trim();
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
                break;
            }
        }
    }

}
