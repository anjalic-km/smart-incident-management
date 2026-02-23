package com.smartims.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ProjectResponse {

    private Long id;
    private String name;
    private String description;
    private String managerName;
    private List<String> memberNames;
    private List<ProjectMemberResponse> memberDetails;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("created_at_display")
    private String createdAtDisplay;

    @JsonProperty("debug_created_at_raw")
    private String debugCreatedAtRaw;

    @JsonProperty("debug_created_at_java_type")
    private String debugCreatedAtJavaType;
}
