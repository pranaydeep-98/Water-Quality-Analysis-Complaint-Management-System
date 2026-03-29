package com.Minor.Project.controller;

import com.Minor.Project.model.SlaConfig;
import com.Minor.Project.repository.SlaConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.Minor.Project.dto.SlaConfigDTO;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SettingsController {

    private final SlaConfigRepository slaConfigRepository;

    @GetMapping("/sla")
    public ResponseEntity<?> getSlaSettings() {
        return ResponseEntity.ok(slaConfigRepository.findTopByOrderByIdDesc()
                .orElse(SlaConfig.builder()
                        .highSeverityHours(4)
                        .mediumSeverityHours(24)
                        .lowSeverityHours(72)
                        .build()));
    }

    @PostMapping("/sla")
    public ResponseEntity<?> saveSlaSettings(@RequestBody SlaConfigDTO dto) {
        try {
            System.out.println("Received SLA: " + dto);

            if (dto.getHighSeveritySla() < 1 || dto.getHighSeveritySla() > 24) {
                System.out.println("Validation Error: High SLA must be between 1 and 24 hours");
                return ResponseEntity.status(400).body(Map.of("error", "High SLA must be between 1 and 24 hours"));
            }
            if (dto.getMediumSeveritySla() < 6 || dto.getMediumSeveritySla() > 72) {
                System.out.println("Validation Error: Medium SLA must be between 6 and 72 hours");
                return ResponseEntity.status(400).body(Map.of("error", "Medium SLA must be between 6 and 72 hours"));
            }
            if (dto.getLowSeveritySla() < 12 || dto.getLowSeveritySla() > 168) {
                System.out.println("Validation Error: Low SLA must be between 12 and 168 hours");
                return ResponseEntity.status(400).body(Map.of("error", "Low SLA must be between 12 and 168 hours"));
            }

            SlaConfig config = slaConfigRepository.findTopByOrderByIdDesc()
                    .orElse(new SlaConfig());
            
            config.setHighSeverityHours(dto.getHighSeveritySla());
            config.setMediumSeverityHours(dto.getMediumSeveritySla());
            config.setLowSeverityHours(dto.getLowSeveritySla());
            
            slaConfigRepository.save(config);
            
            return ResponseEntity.ok(Map.of("message", "SLA settings updated successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Server Error while saving SLA"));
        }
    }
}
