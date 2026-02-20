package com.smartims.service.impl;

import com.smartims.dto.CreateIssueRequest;
import com.smartims.dto.IssueResponse;
import com.smartims.dto.SlaComplianceResponse;
import com.smartims.dto.SlaStatusResponse;
import com.smartims.repository.SlaBreachRepository;
import com.smartims.entity.*;
import com.smartims.enums.IssueStatus;
import com.smartims.enums.Severity;
import com.smartims.exception.ResourceNotFoundException;
import com.smartims.exception.UnauthorizedException;
import com.smartims.mapper.IssueMapper;
import com.smartims.repository.*;
import com.smartims.service.AuditLogService;
import com.smartims.service.IssueActivityService;
import com.smartims.service.IssueService;
import com.smartims.service.NotificationInboxService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final SlaBreachRepository slaBreachRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationInboxService notificationInboxService;
    private final AuditLogService auditLogService;
    private final IssueActivityService issueActivityService;

    @Override
    public long countByStatus(IssueStatus status) {
        return issueRepository.countByStatus(status);
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

        String severity;
        String priorityLevel;

        if (project.getManager().equals(currentUser)) {
            severity = String.valueOf(request.getSeverity());
            priorityLevel = request.getPriorityLevel();
        } else {
            severity = "MEDIUM";
            priorityLevel = "P3";
        }

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(Severity.valueOf(severity))
                .priorityLevel(priorityLevel)
                .status(IssueStatus.OPEN)
                .createdBy(createdBy)
                .project(project)
                .createdAt(LocalDateTime.now())
                .slaBreached(false)
                .build();

        issue.setSlaStartTime(LocalDateTime.now());
        issue.setSlaDueTime(LocalDateTime.now().plusMinutes(60));

        Issue savedIssue = issueRepository.save(issue);

        notificationInboxService.notifyForIssueEvent(
                "ISSUE_CREATED",
                "New issue created: " + savedIssue.getTitle(),
                savedIssue
        );

        issueActivityService.logActivity(
                savedIssue,
                "CREATED",
                "Issue created"
        );

        auditLogService.log(
                "ISSUE_CREATED",
                "ISSUE",
                savedIssue.getId(),
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

        if (currentUser.getRole().name().equals("ADMIN")
                || (currentUser.getRole().name().equals("MANAGER")
                && project.getManager().equals(currentUser))
                || project.getMembers().contains(currentUser)) {

            if (currentUser.getRole().name().equals("ENGINEER")) {
                return issueRepository.findByProjectAndAssignedEngineer(project, currentUser);
            }

            return issueRepository.findByProject(project);
        }

        throw new RuntimeException("Access denied for this project");
    }

    @Override
    public void updateIssueStatus(Long issueId, IssueStatus newStatus, String role) {

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        // Check access permissions
        validateIssueAccess(issue);

        IssueStatus oldStatus = issue.getStatus();

        switch (role) {
            case "ROLE_ENGINEER" -> {
                if ((oldStatus == IssueStatus.OPEN && newStatus == IssueStatus.IN_PROGRESS)
                        || (oldStatus == IssueStatus.IN_PROGRESS && newStatus == IssueStatus.RESOLVED)) {
                    issue.setStatus(newStatus);
                } else {
                    throw new UnauthorizedException("Invalid status transition for ENGINEER");
                }
            }
            case "ROLE_MANAGER" -> {
                if (oldStatus == IssueStatus.RESOLVED && newStatus == IssueStatus.CLOSED) {
                    issue.setStatus(newStatus);
                } else {
                    throw new UnauthorizedException("MANAGER can only close issues");
                }
            }
            case "ROLE_ADMIN" -> issue.setStatus(newStatus);
            default -> throw new UnauthorizedException("Role not allowed to update issue status");
        }

        issueRepository.save(issue);

        issueActivityService.logActivity(
                issue,
                "STATUS_UPDATED",
                "Status changed from " + oldStatus + " to " + newStatus
        );

        notificationInboxService.notifyForIssueEvent(
                "ISSUE_STATUS_UPDATED",
                "Issue '" + issue.getTitle() + "' status changed from "
                        + oldStatus + " to " + newStatus,
                issue
        );

        auditLogService.log(
                "ISSUE_STATUS_UPDATED",
                "ISSUE",
                issue.getId(),
                "Status updated from " + oldStatus + " to " + newStatus
        );
    }

    @Override
    public IssueResponse getIssueById(Long id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));
        
        // Check access permissions
        validateIssueAccess(issue);
        
        return IssueMapper.toResponse(issue);
    }

    @Override
    public List<IssueResponse> getAllIssues() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? auth.getName() : null;

        // If no authentication, return all issues (shouldn't happen in practice)
        if (email == null) {
            return issueRepository.findAll()
                    .stream()
                    .map(IssueMapper::toResponse)
                    .toList();
        }

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Issue> issues;

        // SUPER_ADMIN can see all issues
        if (currentUser.getRole().name().equals("SUPER_ADMIN")) {
            issues = issueRepository.findAll();
        }
        // ADMIN can see only their company's issues
        else if (currentUser.getRole().name().equals("ADMIN")) {
            String company = currentUser.getCompany();
            if (company == null || company.isBlank()) {
                issues = issueRepository.findAll();
            } else {
                issues = issueRepository.findByCompany(company);
            }
        }
        // MANAGER can see only issues in their projects
        else if (currentUser.getRole().name().equals("MANAGER")) {
            List<Project> managerProjects = projectRepository.findByManager(currentUser);
            issues = managerProjects.stream()
                    .flatMap(project -> issueRepository.findByProject(project).stream())
                    .toList();
        }
        // ENGINEER and USER can see only issues assigned to them
        else {
            issues = issueRepository.findByAssignedEngineer(currentUser);
        }

        return issues.stream()
                .map(IssueMapper::toResponse)
                .toList();
    }

    @Override
    public void assignEngineer(Long issueId, Long engineerId) {

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        // Check access permissions
        validateIssueAccess(issue);

        User engineer = userRepository.findById(engineerId)
                .orElseThrow(() -> new RuntimeException("Engineer not found"));

        if (!engineer.getRole().name().equals("ENGINEER")) {
            throw new RuntimeException("User is not an engineer");
        }

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

        issueActivityService.logActivity(
                issue,
                "ASSIGNED",
                "Assigned to " + engineer.getFullName()
        );

        auditLogService.log(
                "ENGINEER_ASSIGNED",
                "ISSUE",
                issue.getId(),
                "Assigned to engineer " + engineer.getEmail()
        );
    }

    @Override
    @Transactional
    public IssueResponse assignIssue(Long issueId, Long engineerId) {

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        // Check access permissions
        validateIssueAccess(issue);

        User engineer = userRepository.findById(engineerId)
                .orElseThrow(() -> new RuntimeException("Engineer not found"));

        issue.setAssignedEngineer(engineer);

        Issue saved = issueRepository.save(issue);

        auditLogService.log(
                "ENGINEER_ASSIGNED",
                "ISSUE",
                saved.getId(),
                "Assigned to engineer " + engineer.getEmail()
        );

        return IssueMapper.toResponse(saved);
    }

    @Override
    public List<IssueResponse> getIssuesByEngineer(Long engineerId) {
        return issueRepository.findByAssignedEngineerId(engineerId)
                .stream()
                .map(IssueMapper::toResponse)
                .toList();
    }

    private void recordSlaBreachIfNeeded(Issue issue, LocalDateTime dueTime, LocalDateTime breachedAt) {

        if (slaBreachRepository.existsByIssue(issue)) {
            return;
        }

        long delayMinutes = Duration.between(dueTime, breachedAt).toMinutes();

        SlaBreach breach = new SlaBreach();
        breach.setIssue(issue);
        breach.setBreachedAt(breachedAt);
        breach.setSlaDueTime(dueTime);
        breach.setDelayMinutes(delayMinutes);

        slaBreachRepository.save(breach);

        issue.setSlaBreached(true);
        issueRepository.save(issue);

        auditLogService.logSystem(
                "SLA_BREACH_RECORDED",
                "SLA breach recorded with delay " + delayMinutes + " minutes",
                issue.getId(),
                "ISSUE"
        );
    }

    @Override
    public void autoAssignEngineer(Long issueId) {

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        // Check access permissions
        validateIssueAccess(issue);

        Project project = issue.getProject();

        List<User> engineers = project.getMembers()
                .stream()
                .filter(u -> u.getRole().name().equals("ENGINEER"))
                .toList();

        if (engineers.isEmpty()) {
            throw new RuntimeException("No engineers available in project");
        }

        User selectedEngineer = engineers.stream()
                .min(Comparator.comparingLong(
                        engineer -> issueRepository.countByAssignedEngineerAndStatus(
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

        issueActivityService.logActivity(
                issue,
                "AUTO_ASSIGNED",
                "Auto-assigned to " + selectedEngineer.getFullName()
        );

        auditLogService.logSystem(
                "ISSUE_AUTO_ASSIGNED",
                "Auto-assigned to engineer " + selectedEngineer.getEmail(),
                issue.getId(),
                "ISSUE"
        );
    }

    @Override
    public SlaStatusResponse getSlaStatus(Long issueId) {

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        // Check access permissions
        validateIssueAccess(issue);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = issue.getSlaStartTime();
        LocalDateTime due = issue.getSlaDueTime();

        if (start == null || due == null) {
            throw new RuntimeException("SLA not initialized for this issue");
        }

        long totalMinutes = Duration.between(start, due).toMinutes();
        long remainingMinutes = Duration.between(now, due).toMinutes();

        String status;

        if (now.isAfter(due)) {
            status = "BREACHED";
            remainingMinutes = 0;
            recordSlaBreachIfNeeded(issue, due, now);
        } else if (remainingMinutes <= totalMinutes * 0.2) {
            status = "AT_RISK";
        } else {
            status = "ON_TRACK";
        }

        return SlaStatusResponse.builder()
                .slaStartTime(start)
                .slaDueTime(due)
                .remainingMinutes(remainingMinutes)
                .status(status)
                .build();
    }

    @Override
    public SlaComplianceResponse getSlaComplianceSummary() {

        long totalIssues = issueRepository.count();
        long breached = issueRepository.countBySlaBreachedTrue();
        long met = totalIssues - breached;

        double compliance = totalIssues == 0
                ? 100.0
                : ((double) met / totalIssues) * 100;

        return SlaComplianceResponse.builder()
                .totalIssues(totalIssues)
                .slaBreached(breached)
                .slaMet(met)
                .compliancePercentage(
                        Math.round(compliance * 100.0) / 100.0
                )
                .build();
    }

    private void validateIssueAccess(Issue issue) {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? auth.getName() : null;

        if (email == null) {
            throw new RuntimeException("User not authenticated");
        }

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // SUPER_ADMIN can access any issue
        if (currentUser.getRole().name().equals("SUPER_ADMIN")) {
            return;
        }

        // ADMIN can access issues from their company only
        if (currentUser.getRole().name().equals("ADMIN")) {
            String userCompany = currentUser.getCompany();
            String issueProjectManagerCompany = issue.getProject().getManager() != null ? 
                    issue.getProject().getManager().getCompany() : null;

            if (userCompany == null || !userCompany.equals(issueProjectManagerCompany)) {
                throw new RuntimeException("Access denied: Issue belongs to a different company");
            }
            return;
        }

        // MANAGER can access issues from their projects only
        if (currentUser.getRole().name().equals("MANAGER")) {
            if (!issue.getProject().getManager().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Access denied: Issue is not in your project");
            }
            return;
        }

        // ENGINEER and USER can access only issues assigned to them
        if (!currentUser.getId().equals(issue.getAssignedEngineer() != null ? 
                issue.getAssignedEngineer().getId() : null)) {
            throw new RuntimeException("Access denied: This issue is not assigned to you");
        }
    }
}
