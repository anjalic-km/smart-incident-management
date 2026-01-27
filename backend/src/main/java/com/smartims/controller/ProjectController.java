package com.smartims.controller;

import com.smartims.dto.CreateProjectRequest;
import com.smartims.dto.ProjectResponse;
import com.smartims.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ProjectResponse createProject(@RequestBody CreateProjectRequest request) {
        return projectService.createProject(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER','USER')")
    @GetMapping
    public List<ProjectResponse> getProjects() {
        return projectService.getProjectsForCurrentUser();
    }
}
