package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.dto.UserProfileResponse;
import com.smartims.util.ResponseUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserProfileController {

    @GetMapping("/api/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            Authentication authentication) {

        String email = authentication.getName();

        String role = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("UNKNOWN");

        UserProfileResponse response =
                new UserProfileResponse(email, role);

        return ResponseUtil.success(
                "Current user profile fetched successfully",
                response
        );
    }
}
