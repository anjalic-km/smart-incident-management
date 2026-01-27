package com.smartims.controller;

import com.smartims.entity.User;
import com.smartims.entity.UserNotification;
import com.smartims.repository.UserNotificationRepository;
import com.smartims.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
    public List<UserNotification> myNotifications(Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow();

        return userNotificationRepository
                .findByUserOrderByReceivedAtDesc(user);
    }

    @GetMapping("/unread-count")
    public long unreadCount(Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow();

        return userNotificationRepository
                .countByUserAndReadFalse(user);
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        UserNotification un =
                userNotificationRepository.findById(id).orElseThrow();
        un.setRead(true);
        userNotificationRepository.save(un);
    }
}
