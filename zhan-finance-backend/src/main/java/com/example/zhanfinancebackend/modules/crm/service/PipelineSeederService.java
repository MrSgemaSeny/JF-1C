package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.repository.PipelineRepository;
import com.example.zhanfinancebackend.modules.crm.repository.StageRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PipelineSeederService {

    private final PipelineRepository pipelineRepository;
    private final StageRepository stageRepository;
    private final TaskRepository taskRepository;

    public PipelineSeederService(PipelineRepository pipelineRepository, StageRepository stageRepository, TaskRepository taskRepository) {
        this.pipelineRepository = pipelineRepository;
        this.stageRepository = stageRepository;
        this.taskRepository = taskRepository;
    }

    @PostConstruct
    @Transactional
    public void seedData() {
        Pipeline defaultPipeline;
        if (pipelineRepository.count() == 0) {
            defaultPipeline = new Pipeline();
            defaultPipeline.setName("Общая воронка");
            defaultPipeline.setDefault(true);
            defaultPipeline = pipelineRepository.save(defaultPipeline);
        } else {
            defaultPipeline = pipelineRepository.findByIsDefaultTrue()
                .orElseGet(() -> pipelineRepository.findAll().stream().findFirst().orElse(null));
        }

        if (defaultPipeline != null) {
            long stageCount = stageRepository.count();
            if (stageCount == 0) {
                List<Stage> savedStages = stageRepository.saveAll(List.of(
                        createStage(defaultPipeline, "Новый", 0, StageType.OPEN, true, "var(--color-stage-new)"),
                        createStage(defaultPipeline, "Сбор документов", 1, StageType.OPEN, false, "var(--color-stage-docs)"),
                        createStage(defaultPipeline, "Предоплата", 2, StageType.OPEN, false, "var(--color-stage-prepay)"),
                        createStage(defaultPipeline, "В работе", 3, StageType.OPEN, false, "var(--color-stage-active)"),
                        createStage(defaultPipeline, "Счет выставлен", 4, StageType.OPEN, false, "var(--color-stage-invoice)"),
                        createStage(defaultPipeline, "Доработка", 5, StageType.OPEN, false, "var(--color-stage-rework)"),
                        createStage(defaultPipeline, "На проверке", 6, StageType.OPEN, false, "var(--color-stage-review)"),
                        createStage(defaultPipeline, "Успешно завершено", 7, StageType.WON, false, "var(--color-brand-green)"),
                        createStage(defaultPipeline, "Отменен", 8, StageType.LOST, false, "var(--color-stage-lost)")
                ));
                
                // Назначаем задачам без стадии дефолтную стадию "Новый"
                Stage defaultStage = savedStages.get(0);
                taskRepository.findAll().forEach(task -> {
                    if (task.getStage() == null) {
                        task.setStage(defaultStage);
                        taskRepository.save(task);
                    }
                });
            } else {
                // Check if "На проверке" exists, if not, create it
                boolean hasReviewStage = stageRepository.findAll().stream()
                        .anyMatch(s -> "На проверке".equals(s.getName()));
                if (!hasReviewStage) {
                    Stage reviewStage = createStage(defaultPipeline, "На проверке", 5, StageType.OPEN, false, "var(--color-stage-review)");
                    stageRepository.save(reviewStage);
                    
                    // Shift indices of later stages
                    stageRepository.findAll().forEach(s -> {
                        if (s.getOrderIndex() >= 5 && !"На проверке".equals(s.getName())) {
                            s.setOrderIndex(s.getOrderIndex() + 1);
                            stageRepository.save(s);
                        }
                    });
                }

                // Check if "Доработка" exists, if not, create it at index 5 and push others
                boolean hasReworkStage = stageRepository.findAll().stream()
                        .anyMatch(s -> "Доработка".equals(s.getName()));
                if (!hasReworkStage) {
                    Stage reworkStage = createStage(defaultPipeline, "Доработка", 5, StageType.OPEN, false, "var(--color-stage-rework)");
                    stageRepository.save(reworkStage);
                    
                    // Shift indices of later stages (which includes 'На проверке' now)
                    stageRepository.findAll().forEach(s -> {
                        if (s.getOrderIndex() >= 5 && !"Доработка".equals(s.getName())) {
                            s.setOrderIndex(s.getOrderIndex() + 1);
                            stageRepository.save(s);
                        }
                    });
                }
            }
        }
    }

    private Stage createStage(Pipeline pipeline, String name, int orderIndex, StageType type, boolean isDefault, String color) {
        Stage stage = new Stage();
        stage.setPipeline(pipeline);
        stage.setName(name);
        stage.setOrderIndex(orderIndex);
        stage.setType(type);
        stage.setDefault(isDefault);
        stage.setColor(color);
        return stage;
    }
}
