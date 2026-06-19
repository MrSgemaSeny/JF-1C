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

    @Transactional(readOnly = true)
    public AdminDashboardDto getAdminDashboard() {
        long clientsCount = userRepository.countByRole(Role.CLIENT);
        long employeesCount = userRepository.countByRole(Role.EMPLOYEE);
        
        List<Task> allTasks = taskRepository.findAll();
        long tasksCount = allTasks.size();
        
        Map<String, Long> tasksByStatus = allTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));
                
        return new AdminDashboardDto(clientsCount, employeesCount, tasksCount, tasksByStatus);
    }

    @Transactional(readOnly = true)
    public EmployeeDashboardDto getEmployeeDashboard(User employee) {
        long clientsCount = userRepository.countByAssignedEmployee(employee);
        
        // Employee tasks are tasks of their clients or tasks assigned to them
        List<Task> employeeTasks = taskRepository.findAllByEmployeeWithDetails(employee);
        long tasksCount = employeeTasks.size();
        
        Map<String, Long> tasksByStatus = employeeTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));
                
        return new EmployeeDashboardDto(clientsCount, tasksCount, tasksByStatus);
    }

    @Transactional(readOnly = true)
    public ClientDashboardDto getClientDashboard(User client) {
        List<Task> clientTasks = taskRepository.findAllByClientWithDetails(client);
        long tasksCount = clientTasks.size();
        
        Map<String, Long> tasksByStatus = clientTasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));
                
        return new ClientDashboardDto(tasksCount, tasksByStatus);
    }
}
