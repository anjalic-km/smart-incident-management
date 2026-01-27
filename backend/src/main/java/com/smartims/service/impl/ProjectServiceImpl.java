package com.smartims.service.impl;

import com.smartims.dto.CreateProjectRequest;
import com.smartims.dto.ProjectResponse;
import com.smartims.entity.Project;
import com.smartims.entity.User;
import com.smartims.repository.ProjectRepository;
import com.smartims.repository.UserRepository;
import com.smartims.service.AuditLogService;
import com.smartims.service.NotificationInboxService;
import com.smartims.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationInboxService notificationInboxService;


    @Override
    public ProjectResponse createProject(CreateProjectRequest request) {

        User manager = userRepository.findById(request.getManagerId())
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<User> members = userRepository.findAllById(request.getMemberIds());

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .manager(manager)
                .members(members)
                .build();

        projectRepository.save(project);

        notificationInboxService.notifyForProjectEvent(
                "PROJECT_MEMBER_ADDED",
                "User added to project " + project.getName(),
                project
        );




        auditLogService.log(
                "CREATE_PROJECT",
                "PROJECT",
                project.getId(),
                "Project created with manager " + project.getManager().getEmail()
        );


        return mapToResponse(project);
    }

    @Override
    public List<ProjectResponse> getProjectsForCurrentUser() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Project> projects;

        if (currentUser.getRole().name().equals("ADMIN")) {
            projects = projectRepository.findAll();
        } else if (currentUser.getRole().name().equals("MANAGER")) {
            projects = projectRepository.findByManager(currentUser);
        } else {
            projects = projectRepository.findByMembersContaining(currentUser);
        }

        return projects.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .managerName(
                        project.getManager() != null
                                ? project.getManager().getEmail()
                                : null
                )
                .memberNames(
                        project.getMembers()
                                .stream()
                                .map(User::getEmail)
                                .collect(Collectors.toList())
                )
                .build();
    }

}
