package com.smartims.service;

import com.smartims.dto.UpdateSlaPolicyRequest;
import com.smartims.entity.SlaPolicy;

public abstract class AdminSlaService {


    public abstract SlaPolicy updatePolicy(
            Long projectId,
            String priorityLevel,
            UpdateSlaPolicyRequest request
    );

    public abstract void deletePolicy(
            Long projectId,
            String priorityLevel
    );
}
