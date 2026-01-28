package com.smartims.controller;

import com.smartims.dto.*;
import com.smartims.service.OtpService;
import com.smartims.service.UserService;
import com.smartims.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final OtpService otpService;

    // ===================== LOGIN =====================
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseUtil.success(
                "Login successful",
                userService.login(request)
        );
    }

    // ===================== REGISTER (OTP FLOW) =====================

    // STEP 1: Send OTP
    @PostMapping("/register/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendRegisterOtp(
            @Valid @RequestBody OtpRequest request) {

        otpService.generateAndSendOtp(request.getEmail());

        return ResponseUtil.success(
                "OTP sent to email",
                null
        );
    }

    // STEP 2: Verify OTP
    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyRegisterOtp(
            @Valid @RequestBody OtpVerifyRequest request) {

        otpService.verifyOtp(request.getEmail(), request.getOtp());

        return ResponseUtil.success(
                "OTP verified successfully",
                null
        );
    }

    // STEP 3: Create Account (ONLY AFTER OTP VERIFIED)
    @PostMapping("/register/complete")
    public ResponseEntity<ApiResponse<RegisterResponse>> completeRegistration(
            @Valid @RequestBody RegisterRequest request) {

        if (!otpService.isOtpVerified(request.getEmail())) {
            throw new RuntimeException("Email verification required");
        }

        RegisterResponse response = userService.registerUser(request);
        otpService.clearOtp(request.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        HttpStatus.CREATED.value(),
                        "SUCCESS",
                        "User registered successfully",
                        response
                ));
    }
}

