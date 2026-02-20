package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.dto.NotificationDTO;
import com.smartims.entity.User;
import com.smartims.entity.UserNotification;
import com.smartims.repository.UserNotificationRepository;
import com.smartims.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final UserNotificationRepository userNotificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<List<NotificationDTO>> myNotifications(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receivedAt"));

        List<NotificationDTO> notifications = userNotificationRepository
                .findByUser(user, pageable)
                .getContent()
                .stream()
                .map(NotificationDTO::fromUserNotification)
                .collect(Collectors.toList());

        return ApiResponse.success(
                "Notifications fetched successfully",
                notifications
        );
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> unreadCount(Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow();

        return ApiResponse.success(
                "Unread notification count fetched successfully",
                userNotificationRepository
                        .countByUserAndReadFalse(user)
        );
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Object> markAsRead(@PathVariable Long id) {

        UserNotification notification =
                userNotificationRepository.findById(id)
                        .orElseThrow();

        notification.setRead(true);
        userNotificationRepository.save(notification);

        return ApiResponse.success(
                "Notification marked as read",
                null
        );
    }

    @PutMapping("/mark-all-read")
    public ApiResponse<Object> markAllAsRead(Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow();

        List<UserNotification> unreadNotifications = userNotificationRepository
                .findByUserAndReadFalse(user);

        unreadNotifications.forEach(notification -> notification.setRead(true));
        userNotificationRepository.saveAll(unreadNotifications);

        return ApiResponse.success(
                "All notifications marked as read",
                null
        );
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Object> deleteNotification(@PathVariable Long id) {

        userNotificationRepository.deleteById(id);

        return ApiResponse.success(
                "Notification deleted successfully",
                null
        );
    }
}
