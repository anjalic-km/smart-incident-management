package com.smartims.controller;

import com.smartims.dto.OtpRequest;
import com.smartims.dto.OtpVerifyRequest;
import com.smartims.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public void sendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.generateAndSendOtp(request.getEmail());
    }

    @PostMapping("/verify")
    public void verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
    }
}
