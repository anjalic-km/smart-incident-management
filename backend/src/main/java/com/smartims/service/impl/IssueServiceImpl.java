package com.smartims.service.impl;

import com.smartims.dto.CreateIssueRequest;
import com.smartims.entity.Issue;
import com.smartims.entity.Project;
import com.smartims.entity.User;
import com.smartims.enums.IssueStatus;
import com.smartims.exception.ResourceNotFoundException;
import com.smartims.exception.UnauthorizedException;
import com.smartims.repository.IssueRepository;
import com.smartims.repository.ProjectRepository;
import com.smartims.repository.UserRepository;
import com.smartims.service.AuditLogService;
import com.smartims.service.IssueService;
import com.smartims.service.NotificationInboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationInboxService notificationInboxService;
    private final AuditLogService auditLogService;

    @Override
    public long countByStatus(IssueStatus status) {
        return 0;
    }

    @Override
    public void createIssue(CreateIssueRequest request, String createdBy) {

        User currentUser = userRepository.findByEmail(createdBy)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!currentUser.getRole().name().equals("ADMIN")
                && !project.getManager().equals(currentUser)
                && !project.getMembers().contains(currentUser)) {
            throw new RuntimeException("You are not allowed to create issue for this project");
        }

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(request.getSeverity())
                .priorityLevel(request.getPriorityLevel())
                .status(IssueStatus.OPEN)
                .createdBy(createdBy)
                .project(project)
                .createdAt(LocalDateTime.now())
                .slaBreached(false)
                .build();

        issueRepository.save(issue);

        notificationInboxService.notifyForIssueEvent(
                "ISSUE_CREATED",
                "New issue created: " + issue.getTitle(),
                issue
        );

        auditLogService.log(
                "CREATE_ISSUE",
                "ISSUE",
                issue.getId(),
                "Issue created for project " + project.getName()
        );

    }

    @Override
    public List<Issue> getIssuesByProject(Long projectId) {

        User currentUser = userRepository.findByEmail(
                SecurityContextHolder.getContext().getAuthentication().getName()
        ).orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (currentUser.getRole().name().equals("ADMIN")) {
            return issueRepository.findByProject(project);
        }

        if (currentUser.getRole().name().equals("MANAGER")
                && project.getManager().equals(currentUser)) {
            return issueRepository.findByProject(project);
        }

        if (currentUser.getRole().name().equals("ENGINEER")) {
            return issueRepository.findByProjectAndAssignedEngineer(project, currentUser);
        }

        if (project.getMembers().contains(currentUser)) {
            return issueRepository.findByProject(project);
        }

        throw new RuntimeException("Access denied for this project");
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
                issue.setStatus(newStatus);
            }

            default -> throw new UnauthorizedException("Role not allowed to update issue status");
        }

        issueRepository.save(issue);

        notificationInboxService.notifyForIssueEvent(
                "ISSUE_STATUS_UPDATED",
                "Issue '" + issue.getTitle() + "' status changed to " + newStatus,
                issue
        );


        auditLogService.log(
                "UPDATE_ISSUE_STATUS",
                "ISSUE",
                issue.getId(),
                "Status updated to " + newStatus
        );

    }

    @Override
    public void assignEngineer(Long issueId, Long engineerId) {

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        User engineer = userRepository.findById(engineerId)
                .orElseThrow(() -> new RuntimeException("Engineer not found"));

        // Role check
        if (!engineer.getRole().name().equals("ENGINEER")) {
            throw new RuntimeException("User is not an engineer");
        }

        // Project membership check
        if (!issue.getProject().getMembers().contains(engineer)) {
            throw new RuntimeException("Engineer is not part of this project");
        }

        issue.setAssignedEngineer(engineer);
        issueRepository.save(issue);

        notificationInboxService.notifyForIssueEvent(
                "ISSUE_ASSIGNED",
                "Issue '" + issue.getTitle() + "' assigned to engineer " + engineer.getEmail(),
                issue
        );

        auditLogService.log(
                "ASSIGN_ENGINEER",
                "ISSUE",
                issue.getId(),
                "Assigned to engineer " + engineer.getEmail()
        );
    }


    @Override
    public void autoAssignEngineer(Long issueId) {

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        Project project = issue.getProject();

        // Get engineers in this project
        List<User> engineers = project.getMembers()
                .stream()
                .filter(user -> user.getRole().name().equals("ENGINEER"))
                .toList();

        if (engineers.isEmpty()) {
            throw new RuntimeException("No engineers available in project");
        }

        // Select engineer with least OPEN issues
        User selectedEngineer = engineers.stream()
                .min(Comparator.comparingLong(
                        engineer ->
                                issueRepository.countByAssignedEngineerAndStatus(
                                        engineer, IssueStatus.OPEN
                                )
                ))
                .orElseThrow();

        issue.setAssignedEngineer(selectedEngineer);
        issueRepository.save(issue);

        notificationInboxService.notifyForIssueEvent(
                "ISSUE_AUTO_ASSIGNED",
                "Issue '" + issue.getTitle() + "' auto-assigned to engineer "
                        + selectedEngineer.getEmail(),
                issue
        );

        auditLogService.log(
                "AUTO_ASSIGN_ENGINEER",
                "ISSUE",
                issue.getId(),
                "Auto-assigned to engineer " + selectedEngineer.getEmail()
        );
    }
}
