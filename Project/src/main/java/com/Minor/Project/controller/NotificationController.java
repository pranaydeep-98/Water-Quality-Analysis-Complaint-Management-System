package com.Minor.Project.controller;

import com.Minor.Project.model.Notification;
import com.Minor.Project.model.NotificationType;
import com.Minor.Project.model.User;
import com.Minor.Project.repository.UserRepository;
import com.Minor.Project.security.JwtUtil;
import com.Minor.Project.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<String> markAllRead(@RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok("All notifications marked as read");
    }

    @GetMapping("/admin")
    public ResponseEntity<List<Notification>> getAdminNotifications() {
        // Admin notifications are typically those with type SYSTEM_ALERT or ADMIN_NOTICE and often null userId
        return ResponseEntity.ok(notificationService.getAllNotifications().stream()
                .filter(n -> n.getType() == NotificationType.SYSTEM_ALERT || n.getType() == NotificationType.ADMIN_NOTICE)
                .toList());
    }

    private Long getUserIdFromToken(String token) {
        String email = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
