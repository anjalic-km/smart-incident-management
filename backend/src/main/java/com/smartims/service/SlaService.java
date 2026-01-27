package com.smartims.service;

import com.smartims.entity.Issue;

public interface SlaService {

    void applySla(Issue issue);

    void checkAndMarkBreach(Issue issue);
}
