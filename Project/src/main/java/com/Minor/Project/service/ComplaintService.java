package com.Minor.Project.service;

import com.Minor.Project.dto.*;
import com.Minor.Project.model.*;
import com.Minor.Project.repository.ComplaintRepository;
import com.Minor.Project.repository.UserRepository;
import com.Minor.Project.repository.ComplaintActivityRepository;
import com.Minor.Project.repository.SlaConfigRepository;
import com.Minor.Project.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ComplaintActivityRepository activityRepository;
    private final SlaConfigRepository slaConfigRepository;
    private final JwtUtil jwtUtil;

    @Value("${duplicate.timeWindowHours:24}")
    private int timeWindowHours;

    @Value("${risk.alert.threshold:75}")
    private int riskAlertThreshold;

    @Transactional
    public Complaint save(ComplaintRequest request, String token) {
        String email = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Normalize Data
        String normalizedArea = request.getArea() != null ? request.getArea().trim().toLowerCase() : "";
        String normalizedIssue = request.getIssueType() != null ? request.getIssueType().trim().toLowerCase() : "";

        // Determine Severity and Weight
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

        // 2. Fetch Matching Complaints (Last 24 hours) - Use normalized values
        LocalDateTime since = LocalDateTime.now().minusHours(timeWindowHours);
        List<Complaint> matches = complaintRepository.findByAreaIgnoreCaseAndIssueTypeIgnoreCaseAndCreatedDateAfter(
            normalizedArea, normalizedIssue, since
        );

        // 3. Unique User Counting
        Set<Long> uniqueUserIds = matches.stream()
                .map(Complaint::getUserId)
                .collect(Collectors.toSet());
        
        // 4. Handle Repeat User
        boolean repeatUser = uniqueUserIds.contains(user.getId());
        uniqueUserIds.add(user.getId()); // Add current user to set for total unique count
        int duplicateCount = uniqueUserIds.size();

        // 5. Risk Score Integration: riskScore = (severityWeight * 20) + (duplicateCount * 10), Cap at 100
        int riskScore = Math.min((severityWeight * 20) + (duplicateCount * 10), 100);

        // Get SLA Deadline
        SlaConfig config = slaConfigRepository.findTopByOrderByIdDesc()
                .orElse(SlaConfig.builder()
                        .highSeverityHours(4)
                        .mediumSeverityHours(24)
                        .lowSeverityHours(72)
                        .build());

        int slaHoursVal = 72;
        if ("HIGH".equals(severity)) slaHoursVal = config.getHighSeverityHours();
        else if ("MEDIUM".equals(severity)) slaHoursVal = config.getMediumSeverityHours();
        else slaHoursVal = config.getLowSeverityHours();

        LocalDateTime deadline = LocalDateTime.now().plusHours(slaHoursVal);

        // 6. Create New Complaint
        Complaint complaint = Complaint.builder()
                .area(request.getArea()) // Use original area from request for display
                .phoneNumber(request.getPhoneNumber())
                .zone(request.getZone())
                .issueType(request.getIssueType())
                .description(request.getDescription())
                .status("Pending")
                .severity(severity)
                .riskScore(riskScore)
                .duplicateCount(duplicateCount)
                .repeatUser(repeatUser)
                .createdDate(LocalDateTime.now())
                .deadline(deadline)
                .lastUpdatedAt(LocalDateTime.now())
                .userId(user.getId())
                .remarks("System registered.")
                .build();

        Complaint saved = complaintRepository.save(complaint);

        // 7. Update All Related Complaints
        for (Complaint c : matches) {
            c.setDuplicateCount(duplicateCount);
            
            // Recalculate risk score based on their own severity
            int cSevWeight = 1;
            if ("HIGH".equals(c.getSeverity())) cSevWeight = 3;
            else if ("MEDIUM".equals(c.getSeverity())) cSevWeight = 2;
            
            c.setRiskScore(Math.min((cSevWeight * 20) + (duplicateCount * 10), 100));
            complaintRepository.save(c);
        }

        // Activity Log
        try {
            String activityDesc = duplicateCount > 1 
                ? "Duplicate detection: " + duplicateCount + " unique citizens reporting. Risk updated."
                : "Complaint registered.";
            activityRepository.save(ComplaintActivity.builder()
                    .complaintId(saved.getId())
                    .status("Pending")
                    .description(activityDesc)
                    .build());
        } catch (Exception e) {
            System.err.println("Error saving activity: " + e.getMessage());
        }

        // 8. Notification Logic
        try {
            // Admin notification for new complaint
            notificationService.createNotification(
                    "New report in " + saved.getArea() + " (ID: #" + saved.getId() + ")", 
                    NotificationType.ADMIN_NOTICE, 
                    null, // No specific user for admin notice
                    saved.getArea());

            // System alert for high risk
            if (riskScore > 75) {
                notificationService.createNotification(
                        "High systemic risk detected in " + saved.getArea() + " for " + saved.getIssueType() + " (Risk: " + riskScore + ")",
                        NotificationType.HIGH_RISK, 
                        saved.getId(), 
                        null, 
                        saved.getArea());
            }

            // Repeat Submission
            if (repeatUser) {
                notificationService.createNotification(
                    "User submitted repeated complaint for " + saved.getIssueType() + " in " + saved.getArea() + " (ID: #" + saved.getId() + ")",
                    NotificationType.REPEAT_SUBMISSION,
                    saved.getId(),
                    null,
                    saved.getArea()
                );
            }

            // Area Alert (Surge Detection)
            if (duplicateCount >= 3) {
                notificationService.createNotification(
                    "Multiple complaint surge (" + duplicateCount + " reports) for " + saved.getIssueType() + " in " + saved.getArea(),
                    NotificationType.AREA_ALERT,
                    saved.getId(),
                    null,
                    saved.getArea()
                );
            }
        } catch (Exception e) {
            // Log failure but don't crash
            System.err.println("Error creating notification: " + e.getMessage());
        }

        return saved;
    }

    public List<ComplaintResponseDTO> getAllComplaints() {
        List<Complaint> complaints = complaintRepository.findAll();
        return complaints.stream().map(c -> {
            ComplaintResponseDTO dto = new ComplaintResponseDTO();
            dto.setId(c.getId());
            dto.setPhoneNumber(c.getPhoneNumber());
            dto.setArea(c.getArea());
            dto.setZone(c.getZone());
            dto.setIssueType(c.getIssueType());
            dto.setDescription(c.getDescription());
            dto.setSeverity(c.getSeverity());
            dto.setStatus(c.getStatus());
            dto.setRiskScore(c.getRiskScore());
            dto.setDuplicateCount(c.getDuplicateCount());
            dto.setRepeatUser(c.getRepeatUser());
            dto.setCreatedDate(c.getCreatedDate());
            dto.setDeadline(c.getDeadline());
            dto.setLastUpdatedAt(c.getLastUpdatedAt());
            dto.setUserId(c.getUserId());

            if (c.getUserId() != null) {
                userRepository.findById(c.getUserId()).ifPresentOrElse(u -> {
                    dto.setCitizenName(u.getName());
                }, () -> {
                    dto.setCitizenName("Unknown");
                });
            } else {
                dto.setCitizenName("Unknown");
            }

            return dto;
        }).collect(Collectors.toList());
    }

    public List<Complaint> getUserComplaints(String token) {
        String email = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return complaintRepository.findByUserId(user.getId());
    }

    public List<ComplaintActivity> getComplaintActivities(Long id) {
        return activityRepository.findByComplaintIdOrderByCreatedAtDesc(id);
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

        // Action Description for activity
        try {
            String description = "Admin updated status to " + status;
            if (status.equals("In Progress")) description = "Admin deployed staff for resolution.";
            if (status.equals("Resolved")) description = "Issue marked as resolved.";
            if (status.equals("Escalated")) description = "Flagged for immediate attention.";

            activityRepository.save(ComplaintActivity.builder()
                    .complaintId(id)
                    .status(status)
                    .description(description)
                    .build());
        } catch (Exception e) {
            System.out.println("Warning: Activity log failed: " + e.getMessage());
        }

        // Send notification ONLY if userId exists
        if (complaint.getUserId() != null) {
            try {
                NotificationType notifType = NotificationType.STATUS_UPDATE;
                String message = "Your complaint #" + id + " in " + complaint.getArea() + " is now being worked on.";
                
                if (status.equals("Resolved")) {
                    notifType = NotificationType.RESOLVED;
                    message = "Great news! Your complaint #" + id + " in " + complaint.getArea() + " has been resolved.";
                } else if (status.equals("Escalated")) {
                    notifType = NotificationType.ESCALATED;
                    message = "Urgent: Your complaint #" + id + " in " + complaint.getArea() + " has been escalated for immediate attention.";
                }

                notificationService.createNotification(message, notifType, complaint.getUserId(), complaint.getArea());
            } catch (Exception e) {
                System.out.println("Warning: Notification failed: " + e.getMessage());
            }
        }
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkEscalation() {
        List<Complaint> active = complaintRepository.findAll().stream()
                .filter(c -> !"Resolved".equals(c.getStatus()) && !"Escalated".equals(c.getStatus()))
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        for (Complaint c : active) {
            if (c.getDeadline() != null) {
                if (now.isAfter(c.getDeadline())) {
                    c.setStatus("Escalated");
                    c.setRemarks("Auto-escalated by system due to SLA breach.");
                    c.setLastUpdatedAt(now);
                    complaintRepository.save(c);

                    try {
                        activityRepository.save(ComplaintActivity.builder()
                                .complaintId(c.getId())
                                .status("Escalated")
                                .description("Auto-escalated by system: SLA breach/SLA Overdue.")
                                .build());
                    } catch (Exception e) {}

                    try {
                        notificationService.createNotification(
                                "Complaint #" + c.getId() + " has exceeded SLA deadline in " + c.getArea(),
                                NotificationType.SLA_BREACH,
                                c.getId(),
                                null,
                                c.getArea());
                    } catch (Exception e) {}

                    if (c.getUserId() != null) {
                        try {
                            notificationService.createNotification(
                                    "Auto-Escalation: Complaint #" + c.getId() + " in " + c.getArea() + " is overdue.",
                                    NotificationType.ESCALATED,
                                    c.getUserId(),
                                    c.getArea());
                        } catch (Exception e) {}
                    }
                } else if (now.plusHours(2).isAfter(c.getDeadline())) {
                    try {
                        notificationService.createNotification(
                                "Complaint #" + c.getId() + " approaches SLA deadline within 2 hours in " + c.getArea(),
                                NotificationType.SLA_WARNING,
                                c.getId(),
                                null,
                                c.getArea());
                    } catch (Exception e) {}
                }
            }
        }
    }

    public List<HighRiskAreaDTO> getHighRiskAreas() {
        return complaintRepository.countComplaintsByArea()
                .stream()
                .map(obj -> new HighRiskAreaDTO((String) obj[0], (Long) obj[1]))
                .collect(Collectors.toList());
    }

    public List<TrendDTO> getDailyTrends() {
        return complaintRepository.countComplaintsByDate()
                .stream()
                .map(obj -> new TrendDTO(obj[0].toString(), (Long) obj[1]))
                .collect(Collectors.toList());
    }

    public Map<String, Long> getStatusSummary() {
        return complaintRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        c -> {
                            String s = c.getStatus();
                            if ("Pending".equals(s) || "Escalated".equals(s)) return "Open";
                            return s;
                        },
                        Collectors.counting()
                ));
    }

    public List<TrendDTO> getComplaintsTrendLast7Days() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);
        LocalDateTime since = sevenDaysAgo.atStartOfDay();

        List<Complaint> recentComplaints = complaintRepository.findByCreatedDateAfter(since);

        Map<LocalDate, Long> countsByDate = recentComplaints.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getCreatedDate().toLocalDate(),
                        Collectors.counting()
                ));

        List<TrendDTO> trends = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            long count = countsByDate.getOrDefault(date, 0L);
            trends.add(new TrendDTO(date.toString(), count));
        }

        return trends;
    }

    public StatsDTO getStats() {
        long highSeverityCount = complaintRepository.countBySeverity("HIGH");
        long pendingCount = complaintRepository.findByStatus("Pending").size();
        long inProgressCount = complaintRepository.findByStatus("In Progress").size();
        long resolvedCount = complaintRepository.findByStatus("Resolved").size();
        long escalatedCount = complaintRepository.findByStatus("Escalated").size();
        long total = complaintRepository.count();

        return StatsDTO.builder()
                .totalComplaints(total)
                .highSeverityCount(highSeverityCount)
                .openCount(pendingCount + inProgressCount + escalatedCount)
                .resolvedCount(resolvedCount)
                .build();
    }

    public Object getDashboardMetrics(String token) {
        String email = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Long userId = user.getId();

        List<Complaint> userComplaints = complaintRepository.findByUserId(userId);
        long total = userComplaints.size();
        long pending = userComplaints.stream().filter(c -> c.getStatus().equals("Pending")).count();
        long inProgress = userComplaints.stream().filter(c -> c.getStatus().equals("In Progress")).count();
        long resolved = userComplaints.stream().filter(c -> c.getStatus().equals("Resolved")).count();
        long escalated = userComplaints.stream().filter(c -> c.getStatus().equals("Escalated")).count();

        long overdue = userComplaints.stream()
                .filter(c -> !"Resolved".equals(c.getStatus()) && c.getDeadline() != null
                        && c.getDeadline().isBefore(LocalDateTime.now()))
                .count();

        return java.util.Map.of(
                "total", total,
                "pending", pending,
                "inProgress", inProgress,
                "resolved", resolved,
                "escalated", escalated,
                "overdue", overdue);
    }
}
