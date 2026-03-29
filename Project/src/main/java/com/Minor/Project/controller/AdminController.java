package com.Minor.Project.controller;

import com.Minor.Project.dto.*;
import com.Minor.Project.model.Notification;
import com.Minor.Project.service.AreaRiskService;
import com.Minor.Project.service.ComplaintService;
import com.Minor.Project.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ComplaintService complaintService;
    private final NotificationService notificationService;
    private final AreaRiskService areaRiskService;
    private final com.Minor.Project.repository.SlaConfigRepository slaConfigRepository;

    @GetMapping("/area-risk")
    public ResponseEntity<List<AreaRiskDTO>> getAreaRisk() {
        return ResponseEntity.ok(areaRiskService.calculateAreaRisk());
    }

    @GetMapping("/status-summary")
    public ResponseEntity<Map<String, Long>> getStatusSummary() {
        return ResponseEntity.ok(complaintService.getStatusSummary());
    }

    @GetMapping("/complaints-trend")
    public ResponseEntity<List<TrendDTO>> getComplaintsTrend() {
        return ResponseEntity.ok(complaintService.getComplaintsTrendLast7Days());
    }

    @GetMapping("/risk-scores")
    public ResponseEntity<List<HighRiskAreaDTO>> getRiskScores() {
        return ResponseEntity.ok(complaintService.getHighRiskAreas());
    }

    @GetMapping("/trends")
    public ResponseEntity<List<TrendDTO>> getTrends() {
        return ResponseEntity.ok(complaintService.getDailyTrends());
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsDTO> getStats() {
        return ResponseEntity.ok(complaintService.getStats());
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/sla-config")
    public ResponseEntity<com.Minor.Project.model.SlaConfig> getSlaConfig() {
        return ResponseEntity.ok(slaConfigRepository.findTopByOrderByIdDesc()
                .orElse(com.Minor.Project.model.SlaConfig.builder()
                        .highSeverityHours(4)
                        .mediumSeverityHours(24)
                        .lowSeverityHours(72)
                        .build()));
    }

    @PostMapping("/sla-config")
    public ResponseEntity<com.Minor.Project.model.SlaConfig> updateSlaConfig(@RequestBody com.Minor.Project.model.SlaConfig config) {
        // We always keep only the latest one or create a new one
        slaConfigRepository.deleteAll();
        config.setId(null);
        return ResponseEntity.ok(slaConfigRepository.save(config));
    }
}
