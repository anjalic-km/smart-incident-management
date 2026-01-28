package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.entity.User;
import com.smartims.entity.UserNotification;
import com.smartims.repository.UserNotificationRepository;
import com.smartims.repository.UserRepository;
import com.smartims.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final UserNotificationRepository userNotificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserNotification>>> myNotifications(
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow();

        return ResponseUtil.success(
                "Notifications fetched successfully",
                userNotificationRepository
                        .findByUserOrderByReceivedAtDesc(user)
        );
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount(Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow();

        return ResponseUtil.success(
                "Unread notification count fetched successfully",
                userNotificationRepository
                        .countByUserAndReadFalse(user)
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {

        UserNotification notification =
                userNotificationRepository.findById(id)
                        .orElseThrow();

        notification.setRead(true);
        userNotificationRepository.save(notification);

        return ResponseUtil.success(
                "Notification marked as read",
                null
        );
    }
}
