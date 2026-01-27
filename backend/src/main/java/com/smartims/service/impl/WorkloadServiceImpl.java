package com.smartims.service.impl;

import com.smartims.entity.Project;
import com.smartims.entity.User;
import com.smartims.enums.IssueStatus;
import com.smartims.repository.IssueRepository;
import com.smartims.repository.ProjectRepository;
import com.smartims.repository.UserRepository;
import com.smartims.service.WorkloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkloadServiceImpl implements WorkloadService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Override
    public long getEngineerWorkload(Long engineerId) {

        User engineer = userRepository.findById(engineerId)
                .orElseThrow(() -> new RuntimeException("Engineer not found"));

        return issueRepository.countByAssignedEngineerAndStatusIn(
                engineer,
                List.of(IssueStatus.OPEN, IssueStatus.IN_PROGRESS)
        );
    }

    @Override
    public long getManagerWorkload(Long managerId) {

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<Project> projects = projectRepository.findByManager(manager);

        if (projects.isEmpty()) {
            return 0;
        }

        return issueRepository.countByProjectInAndStatusIn(
                projects,
                List.of(IssueStatus.OPEN, IssueStatus.IN_PROGRESS)
        );
    }
}
