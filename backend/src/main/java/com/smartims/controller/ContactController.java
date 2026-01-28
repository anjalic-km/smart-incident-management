package com.smartims.controller;

import com.smartims.dto.ContactUsRequest;
import com.smartims.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final EmailService emailService;

    @PostMapping
    public void contact(@Valid @RequestBody ContactUsRequest request) {

        emailService.sendContactToAdmin(
                request.getName(),
                request.getEmail(),
                request.getMessage()
        );

        emailService.sendContactConfirmationToUser(
                request.getEmail()
        );
    }
}
