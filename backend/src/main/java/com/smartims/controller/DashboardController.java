package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.dto.DashboardSummaryResponse;
import com.smartims.dto.KeyValueCountResponse;
import com.smartims.entity.Issue;
import com.smartims.repository.IssueRepository;
import com.smartims.service.DashboardService;
import com.smartims.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class DashboardController {

    private final DashboardService dashboardService;
    private final IssueRepository issueRepository;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> summary() {
        return ResponseUtil.success(
                "Dashboard summary fetched successfully",
                dashboardService.getSummary()
        );
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<List<KeyValueCountResponse>>> statusWise() {
        return ResponseUtil.success(
                "Status-wise distribution fetched successfully",
                dashboardService.getStatusDistribution()
        );
    }

    @GetMapping("/severity")
    public ResponseEntity<ApiResponse<List<KeyValueCountResponse>>> severityWise() {
        return ResponseUtil.success(
                "Severity-wise distribution fetched successfully",
                dashboardService.getSeverityDistribution()
        );
    }

    @GetMapping("/priority")
    public ResponseEntity<ApiResponse<List<KeyValueCountResponse>>> priorityWise() {
        return ResponseUtil.success(
                "Priority-wise distribution fetched successfully",
                dashboardService.getPriorityDistribution()
        );
    }

    @GetMapping("/sla-breaches")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<Issue>>> getSlaBreaches() {
        return ResponseUtil.success(
                "SLA breached issues fetched successfully",
                issueRepository.findBySlaBreachedTrue()
        );
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER','USER')")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getProjectDashboard(
            @PathVariable Long projectId) {

        return ResponseUtil.success(
                "Project dashboard fetched successfully",
                dashboardService.getProjectDashboard(projectId)
        );
    }
}
