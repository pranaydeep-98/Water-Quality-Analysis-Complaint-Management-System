package com.Minor.Project.repository;

import com.Minor.Project.model.Notification;
import com.Minor.Project.model.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // User-facing
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
    List<Notification> findByUserIdAndIsReadFalse(Long userId);

    // Admin-facing — ordered latest first
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();

    // Deduplication — prevent firing same alert type for same complaint twice
    boolean existsByComplaintIdAndType(Long complaintId, NotificationType type);
}
