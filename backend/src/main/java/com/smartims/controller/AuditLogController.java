package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.entity.AuditLog;
import com.smartims.entity.User;
import com.smartims.enums.Role;
import com.smartims.repository.AuditLogRepository;
import com.smartims.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    @GetMapping
    public ApiResponse<List<AuditLog>> getAllLogs(Authentication auth) {

        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<AuditLog> logs;

        if (currentUser.getRole() == Role.SUPER_ADMIN) {
            logs = auditLogRepository.findAll();
        } else {
            String company = currentUser.getCompany();
            if (company == null || company.isBlank()) {
                logs = auditLogRepository.findAll();
            } else {
                logs = auditLogRepository.findByActorCompany(company);
            }
        }

        return ApiResponse.success(
                "Audit logs fetched successfully",
                logs
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER','USER')")
    @GetMapping("/me")
    public ApiResponse<List<AuditLog>> getMyLogs(Authentication auth) {
        return ApiResponse.success(
                "My audit logs fetched successfully",
                auditLogRepository.findByActorEmail(auth.getName())
        );
    }
}
