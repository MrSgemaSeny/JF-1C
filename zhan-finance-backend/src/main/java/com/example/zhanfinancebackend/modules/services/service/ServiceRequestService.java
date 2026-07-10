package com.example.zhanfinancebackend.modules.services.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.TaskRequestCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.crm.service.TaskService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import com.example.zhanfinancebackend.modules.services.dto.ServiceRequestCreateRequest;
import com.example.zhanfinancebackend.modules.services.dto.ServiceRequestDto;
import com.example.zhanfinancebackend.modules.services.entity.ServiceEntity;
import com.example.zhanfinancebackend.modules.services.entity.ServiceRequest;
import com.example.zhanfinancebackend.modules.services.entity.ServiceRequestStatus;
import com.example.zhanfinancebackend.modules.services.repository.ServiceRepository;
import com.example.zhanfinancebackend.modules.services.repository.ServiceRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.List;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;
    private final com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService emailNotificationService;

    public ServiceRequestService(
            ServiceRequestRepository serviceRequestRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository,
            TaskService taskService,
            TaskRepository taskRepository,
            NotificationService notificationService,
            com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService emailNotificationService
    ) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
        this.taskService = taskService;
        this.taskRepository = taskRepository;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public ServiceRequestDto createRequest(ServiceRequestCreateRequest request, User client) {
        // 1. Найти услугу
        ServiceEntity service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Услуга не найдена"));

        if (!service.getIsActive()) {
            throw new com.example.zhanfinancebackend.common.exception.BadRequestException("Услуга временно недоступна");
        }

        // 2. Определить ответственного сотрудника (балансировщик)
        User assignedEmp = client.getAssignedEmployee();
        if (assignedEmp == null) {
            assignedEmp = userRepository.findLeastLoadedEmployee()
                    .orElseThrow(() -> new RuntimeException("Нет доступных сотрудников для обработки запроса"));
        }

        // 3. Создать запрос на услугу
        ServiceRequest serviceRequest = new ServiceRequest(client, service, service.getTitle());
        serviceRequest.setClientMessage(request.message());
        serviceRequest.setPreferredContactDate(request.preferredContactDate());
        serviceRequest.setAssignedEmployee(assignedEmp);
        serviceRequest = serviceRequestRepository.save(serviceRequest);

        // 4. Автоматически создать Task через существующий TaskService
        String taskTitle = "Запрос на услугу: " + service.getTitle();
        String taskDescription = buildTaskDescription(client, service, request.message(), request.preferredContactDate());

        // Поскольку TaskService.requestTask ставит assignedTo = client.getAssignedEmployee(), 
        // нам нужно убедиться, что у клиента временно есть assignedEmployee, или использовать createTask
        // Но requestTask удобен тем, что он делает рассылку. Мы просто обновим Task потом, если нужно.
        // Чтобы быть точными, мы создадим Task "чисто" или обновим его assignee после создания:
        
        TaskRequestCreateRequest taskRequest = new TaskRequestCreateRequest(
                taskTitle,
                taskDescription,
                null, // clientId
                null, // dueDate
                null, // subtasks
                null  // serviceIds
        );
        TaskDto taskDto = taskService.requestTask(taskRequest, client);

        Task linkedTask = taskRepository.findById(taskDto.id()).orElse(null);
        if (linkedTask != null) {
            linkedTask.setAssignedTo(assignedEmp); // Переназначаем на выбранного балансировщиком сотрудника
            taskRepository.save(linkedTask);
            
            serviceRequest.setLinkedTask(linkedTask);
            serviceRequest = serviceRequestRepository.save(serviceRequest);

            if (client.getAssignedEmployee() == null) {
                emailNotificationService.sendTaskAssignedEmail(assignedEmp, linkedTask);
            }
        }

        // 5. Отправить уведомление клиенту
        notificationService.createNotification(
                client,
                "Запрос на услугу принят",
                "Ваш запрос на услугу «" + service.getTitle() + "» принят. Мы свяжемся с вами в ближайшее время.",
                "/client"
        );

        return mapToDto(serviceRequest);
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestDto> getClientRequests(Long clientId) {
        return serviceRequestRepository.findByClientIdOrderByCreatedAtDesc(clientId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestDto> getAllRequests() {
        return serviceRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceRequestDto getRequestByTaskId(Long taskId) {
        return serviceRequestRepository.findByLinkedTaskId(taskId)
                .map(this::mapToDto)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Service request not found for task ID: " + taskId));
    }

    private String buildTaskDescription(User client, ServiceEntity service, String message, java.time.LocalDate preferredContactDate) {
        StringBuilder sb = new StringBuilder();
        sb.append("Клиент: ").append(client.getFullName()).append("\n");
        sb.append("Email: ").append(client.getEmail()).append("\n");
        sb.append("Услуга: ").append(service.getTitle()).append("\n");
        if (preferredContactDate != null) {
            sb.append("Желаемая дата связи: ").append(preferredContactDate).append("\n");
        }
        if (message != null && !message.isBlank()) {
            sb.append("\nСообщение клиента:\n").append(message);
        }
        return sb.toString();
    }

    private ServiceRequestDto mapToDto(ServiceRequest sr) {
        return new ServiceRequestDto(
                sr.getId(),
                sr.getService() != null ? sr.getService().getId() : null,
                sr.getServiceTitle(),
                sr.getClientMessage(),
                sr.getPreferredContactDate(),
                sr.getStatus().name(),
                sr.getAssignedEmployee() != null ? sr.getAssignedEmployee().getId() : null,
                sr.getLinkedTask() != null ? sr.getLinkedTask().getId() : null,
                sr.getCreatedAt() != null ? sr.getCreatedAt().atZone(ZoneOffset.UTC) : null
        );
    }
}

