package com.example.zhanfinancebackend.modules.admin.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.AdminDashboardDto;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeDto;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientRepository;
    private final TaskRepository taskRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.example.zhanfinancebackend.modules.auth.mapper.UserMapper userMapper;

    public AdminService(
            UserRepository userRepository,
            ClientProfileRepository clientRepository,
            TaskRepository taskRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
            com.example.zhanfinancebackend.modules.auth.mapper.UserMapper userMapper
    ) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.taskRepository = taskRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    public List<EmployeeDto> getAllEmployees() {
        return userRepository.findAllByRoleIn(List.of(Role.EMPLOYEE)).stream()
                .map(userMapper::mapToEmployeeDto)
                .toList();
    }

    public List<EmployeeDto> getPendingEmployees() {
        return userRepository.findAllByRoleIn(List.of(Role.EMPLOYEE)).stream()
                .filter(u -> !u.isEnabled())
                .map(userMapper::mapToEmployeeDto)
                .toList();
    }

    public void approveEmployee(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ApiException(
                        com.example.zhanfinancebackend.common.exception.ErrorCode.NOT_FOUND, "User not found"));
        if (user.getRole() != Role.EMPLOYEE && user.getRole() != Role.ADMIN) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(
                    com.example.zhanfinancebackend.common.exception.ErrorCode.BAD_REQUEST,
                    "Only employees can be approved");
        }
        user.setEnabled(true);
        userRepository.save(user);
    }

    public List<EmployeeDto> getAssignedEmployees() {
        return userRepository.findAssignedEmployees().stream()
                .map(userMapper::mapToEmployeeDto)
                .toList();
    }

    public List<EmployeeDto> getUnassignedEmployees() {
        return userRepository.findUnassignedEmployees().stream()
                .map(userMapper::mapToEmployeeDto)
                .toList();
    }

    public List<com.example.zhanfinancebackend.modules.crm.dto.EmployeeWorkloadDto> getEmployeeWorkloads() {
        return userRepository.getEmployeeWorkloads();
    }

    public AdminDashboardDto getAdminDashboard() {
        long clientsCount = userRepository.countByRole(Role.CLIENT);
        long employeesCount = userRepository.countByRole(Role.EMPLOYEE);
        
        // This will be replaced in DashboardService, but since it's duplicated in AdminService...
        // Wait, AdminService also has getAdminDashboard which fetches ALL tasks. I should defer this or redirect to DashboardService.
        // I will change it to return empty or just use DashboardService here later.
        java.util.List<com.example.zhanfinancebackend.modules.crm.entity.Task> allTasks = taskRepository.findAll();
        long tasksCount = allTasks.size();
        
        java.util.Map<String, Long> tasksByStatus = allTasks.stream()
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getStage() != null ? t.getStage().getName() : "Unknown", java.util.stream.Collectors.counting()));
                
        return new AdminDashboardDto(clientsCount, employeesCount, tasksCount, 0L, 0L, 0.0, tasksByStatus, java.util.Collections.emptyMap(), userRepository.count(), 0L, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, java.util.Collections.emptyList());
    }

    public List<com.example.zhanfinancebackend.modules.crm.dto.ClientStatsDto> getClientStats() {
        return taskRepository.getClientStats();
    }

    public List<EmployeeDto> getAllLearners() {
        return userRepository.findAllByRole(Role.LEARNER).stream()
                .map(userMapper::mapToEmployeeDto)
                .toList();
    }

    public void createLearner(com.example.zhanfinancebackend.modules.auth.dto.RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(
                    com.example.zhanfinancebackend.common.exception.ErrorCode.BAD_REQUEST, "Email уже используется");
        }
        User user = new User(
                request.fullName(),
                request.email().toLowerCase(),
                passwordEncoder.encode(request.password()),
                Role.LEARNER
        );
        user.setEnabled(true);
        userRepository.save(user);
    }
}
