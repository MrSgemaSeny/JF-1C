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

import java.time.LocalDate;

@Service
public class DashboardService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final com.example.zhanfinancebackend.modules.landing.repository.ContactRequestRepository contactRequestRepository;

    public DashboardService(TaskRepository taskRepository, UserRepository userRepository, ClientProfileRepository clientProfileRepository, com.example.zhanfinancebackend.modules.landing.repository.ContactRequestRepository contactRequestRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.clientProfileRepository = clientProfileRepository;
        this.contactRequestRepository = contactRequestRepository;
    }

    @Cacheable(value = "dashboard_admin")
    @Transactional(readOnly = true)
    public AdminDashboardDto getAdminDashboard() {
        long clientsCount = userRepository.countByRole(Role.CLIENT);
        long employeesCount = userRepository.countByRole(Role.EMPLOYEE);
        
        long tasksCount = taskRepository.count();
        long wonTasks = taskRepository.countTasksByStageType(com.example.zhanfinancebackend.modules.crm.entity.StageType.WON);
        long lostTasks = taskRepository.countTasksByStageType(com.example.zhanfinancebackend.modules.crm.entity.StageType.LOST);
        
        long newRequestsToday = contactRequestRepository.countByCreatedAtAfter(LocalDate.now().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
        java.math.BigDecimal totalRevenue = taskRepository.sumWonAmount();
        if (totalRevenue == null) totalRevenue = java.math.BigDecimal.ZERO;
        java.math.BigDecimal expectedRevenue = taskRepository.sumExpectedAmount();
        if (expectedRevenue == null) expectedRevenue = java.math.BigDecimal.ZERO;
        
        Double avgCompletionDaysRaw = taskRepository.getAverageCompletionDays();
        double avgCompletionDays = avgCompletionDaysRaw != null ? avgCompletionDaysRaw : 0.0;
        
        List<Map<String, Object>> statusList = taskRepository.countTasksByStatus();
        Map<String, Long> tasksByStatus = statusList.stream()
            .collect(Collectors.toMap(
                m -> m.get("statusName") != null ? m.get("statusName").toString() : "Unknown",
                m -> ((Number) m.get("count")).longValue()
            ));

        List<Map<String, Object>> reasonList = taskRepository.countTasksByLostReason();
        Map<String, Long> tasksByLostReason = reasonList.stream()
            .collect(Collectors.toMap(
                m -> m.get("reason").toString(),
                m -> ((Number) m.get("count")).longValue()
            ));
            
        List<User> employees = userRepository.findAllByRole(Role.EMPLOYEE);
        List<Map<String, Object>> empStatsRaw = taskRepository.getEmployeeTaskStats();
        List<Map<String, Object>> avgDaysPerEmpList = taskRepository.getAverageCompletionDaysPerEmployee();
        Map<Long, Double> empAvgDaysMap = new java.util.HashMap<>();
        for (Map<String, Object> row : avgDaysPerEmpList) {
            Number empIdNum = getNumberIgnoreCase(row, "empId");
            Number avgNum = getNumberIgnoreCase(row, "avgDays");
            if (empIdNum != null && avgNum != null) {
                empAvgDaysMap.put(empIdNum.longValue(), Math.round(avgNum.doubleValue() * 10.0) / 10.0);
            }
        }

        Map<Long, com.example.zhanfinancebackend.modules.crm.dto.EmployeeStatsDto> empStatsMap = new java.util.HashMap<>();
        for (User emp : employees) {
            double empAvg = empAvgDaysMap.getOrDefault(emp.getId(), 0.0);
            empStatsMap.put(emp.getId(), new com.example.zhanfinancebackend.modules.crm.dto.EmployeeStatsDto(
                    emp.getId(),
                    emp.getFullName() != null && !emp.getFullName().isBlank() ? emp.getFullName() : emp.getEmail(),
                    0, 0, 0, empAvg
            ));
        }

        for (Map<String, Object> row : empStatsRaw) {
            Number empIdNum = getNumberIgnoreCase(row, "empid");
            if (empIdNum == null) continue;
            Long empId = empIdNum.longValue();

            Object stageObj = getObjectIgnoreCase(row, "stagetype");
            String stageTypeStr = stageObj != null ? stageObj.toString() : null;

            Number countNum = getNumberIgnoreCase(row, "taskcount");
            long count = countNum != null ? countNum.longValue() : 0;

            Number overdueNum = getNumberIgnoreCase(row, "overduecount");
            long overdue = overdueNum != null ? overdueNum.longValue() : 0;

            com.example.zhanfinancebackend.modules.crm.dto.EmployeeStatsDto dto = empStatsMap.get(empId);
            if (dto != null) {
                long newDone = dto.doneTasks();
                long newActive = dto.activeTasks();
                long newOverdue = dto.overdueTasks() + overdue;

                if ("WON".equals(stageTypeStr)) {
                    newDone += count;
                } else if (!"LOST".equals(stageTypeStr)) {
                    newActive += count;
                }

                empStatsMap.put(empId, new com.example.zhanfinancebackend.modules.crm.dto.EmployeeStatsDto(
                        dto.employeeId(), dto.employeeName(), newActive, newDone, newOverdue, dto.avgCompletionDays()
                ));
            }
        }

        return new AdminDashboardDto(clientsCount, employeesCount, tasksCount, wonTasks, lostTasks, avgCompletionDays, tasksByStatus, tasksByLostReason, userRepository.count(), newRequestsToday, totalRevenue, expectedRevenue, new java.util.ArrayList<>(empStatsMap.values()));
    }

    private Number getNumberIgnoreCase(Map<String, Object> map, String key) {
        Object obj = getObjectIgnoreCase(map, key);
        return obj instanceof Number ? (Number) obj : null;
    }

    private Object getObjectIgnoreCase(Map<String, Object> map, String key) {
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(key)) {
                return entry.getValue();
            }
        }
        return null;
    }

    @Cacheable(value = "dashboard_employee", key = "#employee.id")
    @Transactional(readOnly = true)
    public EmployeeDashboardDto getEmployeeDashboard(User employee) {
        long clientsCount = userRepository.countByAssignedEmployee(employee);

        long tasksCount = taskRepository.countTasksForEmployee(employee);

        List<Map<String, Object>> statusList = taskRepository.countTasksByStatusForEmployee(employee);
        Map<String, Long> tasksByStatus = statusList.stream()
            .collect(Collectors.toMap(
                m -> m.get("statusName") != null ? m.get("statusName").toString() : "Unknown",
                m -> ((Number) m.get("count")).longValue()
            ));

        Double empAvgDaysRaw = taskRepository.getAverageCompletionDaysForEmployee(employee.getId());
        double avgCompletionDays = empAvgDaysRaw != null ? Math.round(empAvgDaysRaw * 10.0) / 10.0 : 0.0;

        return new EmployeeDashboardDto(clientsCount, tasksCount, tasksByStatus, avgCompletionDays);
    }

    @Cacheable(value = "dashboard_client", key = "#client.id")
    @Transactional(readOnly = true)
    public ClientDashboardDto getClientDashboard(User client) {
        long tasksCount = taskRepository.countTasksByStatusForClient(client.getId()).stream().mapToLong(m -> ((Number) m.get("count")).longValue()).sum();
        
        List<Map<String, Object>> statusList = taskRepository.countTasksByStatusForClient(client.getId());
        Map<String, Long> tasksByStatus = statusList.stream()
            .collect(Collectors.toMap(
                m -> m.get("statusName") != null ? m.get("statusName").toString() : "Unknown",
                m -> ((Number) m.get("count")).longValue()
            ));
                
        return new ClientDashboardDto(tasksCount, tasksByStatus);
    }
}
