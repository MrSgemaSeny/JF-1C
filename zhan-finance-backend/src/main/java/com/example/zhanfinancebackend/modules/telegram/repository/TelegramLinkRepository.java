package com.example.zhanfinancebackend.modules.telegram.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TelegramLinkRepository extends JpaRepository<TelegramLink, Long> {

    Optional<TelegramLink> findByUser(User user);

    Optional<TelegramLink> findByUserId(Long userId);

    @Query("SELECT tl FROM TelegramLink tl JOIN FETCH tl.user WHERE tl.user.id = :userId AND tl.isActive = true")
    Optional<TelegramLink> findByUserIdAndIsActiveTrue(@Param("userId") Long userId);

    @Query("SELECT tl FROM TelegramLink tl LEFT JOIN FETCH tl.user WHERE tl.chatId = :chatId")
    Optional<TelegramLink> findByChatId(@Param("chatId") Long chatId);

    @Query("SELECT tl FROM TelegramLink tl JOIN FETCH tl.user WHERE tl.chatId = :chatId AND tl.isActive = true")
    Optional<TelegramLink> findByChatIdAndIsActiveTrue(@Param("chatId") Long chatId);

    boolean existsByUserIdAndIsActiveTrue(Long userId);

    void deleteByUserId(Long userId);

    void deleteByChatId(Long chatId);
}
