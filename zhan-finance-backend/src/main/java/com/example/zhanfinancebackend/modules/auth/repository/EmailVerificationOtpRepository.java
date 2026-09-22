package com.example.zhanfinancebackend.modules.auth.repository;

import com.example.zhanfinancebackend.modules.auth.entity.EmailVerificationOtp;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, UUID> {

    Optional<EmailVerificationOtp> findByPreAuthToken(String preAuthToken);

    void deleteByUser(User user);

    void deleteByEmailIgnoreCase(String email);

    @Modifying
    @Query("DELETE FROM EmailVerificationOtp o WHERE o.expiresAt < :now")
    void deleteByExpiresAtBefore(@Param("now") LocalDateTime now);
}
