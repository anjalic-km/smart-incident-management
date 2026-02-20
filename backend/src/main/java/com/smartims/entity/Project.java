package com.smartims.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 10000)
    private String description;

    // Manager who owns this project
    @ManyToOne
    @JoinColumn(name = "manager_id")
    private User manager;

    // Company field for easier filtering and isolation
    @Column(name = "company")
    private String company;

    // Project members (engineers + users)
    @ManyToMany
    @JoinTable(
            name = "project_members",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )

    @Builder.Default
    private List<User> members = new ArrayList<>();

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

}
