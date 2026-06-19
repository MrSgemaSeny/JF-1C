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

    @Query("select t from Task t join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy where t.client = :client")
    List<Task> findAllByClientWithDetails(@Param("client") User client);

    @Query("select t from Task t join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy where c.assignedEmployee = :employee or t.assignedTo = :employee")
    List<Task> findAllByEmployeeWithDetails(@Param("employee") User employee);

    @Query("select t from Task t join fetch t.client c left join fetch c.assignedEmployee left join fetch t.assignedTo left join fetch t.createdBy where t.id = :id")
    Optional<Task> findByIdWithDetails(@Param("id") Long id);
}
