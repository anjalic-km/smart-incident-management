package com.smartims.repository;

import com.smartims.entity.SlaPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Long> {

    Optional<SlaPolicy> findByPriorityLevel(String priorityLevel);
}
