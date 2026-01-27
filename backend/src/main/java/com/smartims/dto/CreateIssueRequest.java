package com.smartims.dto;

import com.smartims.enums.Severity;
import lombok.Getter;

@Getter
public class CreateIssueRequest {

    private String title;
    private String description;
    private Severity severity;
    private String priorityLevel;
    private Long projectId;

}
