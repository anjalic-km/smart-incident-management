package com.smartims.repository;

import com.smartims.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findTopByEmailOrderByExpiresAtDesc(String email);

    boolean existsByEmailAndVerifiedTrue(String email);

    void deleteByEmail(String email);
}
