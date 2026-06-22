package com.example.zhanfinancebackend.modules.auth.repository;

import com.example.zhanfinancebackend.modules.auth.entity.RefreshToken;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteAllByUser(User user);

    /**
     * Удаляет все refresh-токены пользователя, кроме указанного ID.
     * Используется в RefreshTokenService.create() для избежания race condition:
     * сначала создаём новый токен, потом удаляем все старые,
     * чтобы гарантировать, что у пользователя всегда есть валидный токен.
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = :user AND rt.id != :excludeId")
    void deleteAllByUserExceptId(@Param("user") User user, @Param("excludeId") Long excludeId);
}