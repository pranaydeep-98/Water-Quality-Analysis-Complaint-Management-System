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

    // -----------------------------------------------------------------------
    // Admin-facing endpoints
    // -----------------------------------------------------------------------

    private final List<NotificationType> adminTypes = List.of(
            NotificationType.SYSTEM_ALERT, NotificationType.ADMIN_NOTICE, NotificationType.SLA_ALERT,
            NotificationType.HIGH_RISK, NotificationType.SLA_WARNING, NotificationType.SLA_BREACH,
            NotificationType.REPEAT_SUBMISSION, NotificationType.AREA_ALERT, NotificationType.ADMIN,
            NotificationType.AREA_RISK_ESCALATION, NotificationType.SPIKE_DETECTION, NotificationType.STAGNATION_ALERT);

    /** GET /api/notifications/admin/all — all admin notifications, newest first */
    @GetMapping("/admin/all")
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(
                notificationService.getAllNotifications().stream()
                        .filter(n -> adminTypes.contains(n.getType()))
                        .toList());
    }

    /** GET /api/notifications/admin/unread — admin unread notifications */
    @GetMapping("/admin/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications() {
        return ResponseEntity.ok(
                notificationService.getUnreadNotifications().stream()
                        .filter(n -> adminTypes.contains(n.getType()))
                        .toList());
    }

    /** PUT /api/notifications/{id}/read — mark single notification as read */
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        boolean success = notificationService.markAsRead(id);
        if (!success) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("success", true, "notificationId", id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearAllNotifications() {
        notificationService.deleteAllAdminNotifications(adminTypes);
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications cleared"));
    }

    /** GET /api/notifications/admin — Admin notification system endpoint */
    @GetMapping("/admin")
    public ResponseEntity<List<Notification>> getAdminNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    // -----------------------------------------------------------------------
    // User-facing endpoints
    // -----------------------------------------------------------------------

    /** GET /api/notifications — user's own notifications */
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<String> markAllRead(
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok("All notifications marked as read");
    }

    // -----------------------------------------------------------------------
    // Helper
    // -----------------------------------------------------------------------

    private Long getUserIdFromToken(String token) {
        String email = jwtUtil.extractUsername(token.replace("Bearer ", ""));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
