package com.smartims.service;

import com.smartims.entity.Issue;
import com.smartims.entity.Project;

public interface NotificationInboxService {

    void notifyForIssueEvent(
            String type,
            String message,
            Issue issue
    );

    void notifyForProjectEvent(
            String type,
            String message,
            Project project
    );
}

