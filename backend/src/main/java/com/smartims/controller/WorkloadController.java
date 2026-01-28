package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.service.WorkloadService;
import com.smartims.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workload")
@RequiredArgsConstructor
public class WorkloadController {

    private final WorkloadService workloadService;

    //Engineer workload
    @GetMapping("/engineer/{engineerId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER')")
    public ResponseEntity<ApiResponse<Long>> getEngineerWorkload(
            @PathVariable Long engineerId) {

        return ResponseUtil.success(
                "Engineer workload fetched successfully",
                workloadService.getEngineerWorkload(engineerId)
        );
    }

    //Manager workload
    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Long>> getManagerWorkload(
            @PathVariable Long managerId) {

        return ResponseUtil.success(
                "Manager workload fetched successfully",
                workloadService.getManagerWorkload(managerId)
        );
    }
}
