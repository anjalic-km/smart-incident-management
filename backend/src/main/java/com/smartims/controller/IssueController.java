package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.dto.CreateIssueRequest;
import com.smartims.dto.UpdateIssueStatusRequest;
import com.smartims.entity.Issue;
import com.smartims.service.IssueService;
import com.smartims.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<Void>> createIssue(
            @Valid @RequestBody CreateIssueRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();

        issueService.createIssue(request, email);

        return ResponseUtil.success(
                "Issue created successfully",
                null
        );
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateIssueStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIssueStatusRequest request,
            Authentication authentication
    ) {
        String role = authentication.getAuthorities()
                .iterator()
                .next()
                .getAuthority();

        issueService.updateIssueStatus(id, request.getStatus(), role);

        return ResponseUtil.success(
                "Issue status updated successfully",
                null
        );
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER','USER')")
    public ResponseEntity<ApiResponse<List<Issue>>> getIssuesByProject(
            @PathVariable Long projectId) {

        return ResponseUtil.success(
                "Project issues fetched successfully",
                issueService.getIssuesByProject(projectId)
        );
    }

    @PutMapping("/{issueId}/assign/{engineerId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> assignEngineer(
            @PathVariable Long issueId,
            @PathVariable Long engineerId) {

        issueService.assignEngineer(issueId, engineerId);

        return ResponseUtil.success(
                "Engineer assigned successfully",
                null
        );
    }

    @PutMapping("/{issueId}/auto-assign")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> autoAssignEngineer(
            @PathVariable Long issueId) {

        issueService.autoAssignEngineer(issueId);

        return ResponseUtil.success(
                "Engineer auto-assigned successfully",
                null
        );
    }
}
