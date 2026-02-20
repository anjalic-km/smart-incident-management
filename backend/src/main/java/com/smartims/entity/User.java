package com.smartims.entity;

import com.smartims.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "company")
    private String company;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean locked = false;//if user is deleted then only it should be true(softDelete)

    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private Integer tokenVersion = 0;

    @Column(name = "must_change_password", nullable = false)
    @Builder.Default
    private boolean mustChangePassword = false;

    public void incrementTokenVersion() {
        this.tokenVersion++;
    }

    public Boolean getLocked() {
        return locked;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    @PrePersist
    void onCreate() {
        if (tokenVersion == null) {
            tokenVersion = 0;
        }
        enabled = true;
        locked = false;
        verified = true;
    }

}

