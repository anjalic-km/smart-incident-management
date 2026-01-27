package com.smartims.controller;

import com.smartims.service.WorkloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workload")
@RequiredArgsConstructor
public class WorkloadController {

    private final WorkloadService workloadService;

    // 👷 Engineer workload
    @GetMapping("/engineer/{engineerId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER')")
    public long getEngineerWorkload(@PathVariable Long engineerId) {
        return workloadService.getEngineerWorkload(engineerId);
    }

    // 🧑‍💼 Manager workload
    @GetMapping("/manager/{managerId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public long getManagerWorkload(@PathVariable Long managerId) {
        return workloadService.getManagerWorkload(managerId);
    }
}
