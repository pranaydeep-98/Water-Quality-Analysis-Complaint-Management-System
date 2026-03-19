package com.Minor.Project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class HighRiskAreaDTO {
    private String location;
    private Long count;
}
