package com.example.zhanfinancebackend.modules.auth.repository;

import com.example.zhanfinancebackend.modules.auth.entity.TwoFactorPreAuth;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TwoFactorPreAuthRepository extends JpaRepository<TwoFactorPreAuth, UUID> {

    Optional<TwoFactorPreAuth> findByToken(String token);

    void deleteByToken(String token);

    void deleteByUser(User user);

    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}
