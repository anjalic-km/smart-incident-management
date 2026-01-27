package com.smartims.repository;

import com.smartims.entity.Project;
import com.smartims.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByManager(User manager);

    List<Project> findByMembersContaining(User user);
}
