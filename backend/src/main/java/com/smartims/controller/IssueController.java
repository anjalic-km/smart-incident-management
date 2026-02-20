package com.smartims.controller;

import com.smartims.dto.*;
import com.smartims.entity.Issue;
import com.smartims.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','USER')")
    @PostMapping
    public ApiResponse<Void> createIssue(
            @Valid @RequestBody CreateIssueRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();

        issueService.createIssue(request, email);

        return ApiResponse.success(
                "Issue created successfully",
                null
        );
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER')")
    public ApiResponse<Void> updateIssueStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIssueStatusRequest request,
            Authentication authentication
    ) {
        String role = authentication.getAuthorities()
                .iterator()
                .next()
                .getAuthority();

        issueService.updateIssueStatus(id, request.getStatus(), role);

        return ApiResponse.success(
                "Issue status updated successfully",
                null
        );
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER','USER')")
    public ApiResponse<List<Issue>> getIssuesByProject(
            @PathVariable Long projectId) {

        return ApiResponse.success(
                "Project issues fetched successfully",
                issueService.getIssuesByProject(projectId)
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<IssueResponse> getIssueById(
            @PathVariable Long id) {

        return ApiResponse.success(
                "Issue fetched successfully",
                issueService.getIssueById(id)
        );
    }

    @GetMapping("/{id}/issues")
    public ApiResponse<List<IssueResponse>> getEngineerIssues(
            @PathVariable Long id) {

        return ApiResponse.success(
                "Engineer issues fetched successfully",
                issueService.getIssuesByEngineer(id)
        );
    }

    @GetMapping
    public ApiResponse<List<IssueResponse>> getAllIssues() {

        return ApiResponse.success(
                "Issues fetched successfully",
                issueService.getAllIssues()
        );
    }

    @PutMapping("/{issueId}/assign/{engineerId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<Void> assignEngineer(
            @PathVariable Long issueId,
            @PathVariable Long engineerId) {

        issueService.assignEngineer(issueId, engineerId);

        return ApiResponse.success(
                "Engineer assigned successfully",
                null
        );
    }

    @PostMapping("/{id}/assign")
    public ApiResponse<IssueResponse> assignIssue(
            @PathVariable Long id,
            @RequestBody AssignIssueRequest request) {

        return ApiResponse.success(
                "Issue assigned successfully",
                issueService.assignIssue(id, request.getEngineerId())
        );
    }

    @PutMapping("/{issueId}/auto-assign")
    @PreAuthorize("hasRole('MANAGER')")
    public ApiResponse<Void> autoAssignEngineer(
            @PathVariable Long issueId) {

        issueService.autoAssignEngineer(issueId);

        return ApiResponse.success(
                "Engineer auto-assigned successfully",
                null
        );
    }

    @GetMapping("/{id}/sla-status")
    public ApiResponse<SlaStatusResponse> getSlaStatus(
            @PathVariable Long id) {

        SlaStatusResponse response = issueService.getSlaStatus(id);

        return ApiResponse.success(
                "SLA status fetched successfully",
                response
        );
    }

    @GetMapping("/sla/compliance")
    public ApiResponse<SlaComplianceResponse> getSlaCompliance() {

        SlaComplianceResponse response =
                issueService.getSlaComplianceSummary();

        return ApiResponse.success(
                "SLA compliance summary fetched successfully",
                response
        );
    }


}
