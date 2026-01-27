package com.smartims.service.impl;

import com.smartims.entity.*;
import com.smartims.enums.Role;
import com.smartims.repository.NotificationRepository;
import com.smartims.repository.UserNotificationRepository;
import com.smartims.repository.UserRepository;
import com.smartims.service.NotificationInboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationInboxServiceImpl
        implements NotificationInboxService {

    private final NotificationRepository notificationRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final UserRepository userRepository;

    @Override
    public void notifyForIssueEvent(
            String type,
            String message,
            Issue issue) {

        // 1️⃣ Create notification (once)
        Notification notification = Notification.builder()
                .type(type)
                .message(message)
                .entityType("ISSUE")
                .entityId(issue.getId())
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);

        // 2️⃣ Determine recipients
        List<User> recipients = new ArrayList<>();

        // ADMIN → all admins
        recipients.addAll(
                userRepository.findByRole(Role.ADMIN)
        );

        // MANAGER → project manager
        recipients.add(issue.getProject().getManager());

        // ENGINEERS + USERS → project members
        recipients.addAll(issue.getProject().getMembers());

        // 3️⃣ Remove duplicates
        recipients = recipients.stream()
                .distinct()
                .toList();

        // 4️⃣ Save per-user notification
        for (User user : recipients) {
            userNotificationRepository.save(
                    UserNotification.builder()
                            .user(user)
                            .notification(notification)
                            .read(false)
                            .receivedAt(LocalDateTime.now())
                            .build()
            );
        }
    }

    @Override
    public void notifyForProjectEvent(
            String type,
            String message,
            Project project) {

        Notification notification = Notification.builder()
                .type(type)
                .message(message)
                .entityType("PROJECT")
                .entityId(project.getId())
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);

        List<User> recipients = new ArrayList<>();

        // ADMIN → all admins
        recipients.addAll(userRepository.findByRole(Role.ADMIN));

        // MANAGER → project manager
        if (project.getManager() != null) {
            recipients.add(project.getManager());
        }

        // PROJECT MEMBERS
        recipients.addAll(project.getMembers());

        recipients = recipients.stream().distinct().toList();

        for (User user : recipients) {
            userNotificationRepository.save(
                    UserNotification.builder()
                            .user(user)
                            .notification(notification)
                            .read(false)
                            .receivedAt(LocalDateTime.now())
                            .build()
            );
        }
    }

}
