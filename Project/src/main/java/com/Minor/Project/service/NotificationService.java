package com.Minor.Project.service;

import com.Minor.Project.model.Notification;
import com.Minor.Project.model.NotificationType;
import com.Minor.Project.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void createNotification(String message, String type, String location) {
        NotificationType notificationType = NotificationType.valueOf(type.toUpperCase());
        Notification notification = Notification.builder()
                .message(message)
                .type(notificationType)
                .location(location)
                .build();
        notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Notification> getAdminNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(n -> n.getType() == NotificationType.ADMIN)
                .collect(Collectors.toList());
    }

    public List<Notification> getUserNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(n -> n.getType() == NotificationType.USER)
                .collect(Collectors.toList());
    }
}
