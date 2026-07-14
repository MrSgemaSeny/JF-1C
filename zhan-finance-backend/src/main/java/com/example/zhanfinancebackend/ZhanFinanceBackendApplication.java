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
        SpringApplication.run(ZhanFinanceBackendApplication.class, args);
    }

}
