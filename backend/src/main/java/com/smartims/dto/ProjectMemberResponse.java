package com.smartims.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProjectMemberResponse {
    private Long id;
    private String fullName;
    private String role;
}
