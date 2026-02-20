package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.dto.SlaCreateRequest;
import com.smartims.dto.SlaResponse;
import com.smartims.dto.UpdateSlaPolicyRequest;
import com.smartims.mapper.SlaMapper;
import com.smartims.service.AdminSlaService;
import com.smartims.service.SlaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sla")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
public class AdminSlaController {

    private final AdminSlaService adminSlaService;
    private final SlaService slaService;


//    @PostMapping
//    public SlaPolicy createPolicy(@RequestBody SlaPolicy policy) {
//        return slaPolicyRepository.save(policy);
//    }

    @PostMapping
    public ApiResponse<SlaResponse> createPolicy(
            @RequestBody @Valid SlaCreateRequest request) {

        return ApiResponse.success(
                "SLA policy created successfully",
                slaService.createSla(request)
        );
    }


    @PutMapping("/{projectId}/{priorityLevel}")
    public ApiResponse<SlaResponse> updatePolicy(
            @PathVariable Long projectId,
            @PathVariable String priorityLevel,
            @RequestBody @Valid UpdateSlaPolicyRequest request) {

        return ApiResponse.success(
                "SLA policy updated successfully",
                SlaMapper.toResponse(adminSlaService.updatePolicy(
                projectId, priorityLevel, request
                ))
        );
    }

    @GetMapping
    public ApiResponse<List<SlaResponse>> getAllPolicies() {
        List<SlaResponse> policies = slaService.getPoliciesForCurrentUser();

        return ApiResponse.success(
                "SLA policies fetched successfully",
                policies
        );
    }

    @DeleteMapping("/{projectId}/{priorityLevel}")
    public ApiResponse<Void> deletePolicy(
            @PathVariable Long projectId,
            @PathVariable String priorityLevel
    ) {
        adminSlaService.deletePolicy(projectId, priorityLevel);

        return ApiResponse.success(
                "SLA policy deleted successfully",
                null
        );
    }

}
