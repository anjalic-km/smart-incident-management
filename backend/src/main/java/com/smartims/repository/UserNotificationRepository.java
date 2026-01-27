package com.smartims.repository;

import com.smartims.entity.User;
import com.smartims.entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserNotificationRepository
        extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findByUserOrderByReceivedAtDesc(User user);

    long countByUserAndReadFalse(User user);
}
