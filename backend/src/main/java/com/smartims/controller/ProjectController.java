package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.dto.CreateProjectRequest;
import com.smartims.dto.ProjectResponse;
import com.smartims.dto.UpdateProjectRequest;
import com.smartims.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @RequestBody CreateProjectRequest request) {

        ProjectResponse response = projectService.createProject(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Project created successfully",
                        response
                ));
    }


    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAllProjects() {
        List<ProjectResponse> projects = projectService.getAllProjects();
        projects.stream().limit(5).forEach(project -> log.info(
                "Projects debug id={} name={} created_at={} created_at_display={} debug_created_at_raw={} debug_created_at_java_type={}",
                project.getId(),
                project.getName(),
                project.getCreatedAt(),
                project.getCreatedAtDisplay(),
                project.getDebugCreatedAtRaw(),
                project.getDebugCreatedAtJavaType()
        ));

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Projects fetched successfully",
                        projects
                )
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Project fetched successfully",
                        projectService.getProjectById(id)
                )
        );
    }


    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long id,
            @RequestBody UpdateProjectRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Project updated successfully",
                        projectService.updateProject(id, request)
                )
        );
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable Long id) {

        projectService.deleteProject(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Project deleted successfully",
                        null
                )
        );
    }

}
