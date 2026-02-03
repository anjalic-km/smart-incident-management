package com.smartims.controller;

import com.smartims.dto.*;
import com.smartims.entity.User;
import com.smartims.enums.OtpPurpose;
import com.smartims.exception.AuthException;
import com.smartims.repository.UserRepository;
import com.smartims.service.OtpService;
import com.smartims.service.PendingRegisterStore;
import com.smartims.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PendingRegisterStore pendingRegisterStore;


    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ApiResponse.success(
                "Login successful",
                userService.login(request)
        );
    }

    @PostMapping("/logout")
    public ApiResponse<Object> logout(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.incrementTokenVersion();
        userRepository.save(user);

        return ApiResponse.success("Logged out successfully", null);
    }



    @PostMapping("/register")
    public ApiResponse<?> register(@RequestBody RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already registered");
        }

        PendingRegisterUser pending = new PendingRegisterUser(
                request.getFullName(),
                request.getEmail(),
                request.getPassword(),
                request.getRole()
        );

        pendingRegisterStore.save(request.getEmail(), pending);

        otpService.generateAndSendOtp(
                request.getEmail(),
                OtpPurpose.REGISTER
        );

        return ApiResponse.success("OTP sent to email");
    }


    @PostMapping("/register/request-otp")
    public ApiResponse<?> requestRegisterOtp(@RequestParam String email) {
        otpService.generateAndSendOtp(email, OtpPurpose.REGISTER);
        return ApiResponse.success("OTP sent to email");
    }

    @PostMapping("/register/verify-otp")
    public ApiResponse<?> verifyRegisterOtp(
            @RequestBody VerifyOtpRequest request
    ) {
        otpService.verifyOtp(
                request.getEmail(),
                request.getOtp(),
                OtpPurpose.REGISTER
        );

        PendingRegisterUser pending =
                pendingRegisterStore.get(request.getEmail());

        if (pending == null) {
            throw new RuntimeException("Registration session expired");
        }

        userService.createUserFromPending(pending);
        pendingRegisterStore.remove(request.getEmail());

        return ApiResponse.success("Registration completed successfully");
    }



    @PostMapping("/forgot-password/request-otp")
    public ApiResponse<?> requestForgotPasswordOtp(@RequestParam String email) {

        if (!userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is not registered");
        }

        otpService.generateAndSendOtp(email, OtpPurpose.FORGOT_PASSWORD);
        return ApiResponse.success("OTP sent to email");
    }


    @PostMapping("/forgot-password/verify-otp")
    public ApiResponse<?> verifyForgotPasswordOtp(
            @RequestParam String email,
            @RequestParam String otp
    ) {
        otpService.verifyOtp(email, otp, OtpPurpose.FORGOT_PASSWORD);
        return ApiResponse.success("OTP verified successfully");
    }


    @PostMapping("/forgot-password/reset")
    public ApiResponse<?> resetPassword(
            @RequestParam String email,
            @RequestParam String newPassword
    ) {
        if (!otpService.isOtpVerified(email, OtpPurpose.FORGOT_PASSWORD)) {
            throw new RuntimeException("OTP verification required");
        }

        userService.resetPassword(email, newPassword);
        return ApiResponse.success("Password reset successfully");
    }

}

