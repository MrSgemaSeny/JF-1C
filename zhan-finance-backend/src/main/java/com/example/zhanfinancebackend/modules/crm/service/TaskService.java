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
import com.example.zhanfinancebackend.modules.crm.entity.Subtask;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.TaskComment;
import com.example.zhanfinancebackend.modules.crm.entity.TaskActivity;
import com.example.zhanfinancebackend.modules.crm.entity.TaskPriority;
import com.example.zhanfinancebackend.modules.crm.entity.TaskStatus;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
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

    public TaskService(TaskRepository taskRepository, UserRepository userRepository, CrmAccessService accessService, com.example.zhanfinancebackend.modules.notifications.service.NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getAllTasks() {
        return taskRepository.findAllWithDetails().stream().map(this::mapToDto).toList();
    }

    /**
     * Получить все задачи с опциональной фильтрацией.
     * Используется только администраторами.
     */
    @Transactional(readOnly = true)
    public List<TaskDto> getAllTasks(Long clientId, Long assignedToId, String status) {
        Stream<Task> tasks = taskRepository.findAllWithDetails().stream();

        if (clientId != null) {
            tasks = tasks.filter(t -> t.getClient().getId().equals(clientId));
        }
        if (assignedToId != null) {
            tasks = tasks.filter(t -> t.getAssignedTo() != null && t.getAssignedTo().getId().equals(assignedToId));
        }
        if (status != null && !status.isEmpty()) {
            try {
                TaskStatus ts = TaskStatus.valueOf(status);
                tasks = tasks.filter(t -> t.getStatus() == ts);
            } catch (IllegalArgumentException e) {
                // Игнорируем неправильный статус
            }
        }

        return tasks.map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getTasksForClient(User client) {
        return taskRepository.findAllByClientWithDetails(client.getId()).stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getTasksForEmployee(User employee) {
        return taskRepository.findAllByEmployeeWithDetails(employee).stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public Task getTaskEntity(Long id) {
        return taskRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Task not found"));
    }

    @Transactional(readOnly = true)
    public TaskDto getTask(Long id) {
        return mapToDto(getTaskEntity(id));
    }

    @Transactional
    public TaskDto createTask(TaskCreateRequest request, User creator) {
        User client = userRepository.findById(request.clientId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Client not found"));

        accessService.assertCanCreateTaskFor(creator, client);

        Task task = new Task(request.title(), client, creator);
        task.setDescription(request.description());
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        task.setDueDate(request.dueDate());

        if (request.assignedToId() != null) {
            User assignee = userRepository.findById(request.assignedToId())
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Assignee not found"));
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
        
        Task savedTask = taskRepository.save(task);

        if (creator.getRole() != com.example.zhanfinancebackend.modules.auth.entity.Role.CLIENT && client.getId().equals(savedTask.getClient().getId())) {
            notificationService.createNotification(
                    client,
                    "Новый запрос документов",
                    "Сотрудник запросил у вас документ по задаче: " + savedTask.getTitle(),
                    "/dashboard/client"
            );
        }

        return mapToDto(savedTask);
    }

    @Transactional
    public TaskDto requestTask(TaskRequestCreateRequest request, User client) {
        Task task = new Task(request.title(), client, client);
        task.setDescription(request.description());
        task.setStatus(TaskStatus.NEW);
        task.setDueDate(request.dueDate());

        return mapToDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDto updateTaskStatus(Long taskId, TaskStatus status, User user) {
        Task task = getTaskEntity(taskId);
        if (task.getStatus() != status) {
            logActivity(task, user, "Изменил статус с " + task.getStatus() + " на " + status);
            
            // Notify the other party
            if (user.getRole() == Role.CLIENT) {
                User employee = task.getClient().getAssignedEmployee();
                if (employee != null) {
                    notificationService.createNotification(
                            employee,
                            "Task Status Updated",
                            "Client " + user.getFullName() + " updated task '" + task.getTitle() + "' to " + status,
                            "/employee/tasks/" + task.getId()
                    );
                }
            } else {
                notificationService.createNotification(
                        task.getClient(),
                        "Task Status Updated",
                        "The status of your task '" + task.getTitle() + "' has been updated to: " + status,
                        "/client/documents" // Assuming client sees tasks there for MVP, or a client dashboard
                );
            }
        }
        task.setStatus(status);
        return mapToDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDto assignTask(Long taskId, Long assigneeId, User user) {
        Task task = getTaskEntity(taskId);
        User assignee = null;
        if (assigneeId != null) {
            assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Assignee not found"));
        }
        if (task.getAssignedTo() != assignee) {
            String assigneeName = assignee != null ? assignee.getFullName() : "Не назначен";
            logActivity(task, user, "Назначил исполнителя: " + assigneeName);
        }
        task.setAssignedTo(assignee);
        return mapToDto(taskRepository.save(task));
    }

    @Transactional
    public List<TaskDto> batchUpdateTasks(TaskBatchUpdateRequest request, User user) {
        java.util.List<TaskDto> result = new java.util.ArrayList<>();
        if (request.updates() == null) return result;

        for (TaskDto dto : request.updates()) {
            Task task;
            if (dto.id() != null && dto.id() > 1000000000000L) {
                // Создаем новую задачу, так как ID сгенерирован на фронтенде
                User client = user; // fallback
                if (dto.clientId() != null) {
                    client = userRepository.findById(dto.clientId()).orElse(user);
                }
                task = new Task(dto.title() != null ? dto.title() : "New Task", client, user);
                if (dto.description() != null) task.setDescription(dto.description());
                if (dto.priority() != null) task.setPriority(dto.priority());
                if (dto.status() != null) task.setStatus(dto.status());
                task = taskRepository.save(task);
            } else {
                task = getTaskEntity(dto.id());
                accessService.assertCanUpdateTaskDetails(user, task);
            }

            if (dto.status() != null && dto.status() != task.getStatus()) {
                TaskStatus oldStatus = task.getStatus();
                if (user.getRole() == Role.CLIENT) {
                    if (task.getStatus() == com.example.zhanfinancebackend.modules.crm.entity.TaskStatus.ON_REVIEW && 
                       (dto.status() == com.example.zhanfinancebackend.modules.crm.entity.TaskStatus.DONE || dto.status() == com.example.zhanfinancebackend.modules.crm.entity.TaskStatus.IN_PROGRESS)) {
                        task.setStatus(dto.status());
                    } else if (dto.status() == com.example.zhanfinancebackend.modules.crm.entity.TaskStatus.IN_PROGRESS || 
                               dto.status() == com.example.zhanfinancebackend.modules.crm.entity.TaskStatus.NEW) {
                        task.setStatus(dto.status());
                    }
                } else {
                    accessService.assertCanUpdateTaskStatus(user, task, dto.status());
                    task.setStatus(dto.status());
                }

                // Batch status update notification
                if (task.getStatus() != oldStatus) {
                    if (user.getRole() == Role.CLIENT) {
                        User employee = task.getClient().getAssignedEmployee();
                        if (employee != null) {
                            notificationService.createNotification(employee, "Task Status Updated", 
                                "Client updated task '" + task.getTitle() + "' to " + task.getStatus(), 
                                "/employee/tasks/" + task.getId());
                        }
                    } else {
                        notificationService.createNotification(task.getClient(), "Task Status Updated", 
                            "Your task '" + task.getTitle() + "' was updated to: " + task.getStatus(), 
                            "/client/documents");
                    }
                }
            }

            if (dto.priority() != null) {
                if (user.getRole() == Role.CLIENT && dto.priority() != task.getPriority()) {
                    throw new ApiException(ErrorCode.FORBIDDEN, "Client cannot change task priority");
                }
                task.setPriority(dto.priority());
            }

            if (dto.title() != null) task.setTitle(dto.title());
            task.setDescription(dto.description());
            task.setDueDate(dto.dueDate());

            if (dto.assignedToId() != null) {
                if (user.getRole() == Role.CLIENT && (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(dto.assignedToId()))) {
                    throw new ApiException(ErrorCode.FORBIDDEN, "Client cannot assign tasks");
                }
                User assignee = userRepository.findById(dto.assignedToId())
                        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Assignee not found"));
                task.setAssignedTo(assignee);
            } else if (user.getRole() != Role.CLIENT) {
                task.setAssignedTo(null);
            }

            if (dto.subtasks() != null) {
                List<Long> dtoSubtaskIds = dto.subtasks().stream()
                        .filter(st -> st.id() != null)
                        .map(SubtaskDto::id)
                        .toList();

                // Итератор для безопасного удаления
                var iterator = task.getSubtasks().iterator();
                while (iterator.hasNext()) {
                    Subtask st = iterator.next();
                    if (!dtoSubtaskIds.contains(st.getId())) {
                        iterator.remove();
                        st.setTask(null);
                    }
                }

                for (SubtaskDto stDto : dto.subtasks()) {
                    if (stDto.id() != null && stDto.id() > 0) {
                        Subtask existing = task.getSubtasks().stream()
                                .filter(st -> st.getId().equals(stDto.id()))
                                .findFirst()
                                .orElse(null);
                        if (existing != null) {
                            existing.setTitle(stDto.title());
                            if (stDto.status() != null) existing.setStatus(stDto.status());
                        } else {
                            Subtask newSt = new Subtask(task, stDto.title());
                            if (stDto.status() != null) newSt.setStatus(stDto.status());
                            task.addSubtask(newSt);
                        }
                    } else {
                        Subtask newSt = new Subtask(task, stDto.title());
                        if (stDto.status() != null) newSt.setStatus(stDto.status());
                        task.addSubtask(newSt);
                    }
                }
            } else {
                task.getSubtasks().forEach(st -> st.setTask(null));
                task.getSubtasks().clear();
            }

            if (dto.tags() != null) {
                task.setTags(dto.tags());
            }

            // Логгируем просто факт пакетного обновления (если что-то реально менялось можно добавить сложную логику)
            // Пока оставим без логирования каждой мелкой правки при batch-апдейте, 
            // иначе лог будет заспамлен перетягиванием карточек.

            result.add(mapToDto(taskRepository.save(task)));
        }
        return result;
    }

    @Transactional
    public TaskCommentDto addComment(Long taskId, String text, User author) {
        Task task = getTaskEntity(taskId);
        accessService.assertCanReadTask(author, task);
        
        TaskComment comment = new TaskComment(task, author, text);
        task.addComment(comment);
        logActivity(task, author, "Оставил комментарий: " + (text.length() > 30 ? text.substring(0, 30) + "..." : text));
        
        taskRepository.save(task); // cascading save
        return mapCommentToDto(comment);
    }

    @Transactional(readOnly = true)
    public List<TaskCommentDto> getTaskComments(Long taskId, User user) {
        Task task = getTaskEntity(taskId);
        accessService.assertCanReadTask(user, task);
        return task.getComments().stream().map(this::mapCommentToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskActivityDto> getTaskHistory(Long taskId, User user) {
        Task task = getTaskEntity(taskId);
        accessService.assertCanReadTask(user, task);
        return task.getHistory().stream()
                .sorted(java.util.Comparator.comparing(TaskActivity::getCreatedAt).reversed())
                .map(this::mapActivityToDto)
                .toList();
    }

    @Transactional
    public void deleteTask(Long taskId) {
        Task task = getTaskEntity(taskId);
        taskRepository.delete(task);
    }

    private void logActivity(Task task, User actor, String actionText) {
        TaskActivity activity = new TaskActivity(task, actor, actionText);
        task.addActivity(activity);
    }

    public TaskDto mapToDto(Task task) {
        if (task == null) return null;
        return new TaskDto(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getClient() != null ? task.getClient().getId() : null,
                mapUserToClientInfoDto(task.getClient()),
                task.getAssignedTo() != null ? task.getAssignedTo().getId() : null,
                mapUserToEmployeeInfoDto(task.getAssignedTo()),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                mapUserToDto(task.getCreatedBy()),
                task.getCreatedAt() != null ? task.getCreatedAt().atZone(ZoneOffset.UTC) : null,
                task.getUpdatedAt() != null ? task.getUpdatedAt().atZone(ZoneOffset.UTC) : null,
                task.getSubtasks() != null ? task.getSubtasks().stream().map(this::mapSubtaskToDto).toList() : List.of(),
                task.getTags() != null ? new java.util.ArrayList<>(task.getTags()) : List.of()
        );
    }

    private SubtaskDto mapSubtaskToDto(Subtask subtask) {
        return new SubtaskDto(
                subtask.getId(),
                subtask.getTask().getId(),
                subtask.getTitle(),
                subtask.getStatus(),
                subtask.getCreatedAt() != null ? subtask.getCreatedAt().atZone(ZoneOffset.UTC) : null
        );
    }

    private UserDto mapUserToDto(User user) {
        if (user == null) return null;
        return new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }

    private ClientInfoDto mapUserToClientInfoDto(User user) {
        if (user == null) return null;
        return new ClientInfoDto(user.getId(), user.getFullName(), user.getEmail(), null);
    }

    private EmployeeInfoDto mapUserToEmployeeInfoDto(User user) {
        if (user == null) return null;
        return new EmployeeInfoDto(user.getId(), user.getFullName(), user.getEmail());
    }

    private TaskCommentDto mapCommentToDto(TaskComment comment) {
        return new TaskCommentDto(
                comment.getId(),
                comment.getTask().getId(),
                mapUserToDto(comment.getAuthor()),
                comment.getText(),
                comment.getCreatedAt() != null ? comment.getCreatedAt().atZone(ZoneOffset.UTC) : null
        );
    }

    private TaskActivityDto mapActivityToDto(TaskActivity activity) {
        return new TaskActivityDto(
                activity.getId(),
                activity.getTask().getId(),
                mapUserToDto(activity.getActor()),
                activity.getActionText(),
                activity.getCreatedAt() != null ? activity.getCreatedAt().atZone(ZoneOffset.UTC) : null
        );
    }
}