package com.smartims.scheduler;

import com.smartims.entity.Issue;
import com.smartims.repository.IssueRepository;
import com.smartims.service.SlaService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SlaScheduler {

    private final IssueRepository issueRepository;
    private final SlaService slaService;

    @Scheduled(fixedRate = 300000) // every 5 minutes
    public void checkSlaBreaches() {

        List<Issue> openIssues = issueRepository.findAll();

        for (Issue issue : openIssues) {
            slaService.checkAndMarkBreach(issue);
        }

        issueRepository.saveAll(openIssues);
    }
}
