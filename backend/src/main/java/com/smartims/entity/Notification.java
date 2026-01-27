package com.smartims.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TYPE (ISSUE_CREATED, ISSUE_ASSIGNED, SLA_BREACHED, etc.)
    @Column(nullable = false)
    private String type;

    // MESSAGE SHOWN IN INBOX
    @Column(nullable = false, length = 1000)
    private String message;

    // ENTITY CONTEXT
    private String entityType; // ISSUE / PROJECT / SLA
    private Long entityId;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
