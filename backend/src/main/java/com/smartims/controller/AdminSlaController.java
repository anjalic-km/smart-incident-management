package com.smartims.controller;

import com.smartims.dto.UpdateSlaPolicyRequest;
import com.smartims.entity.SlaPolicy;
import com.smartims.repository.SlaPolicyRepository;
import com.smartims.service.AdminSlaService;
import com.smartims.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sla")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class AdminSlaController {

    private final SlaPolicyRepository slaPolicyRepository;
    private final NotificationService notificationService;
    private final AdminSlaService adminSlaService;


    @PostMapping
    public SlaPolicy createPolicy(@RequestBody SlaPolicy policy) {
        return slaPolicyRepository.save(policy);
    }

    @PutMapping("/{projectId}/{priorityLevel}")
    public SlaPolicy updatePolicy(
            @PathVariable Long projectId,
            @PathVariable String priorityLevel,
            @RequestBody UpdateSlaPolicyRequest request) {

        return adminSlaService.updatePolicy(
                projectId,
                priorityLevel,
                request
        );
    }




    @GetMapping
    public List<SlaPolicy> getAllPolicies() {
        return slaPolicyRepository.findAll();
    }

    @GetMapping("/test-email")
    public String testEmail() {
        notificationService.sendSlaBreachAlert(999L, "Mailtrap Test", "P1");
        return "Email sent";
    }

}
