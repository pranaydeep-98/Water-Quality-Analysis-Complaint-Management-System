package com.Minor.Project.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sla_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int highSeverityHours;

    @Column(nullable = false)
    private int mediumSeverityHours;

    @Column(nullable = false)
    private int lowSeverityHours;
}
