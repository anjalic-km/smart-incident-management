package com.smartims.dto;

import com.smartims.entity.UserNotification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private String type;
    private String entityType;
    private Long entityId;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime receivedAt;

    public static NotificationDTO fromUserNotification(UserNotification userNotification) {
        return NotificationDTO.builder()
                .id(userNotification.getId())
                .title(userNotification.getNotification().getType())
                .message(userNotification.getNotification().getMessage())
                .type(userNotification.getNotification().getType())
                .entityType(userNotification.getNotification().getEntityType())
                .entityId(userNotification.getNotification().getEntityId())
                .read(userNotification.isRead())
                .createdAt(userNotification.getNotification().getCreatedAt())
                .receivedAt(userNotification.getReceivedAt())
                .build();
    }
}
