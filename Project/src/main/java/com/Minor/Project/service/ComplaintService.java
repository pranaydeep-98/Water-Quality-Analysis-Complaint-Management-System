package com.Minor.Project.service;

import com.Minor.Project.dto.*;
import com.Minor.Project.model.*;
import com.Minor.Project.repository.ComplaintRepository;
import com.Minor.Project.repository.UserRepository;
import com.Minor.Project.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Transactional
    public Complaint save(ComplaintRequest request, String token) {
        String email = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        String severity = "LOW";
        int severityWeight = 1;
        if (request.getIssueType() != null) {
            String issueType = request.getIssueType().toLowerCase();
            if (issueType.contains("contamination") || issueType.contains("no water supply")) {
                severity = "HIGH";
                severityWeight = 3;
            } else if (issueType.contains("leakage") || issueType.contains("low pressure")) {
                severity = "MEDIUM";
                severityWeight = 2;
            }
        }

        LocalDate deadline = LocalDate.now();
        if ("HIGH".equals(severity)) {
            deadline = deadline.plusDays(2);
        } else if ("MEDIUM".equals(severity)) {
            deadline = deadline.plusDays(4);
        } else {
            deadline = deadline.plusDays(7);
        }

        long duplicates = complaintRepository.countByArea(request.getArea());
        int riskScore = (severityWeight * 20) + (int) (duplicates * 5);
        if (riskScore > 100)
            riskScore = 100;

        Complaint complaint = Complaint.builder()
                .area(request.getArea())
                .phoneNumber(request.getPhoneNumber())
                .zone(request.getZone())
                .issueType(request.getIssueType())
                .severity(severity)
                .status("Pending")
                .riskScore(riskScore)
                .remarks("System registered.")
                .createdDate(LocalDate.now())
                .deadline(deadline)
                .lastUpdatedAt(LocalDateTime.now())
                .userId(user.getId())
                .build();

        Complaint saved = complaintRepository.save(complaint);

        notificationService.createNotification(
                "New complaint registered at " + saved.getArea(), "ADMIN", saved.getArea());

        if (riskScore > 75) {
            notificationService.createNotification(
                    "CRITICAL: High risk complaint detected in " + saved.getArea(), "ADMIN", saved.getArea());
        }

        return saved;
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public List<Complaint> getUserComplaints(String token) {
        String email = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return complaintRepository.findByUserId(user.getId());
    }

    @Transactional
    public void updateStatus(Long id, String status, String remarks) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus(status);
        if (remarks != null && !remarks.isEmpty()) {
            complaint.setRemarks(remarks);
        }
        complaint.setLastUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        notificationService.createNotification(
                "Action Taken: Complaint #" + id + " updated to " + status, "USER", complaint.getArea());
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkEscalation() {
        LocalDate threshold = LocalDate.now().minusDays(2);
        List<Complaint> overdue = complaintRepository.findByCreatedDateBeforeAndStatusNot(
                threshold, "Resolved");

        for (Complaint c : overdue) {
            if (!"Escalated".equals(c.getStatus()) && !"Resolved".equals(c.getStatus())) {
                c.setStatus("Escalated");
                c.setRemarks("Auto-escalated by system due to SLA breach.");
                c.setLastUpdatedAt(LocalDateTime.now());
                complaintRepository.save(c);

                notificationService.createNotification(
                        "ALARM: Complaint #" + c.getId() + " escalated at " + c.getArea(), "ADMIN", c.getArea());
            }
        }
    }

    public List<HighRiskAreaDTO> getHighRiskAreas() {
        return complaintRepository.countComplaintsByArea()
                .stream()
                .map(obj -> new HighRiskAreaDTO((String) obj[0], (Long) obj[1]))
                .collect(Collectors.toList());
    }

    public StatsDTO getStats() {
        long highSeverityCount = complaintRepository.countBySeverity("HIGH");
        long pendingCount = complaintRepository.findByStatus("Pending").size();
        long inProgressCount = complaintRepository.findByStatus("In Progress").size();
        long resolvedCount = complaintRepository.findByStatus("Resolved").size();
        long escalatedCount = complaintRepository.findByStatus("Escalated").size();

        // Overdue count logic
        long overdueCount = complaintRepository.findAll().stream()
                .filter(c -> !"Resolved".equals(c.getStatus()) && c.getDeadline() != null
                        && c.getDeadline().isBefore(LocalDate.now()))
                .count();

        return StatsDTO.builder()
                .totalComplaints(complaintRepository.count())
                .highSeverityCount(highSeverityCount)
                .openCount(pendingCount + inProgressCount + escalatedCount)
                .resolvedCount(resolvedCount)
                .build();
    }

    // Extra helper for Dashboard to fulfill simplified requirements
    public Object getDashboardMetrics() {
        long total = complaintRepository.count();
        long pending = complaintRepository.findByStatus("Pending").size();
        long resolved = complaintRepository.findByStatus("Resolved").size();
        long overdue = complaintRepository.findAll().stream()
                .filter(c -> !"Resolved".equals(c.getStatus()) && c.getDeadline() != null
                        && c.getDeadline().isBefore(LocalDate.now()))
                .count();

        return java.util.Map.of(
                "total", total,
                "pending", pending,
                "overdue", overdue,
                "resolved", resolved);
    }
}
