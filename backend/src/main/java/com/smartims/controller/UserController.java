package com.smartims.controller;

import com.smartims.dto.*;
import com.smartims.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // POST - Create user
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ApiResponse<UserResponse> createUser(
            @RequestBody UserCreateRequest request) {
        UserResponse response = userService.createUser(request);

        return ApiResponse.success(
                "User created successfully",
                response
        );
    }

    // GET - All users
    @GetMapping
    public ApiResponse<List<UserResponse>> getAllUsers() {

        return ApiResponse.success(
                "Users fetched successfully",
                userService.getAllUsers()
        );
    }


    // GET - User by ID
    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getUserById(
            @PathVariable Long id) {

        return ApiResponse.success(
                "User fetched successfully",
                userService.getUserById(id)
        );
    }


    // PUT - Update user
    @PutMapping("/{id}")
    public ApiResponse<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateRequest request) {

        return ApiResponse.success(
                "User updated successfully",
                userService.updateUser(id, request)
        );
    }


    // DELETE - Delete user
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(
            @PathVariable Long id) {

        userService.deleteUser(id);

        return ApiResponse.success(
                "User deleted successfully",
                null
        );
    }


    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody UpdateUserStatusRequest request) {

        userService.updateUserStatus(id, request.isEnabled());

        return ResponseEntity.ok(
                ApiResponse.success(
                        request.isEnabled()
                                ? "User enabled successfully"
                                : "User disabled successfully",
                        null
                )
        );
    }

    @PutMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<Void>> updateUserLockStatus(
            @PathVariable Long id,
            @RequestBody UpdateUserLockRequest request) {

        userService.updateUserLockStatus(id, request.isLocked());

        return ResponseEntity.ok(
                ApiResponse.success(
                        request.isLocked()
                                ? "User locked successfully"
                                : "User unlocked successfully",
                        null
                )
        );
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<LoginResponse>> changePassword(
            @RequestBody ChangePasswordRequest request) {

        LoginResponse response = userService.changePassword(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Password changed successfully",
                        response
                )
        );
    }
}