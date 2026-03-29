package com.Minor.Project.service;

import com.Minor.Project.dto.AreaRiskDTO;
import com.Minor.Project.model.Complaint;
import com.Minor.Project.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AreaRiskService {

    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;

    public List<AreaRiskDTO> calculateAreaRisk() {
        // ...Existing code for fetching activeComplaints and grouping...
        // Fetch active complaints (status != RESOLVED)
        List<Complaint> activeComplaints = complaintRepository.findAll().stream()
                .filter(c -> !"Resolved".equals(c.getStatus()))
                .collect(Collectors.toList());

        if (activeComplaints.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<Complaint>> groupedByArea = activeComplaints.stream()
                .collect(Collectors.groupingBy(c -> normalizeArea(c.getArea())));

        List<AreaRiskDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<Complaint>> entry : groupedByArea.entrySet()) {
            List<Complaint> areaComplaints = entry.getValue();

            double averageRisk = areaComplaints.stream()
                    .mapToInt(c -> c.getRiskScore() != null ? c.getRiskScore() : 0)
                    .average()
                    .orElse(0.0);

            int finalScore = (int) Math.round(averageRisk);
            String level = categorizeRisk(finalScore);

            // 🔥 6. AREA RISK ESCALATION (ADVANCED)
            if (finalScore >= 80 && areaComplaints.size() >= 5) {
                try {
                    // We use null for complaintId as this is an aggregate area alert
                    notificationService.createNotification(
                        "Systemic Crisis: Highly critical risk score (" + finalScore + ") detected in " + entry.getValue().get(0).getArea() + " zone.",
                        com.Minor.Project.model.NotificationType.AREA_RISK_ESCALATION,
                        null,
                        areaComplaints.get(0).getArea()
                    );
                } catch (Exception e) {}
            }

            // ...rest of result building...
            String representativeZone = areaComplaints.stream()
                    .map(Complaint::getZone)
                    .filter(Objects::nonNull)
                    .collect(Collectors.groupingBy(z -> z, Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Unknown");

            String displayName = areaComplaints.get(0).getArea();

            result.add(AreaRiskDTO.builder()
                    .area(displayName)
                    .zone(representativeZone)
                    .complaintCount((long) areaComplaints.size())
                    .areaRiskScore(finalScore)
                    .level(level)
                    .build());
        }

        result.sort((a, b) -> b.getAreaRiskScore().compareTo(a.getAreaRiskScore()));
        return result;
    }

    private String normalizeArea(String area) {
        if (area == null) return "";
        // Trim, lowercase, and remove common zone suffixes if they exist (e.g., "North Zone" -> "north")
        String normalized = area.trim().toLowerCase();
        // Simple removal of " zone" suffix for better grouping
        if (normalized.endsWith(" zone")) {
            normalized = normalized.substring(0, normalized.length() - 5).trim();
        }
        return normalized;
    }

    private String categorizeRisk(int score) {
        if (score > 75) return "CRITICAL";
        if (score >= 40) return "MEDIUM";
        return "LOW";
    }
}
