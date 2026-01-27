package com.smartims.service.impl;

import com.smartims.dto.CreateIssueRequest;
import com.smartims.entity.Issue;
import com.smartims.enums.IssueStatus;
import com.smartims.exception.ResourceNotFoundException;
import com.smartims.exception.UnauthorizedException;
import com.smartims.repository.IssueRepository;
import com.smartims.service.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;

    @Override
    public long countByStatus(IssueStatus status) {
        return 0;
    }

    @Override
    public void createIssue(CreateIssueRequest request, String createdBy) {

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(request.getSeverity())
                .status(IssueStatus.OPEN)
                .createdBy(createdBy)
                .build();

        issue.setCreatedAt(LocalDateTime.now());
        issue.setSlaBreached(false);


        issueRepository.save(issue);
    }

    @Override
    public void updateIssueStatus(
            Long issueId,
            IssueStatus newStatus,
            String role
    ) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        IssueStatus currentStatus = issue.getStatus();

        // 🔒 Role-based workflow rules
        switch (role) {
            case "ROLE_ENGINEER" -> {
                if (currentStatus == IssueStatus.OPEN &&
                        newStatus == IssueStatus.IN_PROGRESS ||
                        currentStatus == IssueStatus.IN_PROGRESS &&
                                newStatus == IssueStatus.RESOLVED) {

                    issue.setStatus(newStatus);
                } else {
                    throw new UnauthorizedException("Invalid status transition for ENGINEER");
                }
            }

            case "ROLE_MANAGER" -> {
                if (currentStatus == IssueStatus.RESOLVED &&
                        newStatus == IssueStatus.CLOSED) {

                    issue.setStatus(newStatus);
                } else {
                    throw new UnauthorizedException("MANAGER can only close issues");
                }
            }

            case "ROLE_ADMIN" -> {
                issue.setStatus(newStatus); // Admin override
            }

            default -> throw new UnauthorizedException("Role not allowed to update issue status");
        }

        issueRepository.save(issue);
    }

}
