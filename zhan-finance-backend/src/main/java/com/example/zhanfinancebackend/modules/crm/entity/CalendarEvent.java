package com.example.zhanfinancebackend.modules.crm.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "calendar_events")
@Getter
@Setter
@NoArgsConstructor
public class CalendarEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "event_date", nullable = false)
    private LocalDate date;

    @Column(name = "event_time")
    private LocalTime time;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 32)
    private String color = "BLUE";

    public CalendarEvent(User user, LocalDate date, LocalTime time, String title, String description, String color) {
        this.user = user;
        this.date = date;
        this.time = time;
        this.title = title;
        this.description = description;
        this.color = color;
    }
}
