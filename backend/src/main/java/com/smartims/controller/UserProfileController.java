package com.smartims.controller;

import com.smartims.dto.ApiResponse;
import com.smartims.dto.UserProfileResponse;
import com.smartims.util.ResponseUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

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
                HttpStatus.OK,
                "Current user profile fetched successfully",
                response
        );
    }

//    @GetMapping
//    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
//
//        UserProfileResponse response = userProfileService.getProfile();
//
//        return ResponseUtil.success(
//                HttpStatus.OK,
//                "User profile fetched successfully",
//                response
//        );
//    }
//
//    @PutMapping
//    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
//            @RequestBody UpdateUserProfileRequest request) {
//
//        UserProfileResponse response =
//                userProfileService.updateProfile(request);
//
//        return ResponseUtil.success(
//                HttpStatus.OK,
//                "User profile updated successfully",
//                response
//        );
//    }



}
