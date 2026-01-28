package com.smartims.service;

import com.smartims.entity.OtpToken;
import com.smartims.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;

    public void generateAndSendOtp(String email) {

        OtpToken existing = otpTokenRepository
                .findTopByEmailOrderByExpiresAtDesc(email)
                .orElse(null);

        if (existing != null) {

            // Cooldown: 30 seconds
            if (existing.getLastSentAt()
                    .isAfter(LocalDateTime.now().minusSeconds(30))) {
                throw new RuntimeException("Please wait before resending OTP");
            }

            //Max resend limit
            if (existing.getResendCount() >= 5) {
                throw new RuntimeException("OTP resend limit reached");
            }

            existing.setResendCount(existing.getResendCount() + 1);
            existing.setLastSentAt(LocalDateTime.now());
            existing.setOtp(generateOtp());
            existing.setExpiresAt(LocalDateTime.now().plusMinutes(2));
            existing.setVerified(false);

            otpTokenRepository.save(existing);
            emailService.sendOtpEmail(email, existing.getOtp());
            return;
        }

        // First time OTP
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp(generateOtp())
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .verified(false)
                .resendCount(0)
                .lastSentAt(LocalDateTime.now())
                .build();

        otpTokenRepository.save(token);
        emailService.sendOtpEmail(email, token.getOtp());
    }

    private String generateOtp() {
        return String.valueOf(new Random().nextInt(900000) + 100000);
    }


    public void verifyOtp(String email, String otp) {

        OtpToken token = otpTokenRepository
                .findTopByEmailOrderByExpiresAtDesc(email)
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        if (token.isVerified()) {
            throw new RuntimeException("OTP already used");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }

        if (!token.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        token.setVerified(true);
        otpTokenRepository.save(token);
    }

    public boolean isOtpVerified(String email) {
        return otpTokenRepository.existsByEmailAndVerifiedTrue(email);
    }

    public void clearOtp(String email) {
        otpTokenRepository.deleteByEmail(email);
    }
}
