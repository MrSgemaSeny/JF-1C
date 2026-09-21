package com.example.zhanfinancebackend.modules.telegram.repository;

import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLinkToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface TelegramLinkTokenRepository extends JpaRepository<TelegramLinkToken, String> {

    Optional<TelegramLinkToken> findByToken(String token);

    @Modifying
    @Query("DELETE FROM TelegramLinkToken t WHERE t.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM TelegramLinkToken t WHERE t.expiresAt < :now")
    void deleteByExpiresAtBefore(@Param("now") Instant now);
}
