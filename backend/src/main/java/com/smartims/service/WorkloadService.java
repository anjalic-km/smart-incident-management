package com.smartims.service;

public interface WorkloadService {

    long getEngineerWorkload(Long engineerId);

    long getManagerWorkload(Long managerId);
}
