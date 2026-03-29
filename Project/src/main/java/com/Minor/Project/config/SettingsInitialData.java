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

    public void run(String... args) {
        if (slaConfigRepository.count() == 0) {
            SlaConfig defaultConfig = SlaConfig.builder()
                    .highSeverityHours(24)
                    .mediumSeverityHours(48)
                    .lowSeverityHours(72)
                    .build();
            slaConfigRepository.save(defaultConfig);
            System.out.println("Default SLA configuration seeded.");
        } else {
            SlaConfig existingConfig = slaConfigRepository.findAll().get(0);
            existingConfig.setHighSeverityHours(24);
            existingConfig.setMediumSeverityHours(48);
            existingConfig.setLowSeverityHours(72);
            slaConfigRepository.save(existingConfig);
            System.out.println("Existing SLA configuration updated to new SLA hours.");
        }
    }
}
