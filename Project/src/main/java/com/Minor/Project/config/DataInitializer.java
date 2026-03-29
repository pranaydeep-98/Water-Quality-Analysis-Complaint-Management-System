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
        if (!userRepository.existsByEmail("admin@aquawatch.com")) {
            User admin = User.builder()
                    .name("Administrator")
                    .email("admin@aquawatch.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Admin user created: admin@aquawatch.com / admin123");
        } else {
            // Always reset admin password to ensure it's known
            User admin = userRepository.findByEmail("admin@aquawatch.com").get();
            admin.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(admin);
            System.out.println("✅ Admin password reset to: admin123");
        }
    }
}
