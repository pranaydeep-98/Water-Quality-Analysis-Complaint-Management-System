package com.Minor.Project.dto;

import lombok.Data;

@Data
public class ComplaintRequest {
    private String area;
    private String phoneNumber;
    private String zone;
    private String issueType;
    private String description;
    private String createdDate;
}
