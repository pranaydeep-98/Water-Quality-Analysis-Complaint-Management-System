package com.Minor.Project.repository;

import com.Minor.Project.model.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SettingsRepository extends JpaRepository<SystemSetting, String> {
    Optional<SystemSetting> findBySettingKey(String settingKey);
}
