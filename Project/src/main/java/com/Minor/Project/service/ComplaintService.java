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
        int slaHoursVal = 72;
        if ("HIGH".equals(severity)) slaHoursVal = 24;
        else if ("MEDIUM".equals(severity)) slaHoursVal = 48;
        else slaHoursVal = 72;

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
            // 🚨 1. HIGH RISK ALERT (CRITICAL CONDITION)
            if (riskScore >= 75 && !"Resolved".equals(saved.getStatus())) {
                notificationService.createNotification(
                    NotificationType.HIGH_RISK,
                    saved.getId(),
                    String.format("Critical water issue detected in %s with risk score %d", saved.getArea(), riskScore)
                );
            }

            // 📍 2. AREA OUTBREAK ALERT (SYSTEMIC ISSUE)
            // duplicateCount already reflects unique reporters within 24h window
            if (duplicateCount >= 3) {
                notificationService.createNotification(
                    NotificationType.AREA_ALERT,
                    saved.getId(),
                    String.format("Multiple users (%d) reported %s in %s", duplicateCount, saved.getIssueType(), saved.getArea())
                );
            }

            // 🔁 3. REPEAT USER SPAM DETECTION
            if (repeatUser) {
                notificationService.createNotification(
                    NotificationType.REPEAT_SUBMISSION,
                    saved.getId(),
                    String.format("Repeated complaint detected from same user in %s", saved.getArea())
                );
            }
        } catch (Exception e) {
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

    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional
    public void generateSystemSummaries() {
        LocalDateTime now = LocalDateTime.now();
        List<Complaint> active = complaintRepository.findAll().stream()
                .filter(c -> !"Resolved".equals(c.getStatus()))
                .collect(Collectors.toList());

        // 1. Extreme Risk Summary
        long extremeRiskCount = active.stream()
                .filter(c -> (c.getRiskScore() != null && c.getRiskScore() >= 90))
                .count();
        if (extremeRiskCount >= 3) {
            String msg = extremeRiskCount + " extreme risk complaints require immediate administrative attention.";
            notificationService.createNotification(msg, NotificationType.SYSTEM_ALERT, null, "Critical System Summary");
        }

        // 2. SLA Breach Summary
        long breachedCount = active.stream()
                .filter(c -> c.getDeadline() != null && now.isAfter(c.getDeadline()))
                .count();
        if (breachedCount > 0) {
            String msg = breachedCount + " operations have breached SLA deadlines and require urgent resolution.";
            notificationService.createNotification(msg, NotificationType.SYSTEM_ALERT, null, "SLA Failure Summary");
        }

        // 📈 7. SPIKE DETECTION (today vs last 3 days avg)
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime last3DaysStart = todayStart.minusDays(3);
        
        long todayCount = complaintRepository.findByCreatedDateAfter(todayStart).size();
        long last3DaysCount = complaintRepository.findByCreatedDateAfter(last3DaysStart).size() - todayCount;
        double avgLast3Days = last3DaysCount / 3.0;

        if (todayCount >= 2 * avgLast3Days && todayCount >= 5) {
            String msg = String.format("Alert: Significant spike detected! %d reports today (Avg: %.1f). Pattern suggests systemic failure.", todayCount, avgLast3Days);
            notificationService.createNotification(msg, NotificationType.SPIKE_DETECTION, null, "Regional Analytics");
            System.out.println("Pattern Detected: Spike Surge triggered by " + todayCount + " new complaints.");
        }

        // ⏳ 8. STAGNATION ALERT (Pending > 24h)
        long stagnantCount = active.stream()
                .filter(c -> "Pending".equals(c.getStatus()) && (c.getLastUpdatedAt() != null ? c.getLastUpdatedAt().isBefore(now.minusHours(24)) : c.getCreatedDate().isBefore(now.minusHours(24))))
                .count();
        if (stagnantCount > 0) {
            String msg = stagnantCount + " complaints have been STUCK in 'Pending' for over 24 hours. Systematic delays detected.";
            notificationService.createNotification(msg, NotificationType.STAGNATION_ALERT, null, "Operational Health");
            System.out.println("Monitoring Alert: Stagnation detected for " + stagnantCount + " complaints.");
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
            if (c.getDeadline() != null && c.getCreatedDate() != null) {
                // Calculate total SLA time in seconds
                long totalSlaSeconds = java.time.Duration.between(c.getCreatedDate(), c.getDeadline()).toSeconds();
                long remainingSeconds = java.time.Duration.between(now, c.getDeadline()).toSeconds();

                // ❗ 5. SLA BREACH (CRITICAL FAILURE)
                if (now.isAfter(c.getDeadline())) {
                    c.setStatus("Escalated");
                    c.setRemarks("Auto-escalated by system due to SLA breach.");
                    c.setLastUpdatedAt(now);
                    complaintRepository.save(c);

                    try {
                        notificationService.createNotification(
                                NotificationType.SLA_BREACH,
                                c.getId(),
                                "SLA breached for complaint #" + c.getId()
                        );
                    } catch (Exception e) {}
                } 
                // ⏰ 4. SLA WARNING (PRE-BREACH: remainingTime ≤ 20% of SLA time)
                else if (remainingSeconds > 0 && remainingSeconds <= (totalSlaSeconds * 0.2)) {
                    try {
                        notificationService.createNotification(
                                NotificationType.SLA_WARNING,
                                c.getId(),
                                "SLA nearing breach for complaint #" + c.getId()
                        );
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
