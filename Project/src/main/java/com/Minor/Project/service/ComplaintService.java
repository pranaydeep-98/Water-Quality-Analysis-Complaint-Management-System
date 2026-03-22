package com.Minor.Project.service;

import com.Minor.Project.dto.*;
import com.Minor.Project.model.*;
import com.Minor.Project.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;

    @Transactional
    public Complaint createComplaint(ComplaintRequest request) {
        Complaint complaint = Complaint.builder()
                .userName(request.getUserName())
                .description(request.getWaterIssue())
                .location(request.getArea())
                .zone(request.getZone())
                .phoneNumber(request.getPhoneNumber())
                .severity(Severity.LOW) // Default initially
                .status(ComplaintStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        // 1. Calculate Risk Score
        int riskScore = calculateRiskScore(complaint);
        complaint.setRiskScore(riskScore);

        Complaint saved = complaintRepository.save(complaint);

        // 2. Notifications Integration
        // Notification for ADMIN on new registration
        notificationService.createNotification(
                "New complaint registered at " + saved.getLocation(), "ADMIN", saved.getLocation());

        // High risk area detection (> 3 duplicates)
        long duplicateCount = complaintRepository.countByLocation(saved.getLocation());
        if (duplicateCount > 3) {
            notificationService.createNotification(
                    "High risk area detected at " + saved.getLocation(), "ADMIN", saved.getLocation());
        }

        // Critical risk detection (> 6 score)
        if (saved.getRiskScore() > 6) {
            notificationService.createNotification(
                    "Critical risk detected at " + saved.getLocation(), "ADMIN", saved.getLocation());
        }

        return saved;
    }

    private int calculateRiskScore(Complaint complaint) {
        // (severityWeight * 2) + duplicateCount + delayFactor
        int severityWeight = complaint.getSeverity().getWeight();

        // Refined Severity Weight mapping: HIGH=3, MEDIUM=2, LOW=1
        // (Assuming Severity enum weights are already correct or using them as is)

        long duplicateCount = complaintRepository.countByLocation(complaint.getLocation());

        // delayFactor: +2 if any complaint in same area is older than 24 hours
        int delayFactor = complaintRepository.existsByLocationAndCreatedAtBefore(
                complaint.getLocation(), LocalDateTime.now().minusHours(24)) ? 2 : 0;

        return (severityWeight * 2) + (int) duplicateCount + delayFactor;
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    @Transactional
    public void updateStatus(Long id, ComplaintStatus status) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        complaint.setStatus(status);
        complaintRepository.save(complaint);

        // Notification for USER on status update
        notificationService.createNotification(
                "Your complaint status updated to " + status, "USER", complaint.getLocation());
    }

    @Transactional
    public void adminUpdate(Long id, ComplaintStatus status, Priority priority, Severity severity) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        if (status != null)
            complaint.setStatus(status);
        if (priority != null)
            complaint.setPriority(priority);
        if (severity != null) {
            complaint.setSeverity(severity);
            complaint.setRiskScore(calculateRiskScore(complaint));
        }

        complaintRepository.save(complaint);

        notificationService.createNotification(
                "Admin updated your complaint. Status: " + status + ", Priority: "
                        + (priority != null ? priority : "standard"),
                "USER", complaint.getLocation());
    }

    // 3. SLA Escalation Engine
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkEscalation() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(48);
        List<Complaint> overdue = complaintRepository.findByCreatedAtBeforeAndStatusNot(
                threshold, ComplaintStatus.RESOLVED);

        for (Complaint c : overdue) {
            if (c.getStatus() != ComplaintStatus.ESCALATED && c.getStatus() != ComplaintStatus.CLOSED) {
                c.setStatus(ComplaintStatus.ESCALATED);
                complaintRepository.save(c);

                notificationService.createNotification(
                        "Complaint escalated at " + c.getLocation(), "ADMIN", c.getLocation());
            }
        }
    }

    // Analytics: Cluster Detection
    public List<HighRiskAreaDTO> getHighRiskAreas() {
        return complaintRepository.countComplaintsByLocation()
                .stream()
                .map(obj -> new HighRiskAreaDTO((String) obj[0], (Long) obj[1]))
                .collect(Collectors.toList());
    }

    // Analytics: Trend Analysis
    public List<TrendDTO> getDailyTrends() {
        return complaintRepository.countComplaintsByDate()
                .stream()
                .map(obj -> new TrendDTO(obj[0].toString(), (Long) obj[1]))
                .collect(Collectors.toList());
    }

    public StatsDTO getStats() {
        long highSeverityCount = complaintRepository.countBySeverity(Severity.HIGH)
                + complaintRepository.countBySeverity(Severity.CRITICAL);
        long openCount = complaintRepository.findByStatus(ComplaintStatus.PENDING).size() +
                complaintRepository.findByStatus(ComplaintStatus.IN_PROGRESS).size() +
                complaintRepository.findByStatus(ComplaintStatus.ESCALATED).size();
        long resolvedCount = complaintRepository.findByStatus(ComplaintStatus.RESOLVED).size();

        return StatsDTO.builder()
                .totalComplaints(complaintRepository.count())
                .highSeverityCount(highSeverityCount)
                .openCount(openCount)
                .resolvedCount(resolvedCount)
                .build();
    }
}
