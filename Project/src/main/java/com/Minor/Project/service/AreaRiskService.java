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

    public List<AreaRiskDTO> calculateAreaRisk() {
        // 1. Fetch all ACTIVE complaints (status != RESOLVED)
        List<Complaint> activeComplaints = complaintRepository.findAll().stream()
                .filter(c -> !"Resolved".equals(c.getStatus()))
                .collect(Collectors.toList());

        if (activeComplaints.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Group by normalized Area
        // Key: Normalized Area Name, Value: List of Complaints in that area
        Map<String, List<Complaint>> groupedByArea = activeComplaints.stream()
                .collect(Collectors.groupingBy(c -> normalizeArea(c.getArea())));

        List<AreaRiskDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<Complaint>> entry : groupedByArea.entrySet()) {
            String areaName = entry.getKey();
            List<Complaint> areaComplaints = entry.getValue();

            // 3. Compute area risk score: average(riskScore of active complaints)
            double averageRisk = areaComplaints.stream()
                    .mapToInt(c -> c.getRiskScore() != null ? c.getRiskScore() : 0)
                    .average()
                    .orElse(0.0);

            int finalScore = (int) Math.round(averageRisk);

            // 4. Categorize area risk
            String level = categorizeRisk(finalScore);

            // Fetch representative zone (most frequent zone mentioned in this area's complaints)
            String representativeZone = areaComplaints.stream()
                    .map(Complaint::getZone)
                    .filter(Objects::nonNull)
                    .collect(Collectors.groupingBy(z -> z, Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Unknown");

            // Capitalize Area name for display if it was strictly lowercase
            String displayName = areaComplaints.get(0).getArea(); // Use first occurrence as display name

            result.add(AreaRiskDTO.builder()
                    .area(displayName)
                    .zone(representativeZone)
                    .complaintCount((long) areaComplaints.size())
                    .areaRiskScore(finalScore)
                    .level(level)
                    .build());
        }

        // Sort by highest risk first
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
