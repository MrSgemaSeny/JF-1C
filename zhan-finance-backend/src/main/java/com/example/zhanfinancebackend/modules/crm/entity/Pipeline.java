package com.example.zhanfinancebackend.modules.crm.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import jakarta.persistence.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pipelines")
@EntityListeners(AuditingEntityListener.class)
public class Pipeline extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    @OneToMany(mappedBy = "pipeline", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<Stage> stages = new ArrayList<>();

    protected Pipeline() {}

    public Pipeline(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isDefault() {
        return isDefault;
    }

    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
    }

    public List<Stage> getStages() {
        return stages;
    }

    public void setStages(List<Stage> stages) {
        this.stages.clear();
        if (stages != null) {
            this.stages.addAll(stages);
            for (Stage stage : stages) {
                stage.setPipeline(this);
            }
        }
    }

    public void addStage(Stage stage) {
        stages.add(stage);
        stage.setPipeline(this);
    }

    public void removeStage(Stage stage) {
        stages.remove(stage);
        stage.setPipeline(null);
    }
}
