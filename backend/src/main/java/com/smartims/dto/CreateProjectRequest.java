package com.smartims.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateProjectRequest {

    private String name;
    private String description;
    private Long managerId;          // Assigned manager
    private List<Long> memberIds;    // Engineers + Users
}
