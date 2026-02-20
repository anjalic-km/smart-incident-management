package com.smartims.service.impl;

import com.smartims.entity.AuditLog;
import com.smartims.repository.AuditLogRepository;
import com.smartims.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    public static final String SYSTEM_EMAIL = "system@smartims.local";
    public static final String SYSTEM_ROLE  = "SYSTEM";


    @Override
    public void log(String action, String entityType, Long entityId, String description) {


        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .actorEmail("system@smartims.local")
                .actorRole("SYSTEM")
                .description(description)
                .entityId(entityId)
                .entityType(entityType)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);

        log.info("AUDIT | action={} | entityType={} | entityId={} | desc={}",
                action, entityType, entityId, description);

    }

    @Override
    public void logSystem(String action, String details,
                          Long entityId,
                          String entityType) {

        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .actorEmail("system@smartims.local")
                .actorRole("SYSTEM")
                .description(details)
                .entityId(entityId)
                .entityType(entityType)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);

        log.warn("SYSTEM_AUDIT | action={} | entityType={} | entityId={} | details={}",
                action, entityType, entityId, details);
    }


    @Override
    public void log(String action, String details) {

        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        String performedBy;

        if (auth == null || !auth.isAuthenticated()) {
            performedBy = "SYSTEM";
        } else {
            performedBy = auth.getName();
        }

        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .description(details)
                .actorRole(performedBy)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);

        log.info("AUDIT | action={} | details={}", action, details);
    }

}
