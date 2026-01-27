package com.smartims.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DashboardSummaryResponse {

    private long total;
    private long open;
    private long inProgress;
    private long closed;
    private long slaBreached;

    public void setTotalIssues(long l) {
    }

    public void setOpenIssues(long l) {
    }

    public void setInProgressIssues(long l) {
    }

    public void setClosedIssues(long l) {
    }
}
