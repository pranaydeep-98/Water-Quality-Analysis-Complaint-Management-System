package com.Minor.Project.dto;

import com.Minor.Project.model.Severity;
import lombok.Data;

@Data
public class ComplaintRequest {
    private String userName;
    private String waterIssue; // maps to description
    private String area;       // maps to location
    private String zone;
    private String phoneNumber;
    private Severity severity;
}
