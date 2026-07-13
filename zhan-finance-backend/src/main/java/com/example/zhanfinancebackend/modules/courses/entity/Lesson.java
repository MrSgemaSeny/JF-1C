package com.example.zhanfinancebackend.modules.courses.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lessons")
@Getter
@Setter
public class Lesson extends BaseEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private LessonType type;

    @Column(name = "order_index", nullable = false)
    private int orderIndex = 0;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 0;

    @Column(name = "is_preview", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isPreview = false;

    @Column(name = "media_url", length = 512)
    private String mediaUrl;

    @Column(columnDefinition = "TEXT")
    private String content;
}
