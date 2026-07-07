package com.example.zhanfinancebackend.modules.services.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.dto.TaskRequestCreateRequest;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.crm.service.TaskService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import com.example.zhanfinancebackend.modules.services.dto.ServiceRequestCreateRequest;
import com.example.zhanfinancebackend.modules.services.dto.ServiceRequestDto;
import com.example.zhanfinancebackend.modules.services.entity.ServiceEntity;
import com.example.zhanfinancebackend.modules.services.entity.ServiceRequest;
import com.example.zhanfinancebackend.modules.services.repository.ServiceRepository;
import com.example.zhanfinancebackend.modules.services.repository.ServiceRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceRequestServiceTest {

    @Mock
    private ServiceRequestRepository serviceRequestRepository;
    @Mock
    private ServiceRepository serviceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TaskService taskService;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService emailNotificationService;

    @InjectMocks
    private ServiceRequestService serviceRequestService;

    private User client;
    private User employee;
    private ServiceEntity serviceEntity;

    @BeforeEach
    void setUp() {
        client = new User("Client Test", "client@test.com", "hash", Role.CLIENT);
        org.springframework.test.util.ReflectionTestUtils.setField(client, "id", 1L);

        employee = new User("Employee Test", "emp@test.com", "hash", Role.EMPLOYEE);
        org.springframework.test.util.ReflectionTestUtils.setField(employee, "id", 2L);

        serviceEntity = new ServiceEntity("Test Service", "Description");
        org.springframework.test.util.ReflectionTestUtils.setField(serviceEntity, "id", 10L);
        serviceEntity.setIsActive(true);
    }

    @Test
    void createRequest_Success_WithAssignedEmployee() {
        // Arrange
        client.setAssignedEmployee(employee);
        ServiceRequestCreateRequest req = new ServiceRequestCreateRequest(10L, "Hello", LocalDate.now());

        when(serviceRepository.findById(10L)).thenReturn(Optional.of(serviceEntity));
        when(serviceRequestRepository.save(any(ServiceRequest.class))).thenAnswer(i -> {
            ServiceRequest sr = i.getArgument(0);
            org.springframework.test.util.ReflectionTestUtils.setField(sr, "id", 100L);
            return sr;
        });

        TaskDto taskDto = new TaskDto(500L, "Запрос на услугу: Test Service", "desc", 1L, null, null, null, null, null, null, null, null, null, null, null);
        when(taskService.requestTask(any(TaskRequestCreateRequest.class), eq(client))).thenReturn(taskDto);

        Task linkedTask = new Task("Запрос на услугу: Test Service", client, client);
        org.springframework.test.util.ReflectionTestUtils.setField(linkedTask, "id", 500L);
        when(taskRepository.findById(500L)).thenReturn(Optional.of(linkedTask));

        // Act
        ServiceRequestDto result = serviceRequestService.createRequest(req, client);

        // Assert
        assertNotNull(result);
        assertEquals(100L, result.id());
        assertEquals("Test Service", result.serviceTitle());
        assertEquals(2L, result.assignedEmployeeId());
        
        verify(userRepository, never()).findLeastLoadedEmployee();
        verify(notificationService).createNotification(eq(client), anyString(), anyString(), anyString());
    }

    @Test
    void createRequest_Success_WithLoadBalancer() {
        // Arrange
        client.setAssignedEmployee(null); // No assigned employee
        ServiceRequestCreateRequest req = new ServiceRequestCreateRequest(10L, "Hello", LocalDate.now());

        when(serviceRepository.findById(10L)).thenReturn(Optional.of(serviceEntity));
        when(userRepository.findLeastLoadedEmployee()).thenReturn(Optional.of(employee));
        when(serviceRequestRepository.save(any(ServiceRequest.class))).thenAnswer(i -> {
            ServiceRequest sr = i.getArgument(0);
            org.springframework.test.util.ReflectionTestUtils.setField(sr, "id", 100L);
            return sr;
        });

        TaskDto taskDto = new TaskDto(500L, "Title", "desc", 1L, null, null, null, null, null, null, null, null, null, null, null);
        when(taskService.requestTask(any(TaskRequestCreateRequest.class), eq(client))).thenReturn(taskDto);

        Task linkedTask = new Task("Title", client, client);
        org.springframework.test.util.ReflectionTestUtils.setField(linkedTask, "id", 500L);
        when(taskRepository.findById(500L)).thenReturn(Optional.of(linkedTask));

        // Act
        ServiceRequestDto result = serviceRequestService.createRequest(req, client);

        // Assert
        assertNotNull(result);
        assertEquals(2L, result.assignedEmployeeId());
        
        verify(userRepository).findLeastLoadedEmployee();
        verify(taskRepository).save(linkedTask); // Should reassign task to the employee
        assertEquals(employee, linkedTask.getAssignedTo());
        verify(emailNotificationService).sendTaskAssignedEmail(employee, linkedTask);
    }

    @Test
    void createRequest_ThrowsException_IfServiceNotFound() {
        ServiceRequestCreateRequest req = new ServiceRequestCreateRequest(99L, "Hello", null);
        when(serviceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> serviceRequestService.createRequest(req, client));
    }

    @Test
    void getRequestByTaskId_Success() {
        ServiceRequest sr = new ServiceRequest(client, serviceEntity, "Test Service");
        org.springframework.test.util.ReflectionTestUtils.setField(sr, "id", 100L);
        Task linkedTask = new Task("Task Title", client, employee);
        org.springframework.test.util.ReflectionTestUtils.setField(linkedTask, "id", 50L);
        sr.setLinkedTask(linkedTask);

        when(serviceRequestRepository.findByLinkedTaskId(50L)).thenReturn(Optional.of(sr));

        ServiceRequestDto dto = serviceRequestService.getRequestByTaskId(50L);

        assertNotNull(dto);
        assertEquals(100L, dto.id());
        assertEquals(50L, dto.taskId());
        assertEquals("Test Service", dto.serviceTitle());
    }

    @Test
    void getRequestByTaskId_NotFound() {
        when(serviceRequestRepository.findByLinkedTaskId(99L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> serviceRequestService.getRequestByTaskId(99L));
        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
    }
}
