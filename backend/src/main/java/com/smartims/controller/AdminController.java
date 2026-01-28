package com.smartims.controller;

import com.smartims.dto.AdminOverviewResponse;
import com.smartims.dto.AssignIssueRequest;
import com.smartims.dto.UpdatePriorityRequest;
import com.smartims.dto.ApiResponse;
import com.smartims.entity.Issue;
import com.smartims.service.AdminService;
import com.smartims.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<String>> adminDashboard() {
        return ResponseUtil.success(
                "Admin dashboard access granted",
                "Admin dashboard access granted"
        );
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewResponse>> getOverview() {
        return ResponseUtil.success(
                "Admin overview fetched successfully",
                adminService.getOverview()
        );
    }

    @GetMapping("/issues")
    public ResponseEntity<ApiResponse<List<Issue>>> getAllIssues() {
        return ResponseUtil.success(
                "Issues fetched successfully",
                adminService.getAllIssues()
        );
    }

    @PutMapping("/issues/{id}/priority")
    public ResponseEntity<ApiResponse<Void>> updatePriority(
            @PathVariable Long id,
            @RequestBody UpdatePriorityRequest request) {

        adminService.updatePriority(id, request.getPriority());

        return ResponseUtil.success(
                "Priority updated successfully",
                null
        );
    }

    @PutMapping("/issues/{id}/assign")
    public ResponseEntity<ApiResponse<Void>> assignEngineer(
            @PathVariable Long id,
            @RequestBody AssignIssueRequest request) {

        adminService.assignEngineer(id, request.getEngineerId());

        return ResponseUtil.success(
                "Engineer assigned successfully",
                null
        );
    }
}
