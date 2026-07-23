package com.example.zhanfinancebackend.modules.crm.entity;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "task_history")
public class TaskActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(name = "action_text", nullable = false, columnDefinition = "TEXT")
    private String actionText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_stage_id")
    private Stage fromStage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_stage_id")
    private Stage toStage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public TaskActivity() {
    }

    public TaskActivity(Task task, User actor, String actionText) {
        this.task = task;
        this.actor = actor;
        this.actionText = actionText;
    }

    public TaskActivity(Task task, User actor, String actionText, Stage fromStage, Stage toStage) {
        this.task = task;
        this.actor = actor;
        this.actionText = actionText;
        this.fromStage = fromStage;
        this.toStage = toStage;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Task getTask() {
        return task;
    }

    public void setTask(Task task) {
        this.task = task;
    }

    public User getActor() {
        return actor;
    }

    public void setActor(User actor) {
        this.actor = actor;
    }

    public String getActionText() {
        return actionText;
    }

    public void setActionText(String actionText) {
        this.actionText = actionText;
    }

    public Stage getFromStage() {
        return fromStage;
    }

    public void setFromStage(Stage fromStage) {
        this.fromStage = fromStage;
    }

    public Stage getToStage() {
        return toStage;
    }

    public void setToStage(Stage toStage) {
        this.toStage = toStage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
