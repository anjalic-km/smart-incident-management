package com.smartims.entity;

import com.smartims.enums.IssueStatus;
import com.smartims.enums.Severity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueStatus status;

    @Column(nullable = false)
    private String createdBy; // email from JWT

    private String priorityLevel;
    @ManyToOne
    @JoinColumn(name = "assigned_engineer_id")
    private User assignedEngineer;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    private boolean slaBreached;

}
