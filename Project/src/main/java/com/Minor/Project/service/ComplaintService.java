package com.Minor.Project.service;

import com.Minor.Project.dto.*;
import com.Minor.Project.model.*;
import com.Minor.Project.repository.ComplaintRepository;
import com.Minor.Project.repository.UserRepository;
import com.Minor.Project.repository.ComplaintActivityRepository;
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
    private final ComplaintActivityRepository activityRepository;
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

        // TYPE 1 - Check if SAME USER already has open complaint
        List<Complaint> userExisting = complaintRepository.findByUserIdAndAreaIgnoreCaseAndIssueTypeIgnoreCase(
            user.getId(), request.getArea(), request.getIssueType()
        );

        boolean userHasOpenComplaint = userExisting.stream()
            .anyMatch(c -> !"Resolved".equals(c.getStatus()));

        if (userHasOpenComplaint) {
            throw new RuntimeException(
                "DUPLICATE_USER: You already have an open complaint " +
                "for " + request.getIssueType() +
                " in " + request.getArea() +
                ". Please wait for it to be resolved."
            );
        }

        // TYPE 2 - Count area duplicates
        LocalDateTime threeDaysAgo = LocalDateTime.now().minusDays(3);
        long areaDuplicates = complaintRepository.countAreaDuplicates(
            request.getArea(), request.getIssueType(), threeDaysAgo
        );

        int riskScore = (severityWeight * 20) + (int)(areaDuplicates * 5);
        if (riskScore > 100) riskScore = 100;

        Complaint complaint = Complaint.builder()
                .area(request.getArea())
                .phoneNumber(request.getPhoneNumber())
                .zone(request.getZone())
                .issueType(request.getIssueType())
                .severity(severity)
                .status("Pending")
                .riskScore(riskScore)
                .duplicateCount((int) areaDuplicates)
                .remarks("System registered.")
                .createdDate(LocalDateTime.now())
                .deadline(deadline)
                .lastUpdatedAt(LocalDateTime.now())
                .userId(user.getId())
                .build();

        Complaint saved = complaintRepository.save(complaint);

        // Save initial activity — wrap in try-catch
        try {
            String activityDesc = areaDuplicates > 0 
                ? "System registered. " + areaDuplicates + " similar complaint(s) found in this area."
                : "System registered.";
            activityRepository.save(ComplaintActivity.builder()
                    .complaintId(saved.getId())
                    .status("Pending")
                    .description(activityDesc)
                    .build());
        } catch (Exception e) {
            System.out.println("Warning: Activity save failed: " + e.getMessage());
        }

        // Send admin notification — wrap in try-catch
        try {
            notificationService.createNotification(
                    "New complaint registered at " + saved.getArea() + " (ID: #" + saved.getId() + ")", 
                    NotificationType.ADMIN_NOTICE, 
                    null, 
                    saved.getArea());
        } catch (Exception e) {
            System.out.println("Warning: Admin notification failed: " + e.getMessage());
        }

        // Send high risk notification — wrap in try-catch
        try {
            if (riskScore > 75) {
                notificationService.createNotification(
                        "CRITICAL: High risk complaint in " + saved.getArea(), 
                        NotificationType.SYSTEM_ALERT, 
                        null, 
                        saved.getArea());
            }
        } catch (Exception e) {
            System.out.println("Warning: Risk notification failed: " + e.getMessage());
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
            dto.setSeverity(c.getSeverity());
            dto.setStatus(c.getStatus());
            dto.setRiskScore(c.getRiskScore());
            dto.setDuplicateCount(c.getDuplicateCount());
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

    public void updateStatus(Long id, String status, String remarks) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        String oldStatus = complaint.getStatus();
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

        // Send notification ONLY if userId exists — never crash if null
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
                System.out.println("Warning: Notification failed for complaint #" + id + " - " + e.getMessage());
            }
        } else {
            System.out.println("Warning: complaint #" + id + " has no userId - skipping notification");
        }
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkEscalation() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(2);
        List<Complaint> overdue = complaintRepository.findByCreatedDateBeforeAndStatusNot(
                threshold, "Resolved");

        for (Complaint c : overdue) {
            if (!"Escalated".equals(c.getStatus()) && !"Resolved".equals(c.getStatus())) {
                c.setStatus("Escalated");
                c.setRemarks("Auto-escalated by system due to SLA breach.");
                c.setLastUpdatedAt(LocalDateTime.now());
                complaintRepository.save(c);

                try {
                    activityRepository.save(ComplaintActivity.builder()
                            .complaintId(c.getId())
                            .status("Escalated")
                            .description("Auto-escalated by system: SLA breach/SLA Overdue.")
                            .build());
                } catch (Exception e) {
                    System.out.println("Warning: Auto-escalation activity log failed: " + e.getMessage());
                }

                if (c.getUserId() != null) {
                    try {
                        notificationService.createNotification(
                                "Auto-Escalation: Complaint #" + c.getId() + " in " + c.getArea() + " is overdue.", 
                                NotificationType.ESCALATED, 
                                c.getUserId(), 
                                c.getArea());
                    } catch (Exception e) {
                        System.out.println("Warning: Auto-escalation notification failed: " + e.getMessage());
                    }
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

        // Calculate overdue for user
        long overdue = userComplaints.stream()
                .filter(c -> !"Resolved".equals(c.getStatus()) && c.getDeadline() != null
                        && c.getDeadline().isBefore(LocalDate.now()))
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
