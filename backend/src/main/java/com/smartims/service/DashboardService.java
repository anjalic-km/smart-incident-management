package com.smartims.service;

import com.smartims.dto.DashboardSummaryResponse;
import com.smartims.dto.KeyValueCountResponse;

import java.util.List;

public interface DashboardService {

    DashboardSummaryResponse getSummary();

    List<KeyValueCountResponse> getStatusDistribution();

    List<KeyValueCountResponse> getSeverityDistribution();

    List<KeyValueCountResponse> getPriorityDistribution();

    DashboardSummaryResponse getProjectDashboard(Long projectId);

}
