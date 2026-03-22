package com.Minor.Project.config;

import com.Minor.Project.model.Role;
import com.Minor.Project.model.User;
import com.Minor.Project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Only insert admin if does not already exist
        if (!userRepository.existsByEmail("admin@aquawatch.com")) {
            User admin = User.builder()
                    .name("Administrator")
                    .email("admin@aquawatch.com")
                    .password(passwordEncoder.encode("123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Admin user created successfully: admin@aquawatch.com / 123");
        } else {
            System.out.println("✅ Admin user already exists — skipping creation");
        }
    }
}
