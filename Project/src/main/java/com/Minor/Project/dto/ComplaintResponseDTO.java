package com.Minor.Project.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ComplaintResponseDTO {
    private Long id;
    private String citizenName;
    private String phoneNumber;
    private String area;
    private String zone;
    private String issueType;
    private String description;
    private String severity;
    private String status;
    private Integer riskScore;
    private Integer duplicateCount;
    private Boolean repeatUser;
    private LocalDateTime createdDate;
    private LocalDateTime deadline;
    private LocalDateTime lastUpdatedAt;
    private Long userId;
}
