package com.smartims.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SlaPolicyResponse {

    private Long id;
    private String projectName;
    private String priorityLevel;
    private Integer resolutionTimeMinutes;
    private String description;
}
