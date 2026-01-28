package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.util.ResponseUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'MANAGER', 'ENGINEER')")
    public ResponseEntity<ApiResponse<String>> userProfile() {

        return ResponseUtil.success(
                "User profile access granted",
                "User profile access granted"
        );
    }
}
