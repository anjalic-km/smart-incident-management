package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.dto.CreateProjectRequest;
import com.smartims.dto.ProjectResponse;
import com.smartims.service.ProjectService;
import com.smartims.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @RequestBody CreateProjectRequest request) {

        ProjectResponse response = projectService.createProject(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        HttpStatus.CREATED.value(),
                        "SUCCESS",
                        "Project created successfully",
                        response
                ));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER','USER')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjects() {

        return ResponseUtil.success(
                "Projects fetched successfully",
                projectService.getProjectsForCurrentUser()
        );
    }
}
