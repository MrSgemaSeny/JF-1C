package com.example.zhanfinancebackend.modules.telegram.repository;

import com.example.zhanfinancebackend.modules.telegram.entity.TelegramNotification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface TelegramNotificationRepository extends JpaRepository<TelegramNotification, Long> {

    List<TelegramNotification> findByStatusAndAttemptsLessThanOrderByCreatedAtAsc(
            String status,
            int maxAttempts,
            Pageable pageable
    );

    @Modifying
    @Query("DELETE FROM TelegramNotification n WHERE n.status IN :statuses AND n.createdAt < :cutoff")
    int deleteByStatusInAndCreatedAtBefore(
            @Param("statuses") List<String> statuses,
            @Param("cutoff") Instant cutoff
    );
}
