package com.smartims.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.Id;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "sla_policies",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"project_id", "priority_level"})
        }
)
public class SlaPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String priorityLevel;

    @Column(nullable = false)
    private Integer resolutionTimeMinutes; // 🔥 REQUIRED

    @Column(length = 1000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
}