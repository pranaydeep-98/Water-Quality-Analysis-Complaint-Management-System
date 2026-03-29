package com.Minor.Project.config;

import com.Minor.Project.model.SlaConfig;
import com.Minor.Project.repository.SlaConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SettingsInitialData implements CommandLineRunner {

    private final SlaConfigRepository slaConfigRepository;

    @Override
    public void run(String... args) {
        if (slaConfigRepository.count() == 0) {
            SlaConfig defaultConfig = SlaConfig.builder()
                    .highSeverityHours(4)
                    .mediumSeverityHours(24)
                    .lowSeverityHours(72)
                    .build();
            slaConfigRepository.save(defaultConfig);
            System.out.println("Default SLA configuration seeded.");
        }
    }
}
