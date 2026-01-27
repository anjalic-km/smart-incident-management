package com.smartims.controller;

import com.smartims.dto.CreateIssueRequest;
import com.smartims.dto.UpdateIssueStatusRequest;
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
    public String createIssue(
            @Valid @RequestBody CreateIssueRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName(); // from JWT

        issueService.createIssue(request, email);

        return "Issue created successfully";
    }

    @PutMapping("/{id}/status")
    public String updateIssueStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIssueStatusRequest request,
            Authentication authentication
    ) {
        String role = authentication.getAuthorities()
                .iterator()
                .next()
                .getAuthority();

        issueService.updateIssueStatus(id, request.getStatus(), role);

        return "Issue status updated successfully";
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ENGINEER','USER')")
    public List<Issue> getIssuesByProject(@PathVariable Long projectId) {
        return issueService.getIssuesByProject(projectId);
    }


}


