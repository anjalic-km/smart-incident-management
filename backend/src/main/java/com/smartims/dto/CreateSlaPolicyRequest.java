package com.smartims.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSlaPolicyRequest {

    private Long projectId;
    private String priorityLevel;
    private Integer resolutionTimeMinutes;
    private String description; // 🔥 ADD THIS
}
