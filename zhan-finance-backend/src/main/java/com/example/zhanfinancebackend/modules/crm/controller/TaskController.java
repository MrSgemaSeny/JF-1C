package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.TaskCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.dto.TaskRequestCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.TaskStatusUpdateRequest;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.service.CrmAccessService;
import com.example.zhanfinancebackend.modules.crm.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crm/tasks")
public class TaskController {

    private final TaskService taskService;
    private final CrmAccessService accessService;

    public TaskController(TaskService taskService, CrmAccessService accessService) {
        this.taskService = taskService;
        this.accessService = accessService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<List<TaskDto>> getTasks(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        if (user.getRole() == Role.ADMIN) {
            return ApiResponse.success(taskService.getAllTasks());
        }
        if (user.getRole() == Role.EMPLOYEE) {
            return ApiResponse.success(taskService.getTasksForEmployee(user));
        }
        return ApiResponse.success(taskService.getTasksForClient(user));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<TaskDto> getTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        Task task = taskService.getTaskEntity(id);
        accessService.assertCanReadTask(principal.getUser(), task);
        return ApiResponse.success(taskService.mapToDto(task));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<TaskDto> createTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskCreateRequest request
    ) {
        TaskDto taskDto = taskService.createTask(request, principal.getUser());
        return ApiResponse.success(taskDto);
    }

    @PostMapping("/request")
    @PreAuthorize("hasRole('CLIENT')")
    public ApiResponse<TaskDto> requestTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskRequestCreateRequest request
    ) {
        return ApiResponse.success(taskService.requestTask(request, principal.getUser()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<TaskDto> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request
    ) {
        Task task = taskService.getTaskEntity(id);
        accessService.assertCanUpdateTaskStatus(principal.getUser(), task);
        return ApiResponse.success(taskService.updateTaskStatus(id, request.status()));
    }
    
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<TaskDto> assignTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false) Long assigneeId
    ) {
        accessService.assertCanAssignTask(principal.getUser());
        return ApiResponse.success(taskService.assignTask(id, assigneeId));
    }
}
