package com.Minor.Project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AreaRiskDTO {
    private String area;
    private String zone;
    private Long complaintCount;
    private Integer areaRiskScore;
    private String level;
}
