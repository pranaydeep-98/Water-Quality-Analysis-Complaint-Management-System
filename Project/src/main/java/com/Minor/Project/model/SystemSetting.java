package com.Minor.Project.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    private String settingKey;

    private String settingValue;

    private String description;
}
