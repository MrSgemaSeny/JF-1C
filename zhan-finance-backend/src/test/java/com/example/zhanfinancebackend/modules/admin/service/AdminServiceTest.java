package com.example.zhanfinancebackend.modules.admin.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.modules.auth.entity.RegistrationStatus;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeWorkloadDto;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.auth.mapper.UserMapper;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import com.example.zhanfinancebackend.modules.auth.service.RefreshTokenService;
import com.example.zhanfinancebackend.modules.audit.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminServiceTest {

    private AdminService adminService;
    private UserRepository userRepository;
    private ClientProfileRepository clientRepository;
    private TaskRepository taskRepository;
    private PasswordEncoder passwordEncoder;
    private UserMapper userMapper;
    private EmailNotificationService emailNotificationService;
    private NotificationService notificationService;
    private RefreshTokenService refreshTokenService;
    private AuditService auditService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        clientRepository = mock(ClientProfileRepository.class);
        taskRepository = mock(TaskRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        userMapper = mock(UserMapper.class);
        emailNotificationService = mock(EmailNotificationService.class);
        notificationService = mock(NotificationService.class);
        refreshTokenService = mock(RefreshTokenService.class);
        auditService = mock(AuditService.class);

        adminService = new AdminService(
                userRepository, clientRepository, taskRepository, passwordEncoder,
                userMapper, emailNotificationService, notificationService,
                refreshTokenService, auditService
        );
    }

    @Test
    void testApproveEmployee() {
        User employee = new User();
        employee.setId(1L);
        employee.setRole(Role.EMPLOYEE);
        employee.setEnabled(false);
        employee.setRegistrationStatus(RegistrationStatus.PENDING);

        when(userRepository.findById(1L)).thenReturn(Optional.of(employee));

        adminService.approveEmployee(1L);

        assertTrue(employee.isEnabled());
        assertEquals(RegistrationStatus.APPROVED, employee.getRegistrationStatus());
        verify(userRepository).save(employee);
        verify(emailNotificationService).sendAccountApprovedEmail(employee);
    }

    @Test
    void testApproveEmployee_InvalidRole() {
        User client = new User();
        client.setId(1L);
        client.setRole(Role.CLIENT);

        when(userRepository.findById(1L)).thenReturn(Optional.of(client));

        ApiException exception = assertThrows(ApiException.class, () -> {
            adminService.approveEmployee(1L);
        });

        assertEquals("Only staff accounts can be approved", exception.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void testGetEmployeeWorkloads() {
        EmployeeWorkloadDto dto1 = new EmployeeWorkloadDto(1L, "Employee 1", "emp1@example.com", 5);
        EmployeeWorkloadDto dto2 = new EmployeeWorkloadDto(2L, "Employee 2", "emp2@example.com", 2);

        when(userRepository.getEmployeeWorkloads()).thenReturn(List.of(dto1, dto2));

        List<EmployeeWorkloadDto> result = adminService.getEmployeeWorkloads();
        
        assertEquals(2, result.size());
        assertEquals(5, result.get(0).activeTasksCount());
        verify(userRepository).getEmployeeWorkloads();
    }

    @Test
    void testRejectEmployee() {
        User employee = new User();
        employee.setId(1L);
        employee.setRole(Role.EMPLOYEE);
        employee.setEnabled(false);
        employee.setRegistrationStatus(RegistrationStatus.PENDING);

        when(userRepository.findById(1L)).thenReturn(Optional.of(employee));

        adminService.rejectEmployee(1L);

        assertFalse(employee.isEnabled());
        assertEquals(RegistrationStatus.REJECTED, employee.getRegistrationStatus());
        verify(userRepository).save(employee);
    }
}
