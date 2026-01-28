package com.smartims.service;

import com.smartims.dto.UpdateSlaPolicyRequest;
import com.smartims.entity.SlaPolicy;

public abstract class AdminSlaService {
    public abstract SlaPolicy updatePolicy(
            Long projectId,
            String priorityLevel,
            UpdateSlaPolicyRequest request);

    public abstract SlaPolicy updatePolicy(
            Long projectId,
            String priorityLevel,
            UpdateSlaPolicyRequest request);

    private Integer toMinutes(long minutes) {
        if (minutes > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(
                    "Resolution time is too large"
            );
        }
        return (int) minutes;
    }
}
