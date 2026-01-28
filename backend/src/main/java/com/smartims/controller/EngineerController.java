package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.entity.Issue;
import com.smartims.service.EngineerService;
import com.smartims.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/engineer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ENGINEER')")
public class EngineerController {

    private final EngineerService engineerService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Object>> getDashboard(Authentication authentication) {
        return ResponseUtil.success(
                "Engineer dashboard fetched successfully",
                engineerService.getDashboard(authentication.getName())
        );
    }

    @GetMapping("/issues")
    public ResponseEntity<ApiResponse<List<Issue>>> getMyIssues(Authentication authentication) {
        return ResponseUtil.success(
                "Engineer issues fetched successfully",
                engineerService.getMyIssues(authentication.getName())
        );
    }

    @PutMapping("/issues/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateIssueStatus(
            @PathVariable Long id,
            Authentication authentication) {

        engineerService.updateIssueStatus(id, authentication.getName());

        return ResponseUtil.success(
                "Issue status updated successfully",
                null
        );
    }
}
