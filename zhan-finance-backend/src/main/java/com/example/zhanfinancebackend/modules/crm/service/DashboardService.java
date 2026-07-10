package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.AdminDashboardDto;
import com.example.zhanfinancebackend.modules.crm.dto.ClientDashboardDto;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeDashboardDto;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;

    public DashboardService(TaskRepository taskRepository, UserRepository userRepository, ClientProfileRepository clientProfileRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.clientProfileRepository = clientProfileRepository;
    }

    @Cacheable(value = "dashboard_admin")
    @Transactional(readOnly = true)
    public AdminDashboardDto getAdminDashboard() {
        long clientsCount = userRepository.countByRole(Role.CLIENT);
        long employeesCount = userRepository.countByRole(Role.EMPLOYEE);
        
        List<Task> allTasks = taskRepository.findAllWithDetails();
        long tasksCount = allTasks.size();
        
        Map<String, Long> tasksByStatus = allTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStage() != null ? t.getStage().getName() : "Unknown", Collectors.counting()));
                
        List<User> employees = userRepository.findAllByRole(Role.EMPLOYEE);
        java.time.LocalDate today = java.time.LocalDate.now();
        
        List<com.example.zhanfinancebackend.modules.crm.dto.EmployeeStatsDto> employeeStats = employees.stream().map(emp -> {
            long active = 0;
            long done = 0;
            long overdue = 0;
            
            for (Task t : allTasks) {
                boolean isAssignedToEmp = (t.getAssignedTo() != null && t.getAssignedTo().getId().equals(emp.getId())) ||
                                          (t.getAssignedTo() == null && t.getClient() != null && t.getClient().getAssignedEmployee() != null && t.getClient().getAssignedEmployee().getId().equals(emp.getId()));
                
                if (isAssignedToEmp) {
                    if (t.getStage() != null && t.getStage().getType() == com.example.zhanfinancebackend.modules.crm.entity.StageType.WON) {
                        done++;
                    } else if (t.getStage() != null && t.getStage().getType() == com.example.zhanfinancebackend.modules.crm.entity.StageType.LOST) {
                        // ignore cancelled
                    } else {
                        active++;
                        if (t.getDueDate() != null && t.getDueDate().isBefore(today)) {
                            overdue++;
                        }
                    }
                }
            }
            
            return new com.example.zhanfinancebackend.modules.crm.dto.EmployeeStatsDto(
                    emp.getId(),
                    emp.getFullName() != null && !emp.getFullName().isBlank() ? emp.getFullName() : emp.getEmail(),
                    active,
                    done,
                    overdue
            );
        }).collect(Collectors.toList());
                
        return new AdminDashboardDto(clientsCount, employeesCount, tasksCount, tasksByStatus, userRepository.count(), employeeStats);
    }

    @Cacheable(value = "dashboard_employee", key = "#employee.id")
    @Transactional(readOnly = true)
    public EmployeeDashboardDto getEmployeeDashboard(User employee) {
        long clientsCount = userRepository.countByAssignedEmployee(employee);
        
        // Employee tasks are tasks of their clients or tasks assigned to them
        List<Task> employeeTasks = taskRepository.findAllByEmployeeWithDetails(employee);
        long tasksCount = employeeTasks.size();
        
        Map<String, Long> tasksByStatus = employeeTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStage() != null ? t.getStage().getName() : "Unknown", Collectors.counting()));
                
        return new EmployeeDashboardDto(clientsCount, tasksCount, tasksByStatus);
    }

    @Cacheable(value = "dashboard_client", key = "#client.id")
    @Transactional(readOnly = true)
    public ClientDashboardDto getClientDashboard(User client) {
        List<Task> clientTasks = taskRepository.findAllByClientWithDetails(client.getId());
        long tasksCount = clientTasks.size();
        
        Map<String, Long> tasksByStatus = clientTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStage() != null ? t.getStage().getName() : "Unknown", Collectors.counting()));
                
        return new ClientDashboardDto(tasksCount, tasksByStatus);
    }
}
