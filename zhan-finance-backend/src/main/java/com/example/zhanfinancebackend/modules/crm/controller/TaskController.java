package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.TaskCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.dto.TaskRequestCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.TaskStageUpdateRequest;
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
    private final com.example.zhanfinancebackend.modules.crm.mapper.TaskMapper taskMapper;
    private final com.example.zhanfinancebackend.modules.documents.service.DocumentGeneratorService documentGeneratorService;

    public TaskController(TaskService taskService, CrmAccessService accessService, com.example.zhanfinancebackend.modules.crm.mapper.TaskMapper taskMapper, com.example.zhanfinancebackend.modules.documents.service.DocumentGeneratorService documentGeneratorService) {
        this.taskService = taskService;
        this.accessService = accessService;
        this.taskMapper = taskMapper;
        this.documentGeneratorService = documentGeneratorService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<List<TaskDto>> getTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long stageId,
            @RequestParam(required = false) Boolean unassigned
    ) {
        User user = principal.getUser();

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.EMPLOYEE) {
            // Админ и сотрудник видят все задачи, с опциональными фильтрами
            return ApiResponse.success(taskService.getAllTasks(clientId, assignedToId, stageId, unassigned));
        }

        // Клиент видит только свои задачи (clientId берется из текущего юзера)
        return ApiResponse.success(taskService.getTasksForClient(user));
    }

    @GetMapping("/archived")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<List<TaskDto>> getArchivedTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam com.example.zhanfinancebackend.modules.crm.entity.StageType stageType
    ) {
        return ApiResponse.success(taskService.getArchivedTasks(stageType));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ApiResponse<TaskDto> getTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        Task task = taskService.getTaskEntity(id);
        accessService.assertCanReadTask(principal.getUser(), task);
        return ApiResponse.success(taskMapper.mapToDto(task));
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

    @PatchMapping("/{id}/stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<TaskDto> updateStage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody TaskStageUpdateRequest request
    ) {
        return ApiResponse.success(taskService.updateTaskStage(id, request.stageId(), request.lostReason(), principal.getUser()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<TaskDto> updateTaskDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody com.example.zhanfinancebackend.modules.crm.dto.TaskUpdateRequest request
    ) {
        return ApiResponse.success(taskService.updateTaskDetails(id, request, principal.getUser()));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TaskDto> archiveTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ApiResponse.success(taskService.archiveTask(id, principal.getUser()));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<TaskDto> assignTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false) Long assigneeId
    ) {
        Task task = taskService.getTaskEntity(id);
        accessService.assertCanAssignTask(principal.getUser(), task);
        return ApiResponse.success(taskService.assignTask(id, assigneeId, principal.getUser()));
    }

    @PutMapping("/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<List<TaskDto>> batchUpdateTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody com.example.zhanfinancebackend.modules.crm.dto.TaskBatchUpdateRequest request
    ) {
        return ApiResponse.success(taskService.batchUpdateTasks(request, principal.getUser()));
    }

    @GetMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<List<com.example.zhanfinancebackend.modules.crm.dto.TaskCommentDto>> getTaskComments(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ApiResponse.success(taskService.getTaskComments(id, principal.getUser()));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<com.example.zhanfinancebackend.modules.crm.dto.TaskCommentDto> addComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body
    ) {
        String text = body.get("text");
        if (text == null || text.trim().isEmpty()) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(
                    com.example.zhanfinancebackend.common.exception.ErrorCode.BAD_REQUEST, 
                    "Текст комментария не может быть пустым"
            );
        }
        return ApiResponse.success(taskService.addComment(id, text, principal.getUser()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        taskService.deleteTask(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<List<com.example.zhanfinancebackend.modules.crm.dto.TaskActivityDto>> getTaskHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ApiResponse.success(taskService.getTaskHistory(id, principal.getUser()));
    }

    @PostMapping("/{id}/documents/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<com.example.zhanfinancebackend.modules.documents.dto.DocumentDto> generateDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body
    ) {
        String templateIdStr = body.get("templateId");
        if (templateIdStr == null || templateIdStr.isBlank()) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(
                    com.example.zhanfinancebackend.common.exception.ErrorCode.BAD_REQUEST,
                    "templateId is required"
            );
        }
        java.util.UUID templateId = java.util.UUID.fromString(templateIdStr);
        return ApiResponse.success(documentGeneratorService.generateFromTemplate(id, templateId, principal.getUser()));
    }

    @PostMapping("/{id}/reassign/request")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<TaskDto> requestReassignment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ApiResponse.success(taskService.requestReassignment(id, principal.getUser()));
    }

    @PostMapping("/{id}/reassign/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TaskDto> approveReassignment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ApiResponse.success(taskService.approveReassignment(id, principal.getUser()));
    }

    @PostMapping("/{id}/reassign/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TaskDto> rejectReassignment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ApiResponse.success(taskService.rejectReassignment(id, principal.getUser()));
    }
}