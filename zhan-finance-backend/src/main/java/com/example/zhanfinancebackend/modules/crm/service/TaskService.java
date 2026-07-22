package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.dto.UserDto;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.ClientInfoDto;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeInfoDto;
import com.example.zhanfinancebackend.modules.crm.dto.TaskCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.dto.TaskRequestCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.TaskBatchUpdateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.SubtaskDto;
import com.example.zhanfinancebackend.modules.crm.dto.SubtaskCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.TaskCommentDto;
import com.example.zhanfinancebackend.modules.crm.dto.TaskActivityDto;
import com.example.zhanfinancebackend.modules.crm.dto.StageDto;
import com.example.zhanfinancebackend.modules.crm.entity.Subtask;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.TaskComment;
import com.example.zhanfinancebackend.modules.crm.entity.TaskActivity;

import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.crm.repository.StageRepository;
import com.example.zhanfinancebackend.modules.crm.repository.PipelineRepository;
import com.example.zhanfinancebackend.modules.audit.service.AuditService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Stream;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CrmAccessService accessService;
    private final com.example.zhanfinancebackend.modules.notifications.service.NotificationService notificationService;
    private final com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService emailNotificationService;
    private final AuditService auditService;
    private final com.example.zhanfinancebackend.modules.services.repository.ServiceRepository serviceRepository;
    private final StageRepository stageRepository;
    private final PipelineRepository pipelineRepository;
    private final com.example.zhanfinancebackend.modules.crm.mapper.TaskMapper taskMapper;
    private final com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository documentRepository;
    private final com.example.zhanfinancebackend.modules.documents.service.StorageService storageService;
    private final ClientService clientService;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            CrmAccessService accessService,
            com.example.zhanfinancebackend.modules.notifications.service.NotificationService notificationService,
            com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService emailNotificationService,
            AuditService auditService,
            com.example.zhanfinancebackend.modules.services.repository.ServiceRepository serviceRepository,
            StageRepository stageRepository,
            PipelineRepository pipelineRepository,
            com.example.zhanfinancebackend.modules.crm.mapper.TaskMapper taskMapper,
            com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository documentRepository,
            com.example.zhanfinancebackend.modules.documents.service.StorageService storageService,
            ClientService clientService
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
        this.auditService = auditService;
        this.serviceRepository = serviceRepository;
        this.stageRepository = stageRepository;
        this.pipelineRepository = pipelineRepository;
        this.taskMapper = taskMapper;
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.clientService = clientService;
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getAllTasks() {
        return taskRepository.findAllWithDetails().stream().map(taskMapper::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getAllTasks(Long clientId, Long assignedToId, Long stageId, Boolean unassigned) {
        org.springframework.data.jpa.domain.Specification<Task> spec = com.example.zhanfinancebackend.modules.crm.repository.TaskSpecification.filterTasks(clientId, assignedToId, stageId, unassigned);
        return taskRepository.findAll(spec).stream().map(taskMapper::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getTasksForClient(User client) {
        return taskRepository.findAllByClientWithDetails(client.getId()).stream().map(taskMapper::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getTasksForEmployee(User employee) {
        return taskRepository.findAllByEmployeeWithDetails(employee).stream().map(taskMapper::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getArchivedTasks(StageType stageType) {
        return taskRepository.findArchivedByStageType(stageType).stream().map(taskMapper::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public Task getTaskEntity(Long id) {
        return taskRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Task not found"));
    }

    @Transactional(readOnly = true)
    public TaskDto getTask(Long id) {
        return taskMapper.mapToDto(getTaskEntity(id));
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto createTask(TaskCreateRequest request, User creator) {
        User client = userRepository.findById(request.clientId())
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Client not found"));

        accessService.assertCanCreateTaskFor(creator, client);

        Task task = new Task(request.title(), client, creator);
        task.setDescription(request.description());

        task.setDueDate(request.dueDate());

        Pipeline pipeline = pipelineRepository.findByIsDefaultTrue()
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Default pipeline not found"));
        Stage defaultStage = stageRepository.findByPipelineIdAndIsDefaultTrue(pipeline.getId()).orElse(null);
        if (defaultStage == null) {
            defaultStage = stageRepository.findByPipelineIdOrderByOrderIndexAsc(pipeline.getId()).stream().findFirst()
                    .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Default stage not found"));
        }
        task.setStage(defaultStage);

        if (request.assignedToId() != null) {
            User assignee = userRepository.findById(request.assignedToId())
                    .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Assignee not found"));
            task.setAssignedTo(assignee);
        } else if (client.getAssignedEmployee() != null) {
            task.setAssignedTo(client.getAssignedEmployee());
        }

        if (request.subtasks() != null) {
            for (SubtaskCreateRequest stReq : request.subtasks()) {
                Subtask subtask = new Subtask(task, stReq.title());
                if (stReq.status() != null) {
                    subtask.setStatus(stReq.status());
                }
                task.addSubtask(subtask);
            }
        }
        
        if (request.serviceIds() != null && !request.serviceIds().isEmpty()) {
            List<com.example.zhanfinancebackend.modules.services.entity.ServiceEntity> services = serviceRepository.findAllById(request.serviceIds());
            task.setServices(services);
        }

        Task savedTask = taskRepository.save(task);
        auditService.logAction("CREATE", "Task", savedTask.getId(), "Task created: " + savedTask.getTitle());

        if (creator.getRole() != com.example.zhanfinancebackend.modules.auth.entity.Role.CLIENT) {
            notificationService.createNotification(
                    client,
                    "Новая задача",
                    "Вам создана новая задача: " + savedTask.getTitle(),
                    "/client"
            );
        }

        notificationService.notifyAdmins(
                "Новая задача",
                "Создана новая задача: " + savedTask.getTitle() + " для клиента " + client.getFullName(),
                "/admin/tasks"
        );

        if (savedTask.getAssignedTo() != null) {
            notificationService.createNotification(
                    savedTask.getAssignedTo(),
                    "Новая задача",
                    "Вам назначена задача: " + savedTask.getTitle(),
                    "/employee/tasks"
            );
            emailNotificationService.sendTaskAssignedEmail(savedTask.getAssignedTo(), savedTask);
        }

        return taskMapper.mapToDto(savedTask);
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto requestTask(TaskRequestCreateRequest request, User client) {
        User managedClient = userRepository.findById(client.getId())
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Client not found"));

        Task task = new Task(request.title(), managedClient, managedClient);
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());

        Pipeline pipeline = pipelineRepository.findByIsDefaultTrue()
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Default pipeline not found"));
        Stage defaultStage = stageRepository.findByPipelineIdAndIsDefaultTrue(pipeline.getId()).orElse(null);
        if (defaultStage == null) {
            defaultStage = stageRepository.findByPipelineIdOrderByOrderIndexAsc(pipeline.getId()).stream().findFirst()
                    .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Default stage not found"));
        }
        task.setStage(defaultStage);

        if (managedClient.getAssignedEmployee() != null) {
            task.setAssignedTo(managedClient.getAssignedEmployee());
        }

        if (request.subtasks() != null) {
            for (SubtaskCreateRequest stReq : request.subtasks()) {
                Subtask subtask = new Subtask(task, stReq.title());
                if (stReq.status() != null) {
                    subtask.setStatus(stReq.status());
                }
                task.addSubtask(subtask);
            }
        }

        if (request.serviceIds() != null && !request.serviceIds().isEmpty()) {
            List<com.example.zhanfinancebackend.modules.services.entity.ServiceEntity> services = serviceRepository.findAllById(request.serviceIds());
            task.setServices(services);
        }

        Task savedTask = taskRepository.save(task);
        auditService.logAction("CREATE", "Task", savedTask.getId(), "Client requested task: " + savedTask.getTitle());

        notificationService.notifyAdmins(
                "Новая задача от клиента",
                "Клиент " + managedClient.getFullName() + " создал запрос на услугу: " + savedTask.getTitle(),
                "/admin/tasks"
        );

        User employee = managedClient.getAssignedEmployee();
        if (employee != null) {
            notificationService.createNotification(
                    employee,
                    "Новая задача от клиента",
                    "Клиент " + managedClient.getFullName() + " создал запрос на услугу: " + savedTask.getTitle(),
                    "/employee/tasks"
            );
            emailNotificationService.sendTaskAssignedEmail(employee, savedTask);
        }

        return taskMapper.mapToDto(savedTask);
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto updateTaskDetails(Long taskId, com.example.zhanfinancebackend.modules.crm.dto.TaskUpdateRequest request, User user) {
        Task task = getTaskEntity(taskId);
        accessService.assertCanUpdateTaskStage(user, task, task.getStage()); // Using this check for now to ensure they have write access

        boolean isEdited = false;
        if (request.title() != null && !request.title().trim().isEmpty()) {
            task.setTitle(request.title().trim());
            isEdited = true;
        }
        if (request.description() != null) {
            task.setDescription(request.description().trim());
            isEdited = true;
        }
        if (request.tags() != null) {
            task.setTags(request.tags());
        }
        if (isEdited) {
            task.setEditedAt(java.time.LocalDateTime.now());
        }
        
        if (request.subtasks() != null) {
            // keep existing subtasks to preserve status
            java.util.List<Subtask> existing = task.getSubtasks();
            java.util.Map<Long, Subtask> existingMap = new java.util.HashMap<>();
            for (Subtask st : existing) {
                if (st.getId() != null) {
                    existingMap.put(st.getId(), st);
                }
            }
            
            java.util.List<Subtask> updatedSubtasks = new java.util.ArrayList<>();
            for (com.example.zhanfinancebackend.modules.crm.dto.SubtaskDto stDto : request.subtasks()) {
                if (stDto.id() != null && stDto.id() > 0 && existingMap.containsKey(stDto.id())) {
                    Subtask st = existingMap.get(stDto.id());
                    st.setTitle(stDto.title());
                    if (stDto.status() != null) {
                        st.setStatus(stDto.status());
                    }
                    updatedSubtasks.add(st);
                } else {
                    Subtask newSt = new Subtask(task, stDto.title());
                    if (stDto.status() != null) {
                        newSt.setStatus(stDto.status());
                    }
                    updatedSubtasks.add(newSt);
                }
            }
            task.setSubtasks(updatedSubtasks);
        }

        Task savedTask = taskRepository.save(task);
        logActivity(task, user, "Обновил данные задачи");
        auditService.logAction("UPDATE", "Task", task.getId(), "Task details updated");

        if (user.getRole() == Role.CLIENT) {
            notificationService.createNotification(
                user,
                "Успешное редактирование",
                "Вы успешно отредактировали вашу задачу!",
                "/client"
            );

            if (savedTask.getAssignedTo() != null) {
                notificationService.createNotification(
                    savedTask.getAssignedTo(),
                    "Клиент отредактировал задачу",
                    "Клиент " + user.getFullName() + " отредактировал задачу: " + savedTask.getTitle(),
                    "/employee/tasks"
                );
                emailNotificationService.sendTaskEditedByClientEmail(savedTask.getAssignedTo(), savedTask, user);
            }

            notificationService.notifyAdmins(
                "Клиент отредактировал задачу",
                "Клиент " + user.getFullName() + " отредактировал задачу: " + savedTask.getTitle(),
                "/admin/tasks"
            );
        }

        return taskMapper.mapToDto(savedTask);
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto updateTaskStage(Long taskId, Long stageId, String lostReason, User user) {
        Task task = getTaskEntity(taskId);
        Stage newStage = stageRepository.findById(stageId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Stage not found"));

        accessService.assertCanUpdateTaskStage(user, task, newStage);

        if (task.getStage() == null || !task.getStage().getId().equals(stageId)) {
            String oldStage = task.getStage() != null ? task.getStage().getName() : "None";
            logActivity(task, user, "Изменил стадию с " + oldStage + " на " + newStage.getName());
            auditService.logAction("UPDATE_STAGE", "Task", task.getId(), "Stage changed from " + oldStage + " to " + newStage.getName());

            if (user.getRole() == Role.CLIENT) {
                User employee = task.getClient().getAssignedEmployee();
                if (employee != null) {
                    notificationService.createNotification(
                            employee,
                            "Статус задачи изменен",
                            "Клиент " + user.getFullName() + " перевел задачу '" + task.getTitle() + "' в статус " + newStage.getName(),
                            "/employee/tasks"
                    );
                }
                notificationService.notifyAdmins(
                        "Статус задачи изменен",
                        "Клиент " + user.getFullName() + " перевел задачу '" + task.getTitle() + "' в статус " + newStage.getName(),
                        "/admin/tasks"
                );
                
                if (newStage.getType() == StageType.LOST && employee != null) {
                     emailNotificationService.sendTaskStatusUpdatedEmail(employee, task, oldStage, newStage.getName(), lostReason);
                }
            } else {
                notificationService.createNotification(
                        task.getClient(),
                        "Статус задачи изменен",
                        "Статус вашей задачи '" + task.getTitle() + "' изменен на: " + newStage.getName(),
                        "/client"
                );
                
                User employee = task.getAssignedTo();
                if (employee != null && !employee.getId().equals(user.getId())) {
                    notificationService.createNotification(
                        employee,
                        "Статус задачи изменен",
                        "Статус задачи '" + task.getTitle() + "' изменен на: " + newStage.getName(),
                        "/employee/tasks"
                    );
                }

                if (user.getRole() != Role.ADMIN) {
                    notificationService.notifyAdmins(
                        "Статус задачи изменен",
                        user.getFullName() + " перевел задачу '" + task.getTitle() + "' в статус " + newStage.getName(),
                        "/admin/tasks"
                    );
                }

                if (newStage.getType() == StageType.WON) {
                    java.util.List<com.example.zhanfinancebackend.modules.documents.entity.Document> docs = documentRepository.findByTaskIdOrderByCreatedAtDesc(task.getId());
                    emailNotificationService.sendTaskCompletedEmailWithDocuments(task.getClient(), task, docs, storageService);
                } else if (newStage.getType() == StageType.LOST) {
                    emailNotificationService.sendTaskStatusUpdatedEmail(task.getClient(), task, oldStage, newStage.getName(), lostReason);
                }
            }
        }
        
        if (newStage.getType() == StageType.LOST) {
            if (lostReason != null && !lostReason.isBlank()) {
                task.setLostReason(lostReason);
                logActivity(task, user, "Причина отказа: " + lostReason);
            }
        }
        
        if (newStage.getType() == StageType.WON || newStage.getType() == StageType.LOST) {
            task.setClosedAt(java.time.LocalDate.now());
        } else {
            task.setClosedAt(null);
        }
        
        task.setStage(newStage);
        return taskMapper.mapToDto(taskRepository.save(task));
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto archiveTask(Long taskId, User user) {
        Task task = getTaskEntity(taskId);
        // Only allow archive if stage is WON or LOST
        if (task.getStage() == null || (task.getStage().getType() != StageType.WON && task.getStage().getType() != StageType.LOST)) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Можно архивировать только завершенные задачи");
        }
        // Check access
        accessService.assertCanUpdateTaskDetails(user, task);
        
        if (task.isArchived()) {
            return taskMapper.mapToDto(task);
        }
        
        task.setArchived(true);
        logActivity(task, user, "Задача архивирована");
        return taskMapper.mapToDto(taskRepository.save(task));
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto assignTask(Long taskId, Long assigneeId, User user) {
        Task task = getTaskEntity(taskId);
        User assignee = null;
        if (assigneeId != null) {
            assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Assignee not found"));
        }
        Long oldAssigneeId = task.getAssignedTo() != null ? task.getAssignedTo().getId() : null;
        Long newAssigneeId = assignee != null ? assignee.getId() : null;

        if (user.getRole() == Role.EMPLOYEE) {
            if (assigneeId != null && !assigneeId.equals(user.getId())) {
                throw new com.example.zhanfinancebackend.common.exception.ApiException(
                        ErrorCode.FORBIDDEN, "Сотрудники могут назначать задачи только на себя."
                );
            }
        }

        if (!java.util.Objects.equals(oldAssigneeId, newAssigneeId)) {
            String oldAssigneeName = task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : "None";
            String assigneeName = assignee != null ? assignee.getFullName() : "Не назначен";
            logActivity(task, user, "Назначил исполнителя: " + assigneeName);
            auditService.logAction("UPDATE_ASSIGNEE", "Task", task.getId(), "Assignee changed from " + oldAssigneeName + " to " + assigneeName);
        }
        task.setAssignedTo(assignee);

        if (assignee != null && task.getClient() != null) {
            clientService.assignEmployeeToClient(task.getClient().getId(), assignee.getId());
        }

        Task savedTask = taskRepository.save(task);

        if (assignee != null) {
            notificationService.createNotification(
                    assignee,
                    "Новая задача",
                    "Вам назначена задача: " + savedTask.getTitle(),
                    "/employee/tasks"
            );
            emailNotificationService.sendTaskAssignedEmail(assignee, savedTask);
        }

        notificationService.notifyAdmins(
                "Смена исполнителя",
                "Исполнитель задачи '" + task.getTitle() + "' изменен на: " + (assignee != null ? assignee.getFullName() : "Не назначен"),
                "/admin/tasks"
        );

        return taskMapper.mapToDto(savedTask);
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto requestReassignment(Long taskId, User user) {
        Task task = getTaskEntity(taskId);
        if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(user.getId())) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(ErrorCode.FORBIDDEN, "Вы можете отказаться только от своих задач");
        }
        task.setReassignmentRequested(true);
        Task savedTask = taskRepository.save(task);

        logActivity(task, user, "Запросил отказ от задачи");
        notificationService.notifyAdmins(
                "Запрос на отказ от задачи",
                "Сотрудник " + user.getFullName() + " запросил отказ от задачи '" + task.getTitle() + "'",
                "/admin/tasks"
        );
        return taskMapper.mapToDto(savedTask);
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto approveReassignment(Long taskId, User admin) {
        Task task = getTaskEntity(taskId);
        if (admin.getRole() != Role.ADMIN) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(ErrorCode.FORBIDDEN, "Только администратор может подтвердить отказ");
        }
        User oldAssignee = task.getAssignedTo();
        task.setAssignedTo(null);
        task.setReassignmentRequested(false);
        Task savedTask = taskRepository.save(task);

        logActivity(task, admin, "Подтвердил отказ от задачи. Исполнитель снят.");
        if (oldAssignee != null) {
            notificationService.createNotification(
                    oldAssignee,
                    "Отказ подтвержден",
                    "Администратор подтвердил ваш отказ от задачи '" + task.getTitle() + "'",
                    "/employee/tasks"
            );
        }
        return taskMapper.mapToDto(savedTask);
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto rejectReassignment(Long taskId, User admin) {
        Task task = getTaskEntity(taskId);
        if (admin.getRole() != Role.ADMIN) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(ErrorCode.FORBIDDEN, "Только администратор может отклонить отказ");
        }
        task.setReassignmentRequested(false);
        Task savedTask = taskRepository.save(task);

        logActivity(task, admin, "Отклонил запрос на отказ от задачи.");
        if (task.getAssignedTo() != null) {
            notificationService.createNotification(
                    task.getAssignedTo(),
                    "Отказ отклонен",
                    "Администратор отклонил ваш запрос на отказ от задачи '" + task.getTitle() + "'",
                    "/employee/tasks"
            );
        }
        return taskMapper.mapToDto(savedTask);
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public List<TaskDto> batchUpdateTasks(TaskBatchUpdateRequest request, User user) {
        if (request.updates() == null || request.updates().isEmpty()) {
            return List.of();
        }
        
        List<Long> ids = request.updates().stream().map(TaskDto::id).toList();
        List<Task> tasks = taskRepository.findAllByIdInWithDetails(ids);
        java.util.Map<Long, Task> taskMap = tasks.stream().collect(java.util.stream.Collectors.toMap(Task::getId, t -> t));
        
        List<Task> updated = new java.util.ArrayList<>();
        for (TaskDto dto : request.updates()) {
            Task task = taskMap.get(dto.id());
            if (task == null) continue;
            
            accessService.assertCanUpdateTaskDetails(user, task);
            
            if (dto.stage() != null && dto.stage().id() != null) {
                Stage stage = stageRepository.findById(dto.stage().id())
                        .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Stage not found: " + dto.stage().id()));
                
                accessService.assertCanUpdateTaskStage(user, task, stage);
                
                task.setStage(stage);
                if (stage.getType() == StageType.WON || stage.getType() == StageType.LOST) {
                    task.setClosedAt(java.time.LocalDate.now());
                } else {
                    task.setClosedAt(null);
                }
                
                notificationService.createNotification(
                        task.getClient(),
                        "Статус задачи изменен",
                        "Статус вашей задачи '" + task.getTitle() + "' изменен на: " + stage.getName(),
                        "/client"
                );
                
                if (task.getAssignedTo() != null && !task.getAssignedTo().getId().equals(user.getId())) {
                    notificationService.createNotification(
                        task.getAssignedTo(),
                        "Статус задачи изменен",
                        "Статус задачи '" + task.getTitle() + "' изменен на: " + stage.getName(),
                        "/employee/tasks"
                    );
                }

                if (user.getRole() != Role.ADMIN) {
                    notificationService.notifyAdmins(
                        "Обновление задачи",
                        user.getFullName() + " перевел задачу '" + task.getTitle() + "' в статус " + stage.getName(),
                        "/admin/tasks"
                    );
                }

                // Add WON/LOST email notifications for batch updates
                if (stage.getType() == StageType.WON) {
                    java.util.List<com.example.zhanfinancebackend.modules.documents.entity.Document> docs = documentRepository.findByTaskIdOrderByCreatedAtDesc(task.getId());
                    emailNotificationService.sendTaskCompletedEmailWithDocuments(task.getClient(), task, docs, storageService);
                } else if (stage.getType() == StageType.LOST) {
                    emailNotificationService.sendTaskStatusUpdatedEmail(task.getClient(), task, "Неизвестно", stage.getName(), null);
                }
            }
            if (dto.assignedToId() != null) {
                 if (user.getRole() == Role.EMPLOYEE && !dto.assignedToId().equals(user.getId())) {
                     throw new com.example.zhanfinancebackend.common.exception.ApiException(
                             ErrorCode.FORBIDDEN, "Сотрудники могут назначать задачи только на себя."
                     );
                 }
                 User assignee = userRepository.findById(dto.assignedToId())
                    .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Assignee not found"));
                 task.setAssignedTo(assignee);
            }
            updated.add(task);
        }
        
        taskRepository.saveAll(updated);
        return updated.stream().map(taskMapper::mapToDto).toList();
    }

    @Transactional
    public TaskCommentDto addComment(Long taskId, String text, User author) {
        Task task = getTaskEntity(taskId);
        accessService.assertCanReadTask(author, task);
        
        TaskComment comment = new TaskComment(task, author, text);
        task.addComment(comment);
        logActivity(task, author, "Оставил комментарий: " + (text.length() > 30 ? text.substring(0, 30) + "..." : text));

        if (author.getRole() != Role.CLIENT && task.getClient() != null) {
            notificationService.createNotification(
                task.getClient(),
                "Новый комментарий",
                "Новый комментарий к задаче '" + task.getTitle() + "'",
                "/client/tasks"
            );
        } else if (author.getRole() == Role.CLIENT) {
            if (task.getAssignedTo() != null) {
                notificationService.createNotification(
                    task.getAssignedTo(),
                    "Новый комментарий от клиента",
                    "Клиент " + author.getFullName() + " оставил комментарий к задаче '" + task.getTitle() + "'",
                    "/employee/tasks"
                );
            }
            notificationService.notifyAdmins(
                "Новый комментарий от клиента",
                "Клиент " + author.getFullName() + " оставил комментарий к задаче '" + task.getTitle() + "'",
                "/admin/tasks"
            );
        }

        taskRepository.save(task);
        return taskMapper.mapCommentToDto(comment);
    }

    @Transactional(readOnly = true)
    public List<TaskCommentDto> getTaskComments(Long taskId, User user) {
        Task task = getTaskEntity(taskId);
        accessService.assertCanReadTask(user, task);
        return task.getComments().stream().map(taskMapper::mapCommentToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskActivityDto> getTaskHistory(Long taskId, User user) {
        Task task = getTaskEntity(taskId);
        accessService.assertCanReadTask(user, task);
        return task.getHistory().stream()
                .sorted(java.util.Comparator.comparing(TaskActivity::getCreatedAt).reversed())
                .map(taskMapper::mapActivityToDto)
                .toList();
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public void deleteTask(Long taskId, User user) {
        Task task = getTaskEntity(taskId);
        
        accessService.assertCanUpdateTaskDetails(user, task);
        
        java.util.List<com.example.zhanfinancebackend.modules.documents.entity.Document> docs = documentRepository.findByTaskIdOrderByCreatedAtDesc(taskId);
        for (com.example.zhanfinancebackend.modules.documents.entity.Document doc : docs) {
            try {
                if (doc.getStorageKey() != null && !doc.getStorageKey().isBlank()) {
                    storageService.delete(doc.getStorageKey());
                }
            } catch (Exception e) {
                // Ignore if file is already missing
            }
            documentRepository.delete(doc);
        }
        
        auditService.logAction("DELETE", "Task", task.getId(), "Task deleted: " + task.getTitle());
        String taskTitle = task.getTitle();
        
        if (user.getRole() == Role.CLIENT) {
            if (task.getAssignedTo() != null) {
                notificationService.createNotification(
                    task.getAssignedTo(),
                    "Клиент удалил задачу",
                    "Клиент " + user.getFullName() + " удалил задачу: " + taskTitle,
                    "/employee/tasks"
                );
                emailNotificationService.sendTaskDeletedByClientEmail(task.getAssignedTo(), taskTitle, user);
            }

            notificationService.notifyAdmins(
                "Клиент удалил задачу",
                "Клиент " + user.getFullName() + " удалил задачу: " + taskTitle,
                "/admin/tasks"
            );
        }
        
        taskRepository.delete(task);
    }

    private void logActivity(Task task, User actor, String actionText) {
        TaskActivity activity = new TaskActivity(task, actor, actionText);
        task.addActivity(activity);
    }
}
