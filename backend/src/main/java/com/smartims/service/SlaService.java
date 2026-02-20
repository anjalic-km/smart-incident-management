package com.smartims.service;

import com.smartims.dto.SlaCreateRequest;
import com.smartims.dto.SlaResponse;
import com.smartims.dto.SlaStatusResponse;
import com.smartims.entity.Issue;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SlaService {

    @Transactional
    SlaResponse createSla(SlaCreateRequest request);

    void applySla(Issue issue);

    void checkAndMarkBreach(Issue issue);

    SlaStatusResponse getSlaStatus(Long issueId);

    List<SlaResponse> getPoliciesForCurrentUser();
}
