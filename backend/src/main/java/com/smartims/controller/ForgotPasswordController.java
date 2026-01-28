package com.smartims.controller;

import com.smartims.dto.OtpRequest;
import com.smartims.dto.OtpVerifyRequest;
import com.smartims.dto.ResetPasswordRequest;
import com.smartims.service.OtpService;
import com.smartims.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/forgot-password")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final OtpService otpService;
    private final UserService userService;

    @PostMapping("/send-otp")
    public void sendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.generateAndSendOtp(request.getEmail());
    }

    @PostMapping("/verify-otp")
    public void verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
    }

    @PostMapping("/reset")
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {

        if (!otpService.isOtpVerified(request.getEmail())) {
            throw new RuntimeException("OTP verification required");
        }

        userService.resetPassword(
                request.getEmail(),
                request.getNewPassword()
        );

        otpService.clearOtp(request.getEmail());
    }
}
