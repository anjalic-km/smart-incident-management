package com.smartims.mapper;

import com.smartims.dto.IssueResponse;
import com.smartims.entity.Issue;

public class IssueMapper {

    public static IssueResponse toResponse(Issue issue) {
        return IssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .severity("-".equals(String.valueOf(issue.getPriorityLevel())) ? "-" : issue.getSeverity().name())
                .status(issue.getStatus().name())
                .projectId(issue.getProject().getId())
                .projectName(issue.getProject().getName())
                .createdAt(issue.getCreatedAt())
                .build();
    }
}
