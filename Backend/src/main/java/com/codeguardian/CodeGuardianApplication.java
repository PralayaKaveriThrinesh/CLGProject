package com.codeguardian;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * MAIN BACKEND ENTRY POINT
 * This is the heart of the CodeGuardian server. 
 * 
 * THEORY:
 * 1. @SpringBootApplication: This annotation tells Java that this is a Spring Boot web server.
 * 2. @EnableAsync: This allows the app to perform heavy tasks (like AI code analysis) 
 *    in the background so the user interface stays fast.
 * 3. SpringApplication.run(): This command actually turns the server on.
 */
@SpringBootApplication
@EnableAsync
public class CodeGuardianApplication {
    public static void main(String[] args) {
        SpringApplication.run(CodeGuardianApplication.class, args);
    }
}

