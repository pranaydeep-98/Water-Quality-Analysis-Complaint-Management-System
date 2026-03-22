package com.Minor.Project.controller;

import com.Minor.Project.dto.HighRiskAreaDTO;
import com.Minor.Project.dto.StatsDTO;
import com.Minor.Project.dto.TrendDTO;
import com.Minor.Project.model.Notification;
import com.Minor.Project.service.ComplaintService;
import com.Minor.Project.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ComplaintService complaintService;
    private final NotificationService notificationService;

    @GetMapping("/high-risk-areas")
    public ResponseEntity<List<HighRiskAreaDTO>> getHighRiskAreas() {
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
}
