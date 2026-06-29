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

    public AdminService(
            UserRepository userRepository,
            ClientProfileRepository clientRepository,
            TaskRepository taskRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.taskRepository = taskRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<EmployeeDto> getAllEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE || u.getRole() == Role.ADMIN)
                .map(this::mapToEmployeeDto)
                .toList();
    }

    public List<EmployeeDto> getPendingEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> (u.getRole() == Role.EMPLOYEE || u.getRole() == Role.ADMIN) && !u.isEnabled())
                .map(this::mapToEmployeeDto)
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
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE || u.getRole() == Role.ADMIN)
                .filter(emp -> userRepository.countByAssignedEmployee(emp) > 0)
                .map(this::mapToEmployeeDto)
                .toList();
    }

    public List<EmployeeDto> getUnassignedEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE || u.getRole() == Role.ADMIN)
                .filter(emp -> userRepository.countByAssignedEmployee(emp) == 0)
                .map(this::mapToEmployeeDto)
                .toList();
    }

    public AdminDashboardDto getAdminDashboard() {
        long clientsCount = userRepository.countByRole(Role.CLIENT);
        long employeesCount = userRepository.countByRole(Role.EMPLOYEE);
        
        java.util.List<com.example.zhanfinancebackend.modules.crm.entity.Task> allTasks = taskRepository.findAll();
        long tasksCount = allTasks.size();
        
        java.util.Map<String, Long> tasksByStatus = allTasks.stream()
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getStatus().name(), java.util.stream.Collectors.counting()));
                
        return new AdminDashboardDto(clientsCount, employeesCount, tasksCount, tasksByStatus, userRepository.count(), java.util.Collections.emptyList());
    }

    public List<com.example.zhanfinancebackend.modules.crm.dto.ClientStatsDto> getClientStats() {
        java.util.List<com.example.zhanfinancebackend.modules.crm.entity.Task> allTasks = taskRepository.findAll();
        java.util.Map<Long, Long> counts = allTasks.stream()
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getClient().getId(), java.util.stream.Collectors.counting()));
        
        return counts.entrySet().stream()
                .map(e -> new com.example.zhanfinancebackend.modules.crm.dto.ClientStatsDto(e.getKey(), e.getValue()))
                .toList();
    }

    private EmployeeDto mapToEmployeeDto(User user) {
        return new EmployeeDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.isEnabled(),
                user.getCreatedAt() != null ? user.getCreatedAt().atZone(ZoneOffset.UTC) : null
        );
    }

    public List<EmployeeDto> getAllLearners() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.LEARNER)
                .map(this::mapToEmployeeDto)
                .toList();
    }

    public void createLearner(com.example.zhanfinancebackend.modules.auth.dto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(
                    com.example.zhanfinancebackend.common.exception.ErrorCode.BAD_REQUEST, "Email уже используется");
        }
        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.LEARNER);
        user.setEnabled(true);
        userRepository.save(user);
    }
}
