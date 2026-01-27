package com.smartims.service;

import com.smartims.dto.CreateProjectRequest;
import com.smartims.dto.ProjectResponse;

import java.util.List;

public interface ProjectService {

    ProjectResponse createProject(CreateProjectRequest request);

    List<ProjectResponse> getProjectsForCurrentUser();
}
