package com.Minor.Project.service;

import com.Minor.Project.model.Notification;
import com.Minor.Project.model.NotificationType;
import com.Minor.Project.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // -----------------------------------------------------------------------
    // Core creation method — complaint-linked, deduplication-aware
    // -----------------------------------------------------------------------

    /**
     * Create a notification tied to a specific complaint.
     * SYSTEM_ALERT and SLA_ALERT are deduplicated: only one alert per
     * (complaintId, type) combination is ever created.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotification(String message, NotificationType type,
                                   Long complaintId, Long userId, String location) {
        try {
            if (message == null || message.trim().isEmpty()) {
                System.out.println("Warning: Empty notification message — skipping");
                return;
            }

            // Deduplication logic for system-generated alerts
            if (complaintId != null) {
                if (notificationRepository.existsByComplaintIdAndType(complaintId, type)) {
                    System.out.println("Info: " + type + " already exists for complaint #" + complaintId + " — skipping duplicate");
                    return;
                }
            } else if (type == NotificationType.SYSTEM_ALERT) {
                if (notificationRepository.existsByMessageAndType(message, type)) {
                    System.out.println("Info: Summary alert already exists — skipping duplicate");
                    return;
                }
            }

            Notification notification = Notification.builder()
                    .message(message)
                    .type(type)
                    .complaintId(complaintId)
                    .userId(userId)
                    .location(location)
                    .build();
            notificationRepository.save(notification);

        } catch (Exception e) {
            System.out.println("Warning: Could not save notification: " + e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotification(NotificationType type, Long complaintId, String message) {
        createNotification(message, type, complaintId, null, null);
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotification(String message, NotificationType type,
                                   Long userId, String location) {
        createNotification(message, type, null, userId, location);
    }

    // -----------------------------------------------------------------------
    // Admin-facing reads
    // -----------------------------------------------------------------------

    /** All notifications, newest first. */
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    /** Only unread notifications, newest first. */
    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
    }

    /** Mark a single notification as read by id. Returns false if not found. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean markAsRead(Long notificationId) {
        Optional<Notification> opt = notificationRepository.findById(notificationId);
        if (opt.isEmpty()) return false;
        Notification n = opt.get();
        n.setIsRead(true);
        notificationRepository.save(n);
        return true;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteAllAdminNotifications(List<NotificationType> types) {
        List<Notification> all = notificationRepository.findAll();
        List<Notification> adminNotifs = all.stream()
            .filter(n -> types.contains(n.getType()))
            .toList();
        notificationRepository.deleteAll(adminNotifs);
    }

    // -----------------------------------------------------------------------
    // User-facing reads
    // -----------------------------------------------------------------------

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}
