package com.Minor.Project.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String area;

    @Column(name = "phone_number")
    private String phoneNumber;

    private String zone;

    @Column(name = "issue_type")
    private String issueType;

    private String severity;
    private String status;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    private LocalDate deadline;

    @Column(name = "last_updated_at")
    private LocalDateTime lastUpdatedAt;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "duplicate_count")
    private Integer duplicateCount;

    @PrePersist
    protected void onCreate() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
        if (status == null) {
            status = "Pending";
        }
        if (lastUpdatedAt == null) {
            lastUpdatedAt = LocalDateTime.now();
        }
        if (riskScore == null) {
            riskScore = 0;
        }
        if (duplicateCount == null) {
            duplicateCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdatedAt = LocalDateTime.now();
    }
}
