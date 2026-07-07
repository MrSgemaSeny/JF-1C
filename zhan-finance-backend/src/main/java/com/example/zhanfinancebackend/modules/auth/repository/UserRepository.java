package com.example.zhanfinancebackend.modules.auth.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(com.example.zhanfinancebackend.modules.auth.entity.Role role);

    long countByAssignedEmployee(User employee);

    List<User> findAllByRole(com.example.zhanfinancebackend.modules.auth.entity.Role role);
    
    List<User> findAllByAssignedEmployee(User employee);

    @Query(value = """
        SELECT u.* FROM app_users u
        LEFT JOIN tasks t ON t.assigned_to_id = u.id AND t.status IN ('NEW', 'IN_PROGRESS')
        WHERE u.role = 'EMPLOYEE' AND u.enabled = true
        GROUP BY u.id
        ORDER BY COUNT(t.id) ASC
        LIMIT 1
    """, nativeQuery = true)
    Optional<User> findLeastLoadedEmployee();
    
    List<User> findAllByRoleIn(List<com.example.zhanfinancebackend.modules.auth.entity.Role> roles);

    @org.springframework.data.jpa.repository.Query("select u from User u where lower(u.fullName) like lower(concat('%', :query, '%')) or lower(u.email) like lower(concat('%', :query, '%'))")
    List<User> searchUsers(@org.springframework.data.repository.query.Param("query") String query);
}