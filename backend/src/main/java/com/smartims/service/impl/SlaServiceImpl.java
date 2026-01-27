package com.smartims.service.impl;

import com.smartims.entity.Issue;
import com.smartims.enums.IssueStatus;
import com.smartims.repository.SlaPolicyRepository;
import com.smartims.service.AuditLogService;
import com.smartims.service.NotificationInboxService;
import com.smartims.service.NotificationService;
import com.smartims.service.SlaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class SlaServiceImpl implements SlaService {

    private final SlaPolicyRepository slaPolicyRepository;
    private final AuditLogService auditLogService;
    private final NotificationInboxService notificationInboxService;

    @Override
    public void applySla(Issue issue) {
        issue.setSlaBreached(false);
    }

    @Override
    public void checkAndMarkBreach(Issue issue) {

        if (issue == null ||
                issue.getCreatedAt() == null ||
                issue.getPriorityLevel() == null ||
                issue.isSlaBreached() ||
                issue.getStatus() == IssueStatus.CLOSED) {
            return;
        }

        slaPolicyRepository
                .findByProjectAndPriorityLevel(
                        issue.getProject(),
                        issue.getPriorityLevel()
                )
                .ifPresent(policy -> {

                    long elapsedMinutes = Duration.between(
                            issue.getCreatedAt(),
                            LocalDateTime.now()
                    ).toMinutes();

                    if (elapsedMinutes > policy.getResolutionTimeMinutes()) {

                        issue.setSlaBreached(true);

                        notificationInboxService.notifyForIssueEvent(
                                "SLA_BREACHED",
                                "SLA breached for issue: " + issue.getTitle(),
                                issue
                        );


                        auditLogService.log(
                                "SLA_BREACHED",
                                "ISSUE",
                                issue.getId(),
                                "SLA breached for priority "
                                        + issue.getPriorityLevel()
                                        + " in project "
                                        + issue.getProject().getName()
                        );
                    }
                });
    }
}
