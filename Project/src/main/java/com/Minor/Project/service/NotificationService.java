package com.Minor.Project.service;

import com.Minor.Project.model.Notification;
import com.Minor.Project.model.NotificationType;
import com.Minor.Project.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotification(String message, NotificationType type, Long userId, String location) {
        try {
            if (message == null || message.trim().isEmpty()) {
                System.out.println("Warning: Empty notification message — skipping");
                return;
            }
            Notification notification = Notification.builder()
                    .message(message)
                    .type(type)
                    .userId(userId)
                    .location(location)
                    .build();
            notificationRepository.save(notification);
        } catch (Exception e) {
            System.out.println("Warning: Could not save notification: " + e.getMessage());
        }
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
