package com.smartims.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateSlaPolicyRequest {

    @NotNull
    @Min(1)
    private Long resolutionTimeMinutes;

    private String description;

    public Long getResolutionTimeMinutes() {
        return resolutionTimeMinutes;
    }

    public void setResolutionTimeMinutes(Long resolutionTimeMinutes) {
        this.resolutionTimeMinutes = resolutionTimeMinutes;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
