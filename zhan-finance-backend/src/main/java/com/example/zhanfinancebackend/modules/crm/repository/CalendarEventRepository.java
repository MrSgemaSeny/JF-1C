package com.example.zhanfinancebackend.modules.crm.repository;

import com.example.zhanfinancebackend.modules.crm.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    
    @Query("SELECT e FROM CalendarEvent e WHERE e.user.id = :userId AND e.date >= :startDate AND e.date <= :endDate ORDER BY e.date ASC, e.time ASC")
    List<CalendarEvent> findEventsByUserAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
