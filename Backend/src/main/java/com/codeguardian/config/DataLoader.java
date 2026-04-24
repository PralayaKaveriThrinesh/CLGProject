package com.codeguardian.config;

import com.codeguardian.model.Role;
import com.codeguardian.model.User;
import com.codeguardian.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Create Admin
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@codeguardian.com");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            // Create Student
            User student = new User();
            student.setName("Student User");
            student.setEmail("student@codeguardian.com");
            student.setPassword(passwordEncoder.encode("Student@123"));
            student.setRole(Role.STUDENT);
            userRepository.save(student);

            System.out.println("Default users created: admin@codeguardian.com and student@codeguardian.com");
        }
    }
}
