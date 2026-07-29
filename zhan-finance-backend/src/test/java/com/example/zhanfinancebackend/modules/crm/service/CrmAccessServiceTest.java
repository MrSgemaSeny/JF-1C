package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;

class CrmAccessServiceTest {

    private CrmAccessService accessService;

    private User admin;
    private User employee1;
    private User employee2;
    private User client1;
    private User client2;

    private Task task1;

    @BeforeEach
    void setUp() {
        accessService = new CrmAccessService();

        admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);

        employee1 = new User();
        employee1.setId(2L);
        employee1.setRole(Role.EMPLOYEE);

        employee2 = new User();
        employee2.setId(3L);
        employee2.setRole(Role.EMPLOYEE);

        client1 = new User();
        client1.setId(4L);
        client1.setRole(Role.CLIENT);
        client1.setAssignedEmployee(employee1);

        client2 = new User();
        client2.setId(5L);
        client2.setRole(Role.CLIENT);
        client2.setAssignedEmployee(employee2);

        task1 = new Task();
        task1.setId(10L);
        task1.setClient(client1);
        task1.setAssignedTo(employee1);
    }

    @Test
    @DisplayName("CLIENT 1 может читать свою задачу, но не может читать задачу CLIENT 2")
    void testClient_AccessTask() {
        assertDoesNotThrow(() -> accessService.assertCanReadTask(client1, task1));

        Task task2 = new Task();
        task2.setId(11L);
        task2.setClient(client2);

        assertThrows(AccessDeniedException.class, () -> accessService.assertCanReadTask(client1, task2));
    }

    @Test
    @DisplayName("EMPLOYEE не может перевести задачу в статус WON или LOST напрямую")
    void testEmployee_CannotSetWonOrLost() {
        Stage wonStage = new Stage();
        wonStage.setType(StageType.WON);

        assertThrows(AccessDeniedException.class, () -> accessService.assertCanUpdateTaskStage(employee1, task1, wonStage));
    }

    @Test
    @DisplayName("ADMIN имеет полный доступ ко всем задачам и действиям")
    void testAdmin_FullAccess() {
        Stage wonStage = new Stage();
        wonStage.setType(StageType.WON);

        assertDoesNotThrow(() -> accessService.assertCanReadTask(admin, task1));
        assertDoesNotThrow(() -> accessService.assertCanUpdateTaskStage(admin, task1, wonStage));
        assertDoesNotThrow(() -> accessService.assertCanAssignClient(admin));
    }
}
