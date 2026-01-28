package com.smartims.service.impl;

import com.smartims.dto.UpdateSlaPolicyRequest;
import com.smartims.entity.SlaPolicy;
import com.smartims.repository.SlaPolicyRepository;
import com.smartims.service.AdminSlaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminSlaServiceImpl extends AdminSlaService {

    private final SlaPolicyRepository slaPolicyRepository;

    @Override
    public SlaPolicy updatePolicy(
            Long projectId,
            String priorityLevel,
            UpdateSlaPolicyRequest request) {

        SlaPolicy policy = slaPolicyRepository
                .findByProjectIdAndPriorityLevel(projectId, priorityLevel)
                .orElseThrow(() ->
                        new RuntimeException(
                                "SLA policy not found for priority " + priorityLevel)
                );

        policy.setResolutionTimeMinutes(
                toMinutes(request.getResolutionTimeMinutes())
        );

        return slaPolicyRepository.save(policy);
    }

    private Integer toMinutes(long minutes) {
        if (minutes > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(
                    "Resolution time is too large"
            );
        }
        return (int) minutes;
    }
}
