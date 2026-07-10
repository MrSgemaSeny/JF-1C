package com.example.zhanfinancebackend.modules.courses.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "lesson_blocks")
@Getter
@Setter
public class LessonBlock extends BaseEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private BlockType type;

    @Column(name = "order_index", nullable = false)
    private int orderIndex = 0;

    @Column(columnDefinition = "TEXT")
    private String content; // JSON with block data (e.g., video URL, markdown text)
}
