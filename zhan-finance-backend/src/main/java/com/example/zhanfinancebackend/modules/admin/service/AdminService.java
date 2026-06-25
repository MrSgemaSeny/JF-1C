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

    public AdminService(
            UserRepository userRepository,
            ClientProfileRepository clientRepository,
            TaskRepository taskRepository
    ) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.taskRepository = taskRepository;
    }

    public List<EmployeeDto> getAllEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .map(this::mapToEmployeeDto)
                .toList();
    }

    public List<EmployeeDto> getPendingEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE && !u.isEnabled())
                .map(this::mapToEmployeeDto)
                .toList();
    }

    public void approveEmployee(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(true);
        userRepository.save(user);
    }

    public List<EmployeeDto> getAssignedEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .filter(emp -> userRepository.countByAssignedEmployee(emp) > 0)
                .map(this::mapToEmployeeDto)
                .toList();
    }

    public List<EmployeeDto> getUnassignedEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
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
                
        return new AdminDashboardDto(clientsCount, employeesCount, tasksCount, tasksByStatus, userRepository.count());
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
}
