package com.smartims.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SlaCreateRequest {

    @NotBlank
    private String priorityLevel;

    @NotNull
    private Long projectId;

    @NotNull
    @Min(1)
    private Integer resolutionTimeMinutes;

    private String description;
}

