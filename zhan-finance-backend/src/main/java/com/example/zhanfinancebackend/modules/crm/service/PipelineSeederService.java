package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.repository.PipelineRepository;
import com.example.zhanfinancebackend.modules.crm.repository.StageRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
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

    @EventListener(ApplicationReadyEvent.class)
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
                        createStage(defaultPipeline, "Новый", "New", 0, StageType.OPEN, true, false, "var(--color-stage-new)"),
                        createStage(defaultPipeline, "Сбор документов", "Document Collection", 1, StageType.OPEN, false, false, "var(--color-stage-docs)"),
                        createStage(defaultPipeline, "Предоплата", "Prepayment", 2, StageType.OPEN, false, false, "var(--color-stage-prepay)"),
                        createStage(defaultPipeline, "В работе", "In Progress", 3, StageType.OPEN, false, false, "var(--color-stage-active)"),
                        createStage(defaultPipeline, "Счет выставлен", "Invoiced", 4, StageType.OPEN, false, false, "var(--color-stage-invoice)"),
                        createStage(defaultPipeline, "Доработка", "Rework", 5, StageType.OPEN, false, false, "var(--color-stage-rework)"),
                        createStage(defaultPipeline, "На проверке", "Review", 6, StageType.OPEN, false, true, "var(--color-stage-review)"),
                        createStage(defaultPipeline, "Успешно завершено", "Won", 7, StageType.WON, false, false, "var(--color-brand-green)"),
                        createStage(defaultPipeline, "Отменен", "Lost", 8, StageType.LOST, false, false, "var(--color-stage-lost)")
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
                boolean hasReviewStage = stageRepository.findAll().stream().anyMatch(s -> "На проверке".equals(s.getName()));
                if (!hasReviewStage) {
                    Stage reviewStage = createStage(defaultPipeline, "На проверке", "Review", 5, StageType.OPEN, false, true, "var(--color-stage-review)");
                    stageRepository.save(reviewStage);
                }

                boolean hasReworkStage = stageRepository.findAll().stream().anyMatch(s -> "Доработка".equals(s.getName()));
                if (!hasReworkStage) {
                    Stage reworkStage = createStage(defaultPipeline, "Доработка", "Rework", 5, StageType.OPEN, false, false, "var(--color-stage-rework)");
                    stageRepository.save(reworkStage);
                }
            }
        }
    }

    private Stage createStage(Pipeline pipeline, String name, String nameEn, int orderIndex, StageType type, boolean isDefault, boolean isPreFinal, String color) {
        Stage stage = new Stage();
        stage.setPipeline(pipeline);
        stage.setName(name);
        stage.setNameEn(nameEn);
        stage.setOrderIndex(orderIndex);
        stage.setType(type);
        stage.setDefault(isDefault);
        stage.setPreFinal(isPreFinal);
        stage.setColor(color);
        return stage;
    }
}
