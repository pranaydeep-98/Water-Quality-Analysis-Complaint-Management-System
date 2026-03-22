package com.Minor.Project.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StatsDTO {
    private long totalComplaints;
    private long highSeverityCount;
    private long openCount;
    private long resolvedCount;
}
