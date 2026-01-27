package com.smartims.service.impl;

import com.smartims.dto.DashboardSummaryResponse;
import com.smartims.dto.KeyValueCountResponse;
import com.smartims.entity.Project;
import com.smartims.entity.User;
import com.smartims.enums.IssueStatus;
import com.smartims.repository.IssueRepository;
import com.smartims.repository.ProjectRepository;
import com.smartims.repository.UserRepository;
import com.smartims.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Override
    public DashboardSummaryResponse getSummary() {

        DashboardSummaryResponse response = new DashboardSummaryResponse();
        response.setTotal(issueRepository.count());
        response.setOpen(issueRepository.countByStatus(IssueStatus.OPEN));
        response.setInProgress(issueRepository.countByStatus(IssueStatus.IN_PROGRESS));
        response.setClosed(issueRepository.countByStatus(IssueStatus.CLOSED));

        return response;
    }

    @Override
    public List<KeyValueCountResponse> getStatusDistribution() {
        return issueRepository.countByStatusGroup()
                .stream()
                .map(r -> new KeyValueCountResponse(
                        r[0].toString(),
                        (Long) r[1]
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<KeyValueCountResponse> getSeverityDistribution() {
        return issueRepository.countBySeverityGroup()
                .stream()
                .map(r -> new KeyValueCountResponse(
                        r[0].toString(),
                        (Long) r[1]
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<KeyValueCountResponse> getPriorityDistribution() {
        return issueRepository.countByPriorityGroup()
                .stream()
                .map(r -> new KeyValueCountResponse(
                        r[0] == null ? "UNSET" : r[0].toString(),
                        (Long) r[1]
                ))
                .collect(Collectors.toList());
    }

    @Override
    public DashboardSummaryResponse getProjectDashboard(Long projectId) {

        User currentUser = userRepository.findByEmail(
                SecurityContextHolder.getContext().getAuthentication().getName()
        ).orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Authorization
        if (!currentUser.getRole().name().equals("ADMIN")
                && !project.getManager().equals(currentUser)
                && !project.getMembers().contains(currentUser)) {
            throw new RuntimeException("Access denied");
        }

        DashboardSummaryResponse response = new DashboardSummaryResponse();

        response.setTotalIssues(issueRepository.countByProject(project));
        response.setOpenIssues(issueRepository.countByProjectAndStatus(project, IssueStatus.OPEN));
        response.setInProgressIssues(issueRepository.countByProjectAndStatus(project, IssueStatus.IN_PROGRESS));
        response.setClosedIssues(issueRepository.countByProjectAndStatus(project, IssueStatus.CLOSED));
        response.setSlaBreached(issueRepository.countByProjectAndSlaBreachedTrue(project));

        return response;
    }

}
