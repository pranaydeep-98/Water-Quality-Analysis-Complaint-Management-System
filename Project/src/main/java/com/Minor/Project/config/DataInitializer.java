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
        if (userRepository.findByEmail("admin@aquawatch.com").isEmpty()) {
            User admin = User.builder()
                    .name("System Admin")
                    .email("admin@aquawatch.com")
                    .password(passwordEncoder.encode("123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ DEFAULT ADMIN CREATED: admin@aquawatch.com / 123");
        } else {
            // Optional: Reset password if needed for debugging
            User admin = userRepository.findByEmail("admin@aquawatch.com").get();
            admin.setPassword(passwordEncoder.encode("123"));
            userRepository.save(admin);
            System.out.println("🔄 ADMIN PASSWORD RESET FOR DEBUGGING: admin@aquawatch.com / 123");
        }
    }
}
