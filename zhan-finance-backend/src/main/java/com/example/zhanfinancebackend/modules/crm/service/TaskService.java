package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.dto.UserDto;
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
import com.example.zhanfinancebackend.modules.crm.entity.Subtask;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
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

    public TaskService(TaskRepository taskRepository, UserRepository userRepository, CrmAccessService accessService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
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

        return mapToDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDto requestTask(TaskRequestCreateRequest request, User client) {
        Task task = new Task(request.title(), client, client);
        task.setDescription(request.description());
        task.setStatus(TaskStatus.NEW);

        return mapToDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDto updateTaskStatus(Long taskId, TaskStatus status) {
        Task task = getTaskEntity(taskId);
        task.setStatus(status);
        return mapToDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDto assignTask(Long taskId, Long assigneeId) {
        Task task = getTaskEntity(taskId);
        User assignee = null;
        if (assigneeId != null) {
            assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Assignee not found"));
        }
        task.setAssignedTo(assignee);
        return mapToDto(taskRepository.save(task));
    }

    @Transactional
    public List<TaskDto> batchUpdateTasks(TaskBatchUpdateRequest request, User user) {
        java.util.List<TaskDto> result = new java.util.ArrayList<>();
        if (request.updates() == null) return result;

        for (TaskDto dto : request.updates()) {
            Task task = getTaskEntity(dto.id());
            accessService.assertCanUpdateTaskStatus(user, task);

            if (dto.status() != null) task.setStatus(dto.status());
            if (dto.priority() != null) task.setPriority(dto.priority());
            task.setDueDate(dto.dueDate());

            if (dto.assignedToId() != null) {
                User assignee = userRepository.findById(dto.assignedToId())
                        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Assignee not found"));
                task.setAssignedTo(assignee);
            } else {
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
                    if (stDto.id() != null) {
                        task.getSubtasks().stream()
                                .filter(st -> st.getId().equals(stDto.id()))
                                .findFirst()
                                .ifPresent(st -> {
                                    st.setTitle(stDto.title());
                                    if (stDto.status() != null) st.setStatus(stDto.status());
                                });
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

            result.add(mapToDto(taskRepository.save(task)));
        }
        return result;
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
                task.getSubtasks() != null ? task.getSubtasks().stream().map(this::mapSubtaskToDto).toList() : List.of()
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
}