package com.example.zhanfinancebackend.modules.crm.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("select t from Task t join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy")
    List<Task> findAllWithDetails();

    @Query("select t from Task t join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy where t.client.id = :clientId or t.createdBy.id = :clientId")
    List<Task> findAllByClientWithDetails(@Param("clientId") Long clientId);

    @Query("select t from Task t join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy where c.assignedEmployee = :employee or t.assignedTo = :employee")
    List<Task> findAllByEmployeeWithDetails(@Param("employee") User employee);

    @Query("select t from Task t join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy where t.id = :id")
    Optional<Task> findByIdWithDetails(@Param("id") Long id);

    @Query("select t from Task t left join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy " +
           "where (c.id = :userId or t.assignedTo.id = :userId or t.createdBy.id = :userId) " +
           "and t.dueDate >= :startDate and t.dueDate <= :endDate")
    List<Task> findTasksForCalendar(
            @Param("userId") Long userId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate
    );

    @Query("select t from Task t join fetch t.client c left join fetch t.assignedTo left join fetch t.createdBy " +
           "where t.dueDate = :dueDate and t.status not in :excludedStatuses")
    List<Task> findByDueDateAndStatusNotIn(
            @Param("dueDate") java.time.LocalDate dueDate, 
            @Param("excludedStatuses") List<TaskStatus> excludedStatuses
    );

    @Query("select distinct t from Task t join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy left join fetch t.subtasks " +
           "where lower(t.title) like lower(concat('%', :query, '%')) or lower(t.description) like lower(concat('%', :query, '%'))")
    List<Task> searchTasks(@Param("query") String query);
}