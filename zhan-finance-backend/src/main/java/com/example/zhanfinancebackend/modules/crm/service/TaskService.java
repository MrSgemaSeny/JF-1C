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
            com.example.zhanfinancebackend.modules.crm.mapper.TaskMapper taskMapper
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

        if (creator.getRole() != com.example.zhanfinancebackend.modules.auth.entity.Role.CLIENT && client.getId().equals(savedTask.getClient().getId())) {
            notificationService.createNotification(
                    client,
                    "Новый запрос документов",
                    "Сотрудник запросил у вас документ по задаче: " + savedTask.getTitle(),
                    "/dashboard/client"
            );
        }

        if (savedTask.getAssignedTo() != null) {
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

        User employee = managedClient.getAssignedEmployee();
        if (employee != null) {
            emailNotificationService.sendTaskAssignedEmail(employee, savedTask);
        }

        return taskMapper.mapToDto(savedTask);
    }

    @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
    @Transactional
    public TaskDto updateTaskStage(Long taskId, Long stageId, User user) {
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
                            "Task Stage Updated",
                            "Client " + user.getFullName() + " updated task '" + task.getTitle() + "' to " + newStage.getName(),
                            "/employee/tasks/" + task.getId()
                    );
                    emailNotificationService.sendTaskStatusUpdatedEmail(employee, task, oldStage, newStage.getName());
                }
            } else {
                notificationService.createNotification(
                        task.getClient(),
                        "Task Stage Updated",
                        "The stage of your task '" + task.getTitle() + "' has been updated to: " + newStage.getName(),
                        "/client/documents"
                );
                emailNotificationService.sendTaskStatusUpdatedEmail(task.getClient(), task, oldStage, newStage.getName());
            }
        }
        task.setStage(newStage);
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
        if (task.getAssignedTo() != assignee) {
            String oldAssigneeName = task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : "None";
            String assigneeName = assignee != null ? assignee.getFullName() : "Не назначен";
            logActivity(task, user, "Назначил исполнителя: " + assigneeName);
            auditService.logAction("UPDATE_ASSIGNEE", "Task", task.getId(), "Assignee changed from " + oldAssigneeName + " to " + assigneeName);
        }
        task.setAssignedTo(assignee);
        Task savedTask = taskRepository.save(task);

        if (assignee != null) {
            emailNotificationService.sendTaskAssignedEmail(assignee, savedTask);
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
            }
            if (dto.assignedToId() != null) {
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
    public void deleteTask(Long taskId) {
        Task task = getTaskEntity(taskId);
        auditService.logAction("DELETE", "Task", task.getId(), "Task deleted: " + task.getTitle());
        taskRepository.delete(task);
    }

    private void logActivity(Task task, User actor, String actionText) {
        TaskActivity activity = new TaskActivity(task, actor, actionText);
        task.addActivity(activity);
    }
}
