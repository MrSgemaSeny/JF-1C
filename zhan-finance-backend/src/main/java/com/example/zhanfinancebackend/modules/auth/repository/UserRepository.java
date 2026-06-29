package com.example.zhanfinancebackend.modules.auth.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(com.example.zhanfinancebackend.modules.auth.entity.Role role);

    long countByAssignedEmployee(User employee);

    List<User> findAllByRole(com.example.zhanfinancebackend.modules.auth.entity.Role role);
    
    List<User> findAllByAssignedEmployee(User employee);
    
    List<User> findAllByRoleIn(List<com.example.zhanfinancebackend.modules.auth.entity.Role> roles);

    @org.springframework.data.jpa.repository.Query("select u from User u where lower(u.fullName) like lower(concat('%', :query, '%')) or lower(u.email) like lower(concat('%', :query, '%'))")
    List<User> searchUsers(@org.springframework.data.repository.query.Param("query") String query);
}