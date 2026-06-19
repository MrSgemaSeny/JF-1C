package com.example.zhanfinancebackend.modules.crm.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.ClientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {

    Optional<ClientProfile> findByUser(User user);

    @Query("select cp from ClientProfile cp join fetch cp.user u left join fetch u.assignedEmployee")
    List<ClientProfile> findAllWithUser();

    @Query("select cp from ClientProfile cp join fetch cp.user u left join fetch u.assignedEmployee where u.assignedEmployee = :employee")
    List<ClientProfile> findAllByUserAssignedEmployee(@Param("employee") User employee);

    @Query("select cp from ClientProfile cp join fetch cp.user u left join fetch u.assignedEmployee where cp.id = :id")
    Optional<ClientProfile> findByIdWithUser(@Param("id") Long id);
}
