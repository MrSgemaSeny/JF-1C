package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;

class InvoiceAccessServiceTest {

    private InvoiceAccessService invoiceAccessService;
    private User admin;
    private User employee;
    private User otherEmployee;
    private User advisor;
    private User learner;
    private User curator;
    private User clientWithEmployee;
    private User clientWithoutEmployee;
    private Invoice invoiceWithEmployee;
    private Invoice invoiceWithoutEmployee;

    @BeforeEach
    void setUp() {
        invoiceAccessService = new InvoiceAccessService();

        admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);

        employee = new User();
        employee.setId(2L);
        employee.setRole(Role.EMPLOYEE);

        otherEmployee = new User();
        otherEmployee.setId(3L);
        otherEmployee.setRole(Role.EMPLOYEE);

        advisor = new User();
        advisor.setId(31L);
        advisor.setRole(Role.ADVISOR);

        learner = new User();
        learner.setId(32L);
        learner.setRole(Role.LEARNER);

        curator = new User();
        curator.setId(33L);
        curator.setRole(Role.CURATOR);

        clientWithEmployee = new User();
        clientWithEmployee.setId(4L);
        clientWithEmployee.setRole(Role.CLIENT);
        clientWithEmployee.setAssignedEmployee(employee);

        clientWithoutEmployee = new User();
        clientWithoutEmployee.setId(5L);
        clientWithoutEmployee.setRole(Role.CLIENT);

        invoiceWithEmployee = new Invoice(clientWithEmployee, "Invoice 1", java.math.BigDecimal.TEN, java.time.LocalDate.now());
        invoiceWithEmployee.setId(10L);

        invoiceWithoutEmployee = new Invoice(clientWithoutEmployee, "Invoice 2", java.math.BigDecimal.TEN, java.time.LocalDate.now());
        invoiceWithoutEmployee.setId(11L);
    }

    @Test
    void testCanRead() {
        assertTrue(invoiceAccessService.canRead(admin, invoiceWithEmployee));
        
        assertTrue(invoiceAccessService.canRead(clientWithEmployee, invoiceWithEmployee));
        assertFalse(invoiceAccessService.canRead(clientWithEmployee, invoiceWithoutEmployee));
        
        assertTrue(invoiceAccessService.canRead(employee, invoiceWithEmployee));
        assertFalse(invoiceAccessService.canRead(otherEmployee, invoiceWithEmployee));
        assertFalse(invoiceAccessService.canRead(employee, invoiceWithoutEmployee));

        assertFalse(invoiceAccessService.canRead(advisor, invoiceWithEmployee));
        assertFalse(invoiceAccessService.canRead(learner, invoiceWithEmployee));
        assertFalse(invoiceAccessService.canRead(curator, invoiceWithEmployee));
    }

    @Test
    void testCanWrite() {
        assertTrue(invoiceAccessService.canWrite(admin, invoiceWithEmployee));
        
        assertTrue(invoiceAccessService.canWrite(clientWithEmployee, invoiceWithEmployee));
        
        assertTrue(invoiceAccessService.canWrite(employee, invoiceWithEmployee));
        assertFalse(invoiceAccessService.canWrite(otherEmployee, invoiceWithEmployee));

        assertFalse(invoiceAccessService.canWrite(advisor, invoiceWithEmployee));
        assertFalse(invoiceAccessService.canWrite(learner, invoiceWithEmployee));
        assertFalse(invoiceAccessService.canWrite(curator, invoiceWithEmployee));
    }

    @Test
    void testAssertCanReadThrows() {
        assertThrows(AccessDeniedException.class, () -> {
            invoiceAccessService.assertCanRead(otherEmployee, invoiceWithEmployee);
        });
    }

    @Test
    void testCanCreateFor() {
        assertTrue(invoiceAccessService.canCreateFor(admin, clientWithEmployee));
        
        assertTrue(invoiceAccessService.canCreateFor(clientWithEmployee, clientWithEmployee));
        assertFalse(invoiceAccessService.canCreateFor(clientWithEmployee, clientWithoutEmployee));
        
        assertTrue(invoiceAccessService.canCreateFor(employee, clientWithEmployee));
        assertFalse(invoiceAccessService.canCreateFor(otherEmployee, clientWithEmployee));

        assertFalse(invoiceAccessService.canCreateFor(advisor, clientWithEmployee));
        assertFalse(invoiceAccessService.canCreateFor(learner, clientWithEmployee));
        assertFalse(invoiceAccessService.canCreateFor(curator, clientWithEmployee));
    }
}
