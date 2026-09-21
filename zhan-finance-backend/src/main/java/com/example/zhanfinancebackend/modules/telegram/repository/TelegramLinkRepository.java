package com.example.zhanfinancebackend.modules.telegram.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TelegramLinkRepository extends JpaRepository<TelegramLink, Long> {

    Optional<TelegramLink> findByUser(User user);

    Optional<TelegramLink> findByUserId(Long userId);

    Optional<TelegramLink> findByUserIdAndIsActiveTrue(Long userId);

    Optional<TelegramLink> findByChatId(Long chatId);

    Optional<TelegramLink> findByChatIdAndIsActiveTrue(Long chatId);

    boolean existsByUserIdAndIsActiveTrue(Long userId);

    void deleteByUserId(Long userId);

    void deleteByChatId(Long chatId);
}
