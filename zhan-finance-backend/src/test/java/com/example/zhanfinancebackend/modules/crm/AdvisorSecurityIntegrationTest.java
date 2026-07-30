package com.example.zhanfinancebackend.modules.crm;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AdvisorSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private UserPrincipal advisorPrincipal;
    private UserPrincipal employeePrincipal;

    @BeforeEach
    public void setup() {
        User advisorUser = new User("Advisor User", "advisor@zhanfinance.kz", "password", Role.ADVISOR);
        advisorUser.setId(101L);
        advisorUser.setEnabled(true);
        this.advisorPrincipal = new UserPrincipal(advisorUser);

        User employeeUser = new User("Employee User", "employee@zhanfinance.kz", "password", Role.EMPLOYEE);
        employeeUser.setId(102L);
        employeeUser.setEnabled(true);
        this.employeePrincipal = new UserPrincipal(employeeUser);
    }

    // --- ADVISOR ALLOWED ENDPOINTS (200 OK or non-403) ---

    @Test
    public void advisor_CanAccessCrmTasks() throws Exception {
        mockMvc.perform(get("/api/v1/crm/tasks").contextPath("/api")
                .with(user(advisorPrincipal)))
                .andExpect(status().isOk());
    }

    @Test
    public void advisor_CanAccessCrmClients() throws Exception {
        mockMvc.perform(get("/api/v1/crm/clients").contextPath("/api")
                .with(user(advisorPrincipal)))
                .andExpect(status().isOk());
    }

    @Test
    public void advisor_CanAccessEmployeesWorkload() throws Exception {
        mockMvc.perform(get("/api/v1/crm/employees/workload").contextPath("/api")
                .with(user(advisorPrincipal)))
                .andExpect(status().isOk());
    }

    @Test
    public void advisor_CanAssignTask() throws Exception {
        mockMvc.perform(patch("/api/v1/crm/tasks/1/assign").contextPath("/api")
                .param("assigneeId", "2")
                .with(user(advisorPrincipal))
                .with(csrf()))
                .andExpect(status().is(org.hamcrest.Matchers.not(403)));
    }

    @Test
    public void advisor_CanApproveReassignment() throws Exception {
        mockMvc.perform(post("/api/v1/crm/tasks/1/reassign/approve").contextPath("/api")
                .with(user(advisorPrincipal))
                .with(csrf()))
                .andExpect(status().is(org.hamcrest.Matchers.not(403)));
    }

    @Test
    public void advisor_CanRejectReassignment() throws Exception {
        mockMvc.perform(post("/api/v1/crm/tasks/1/reassign/reject").contextPath("/api")
                .with(user(advisorPrincipal))
                .with(csrf()))
                .andExpect(status().is(org.hamcrest.Matchers.not(403)));
    }

    // --- ADVISOR FORBIDDEN ENDPOINTS (403 Forbidden) ---

    @Test
    public void advisor_ForbiddenFromAdminFinanceSummary() throws Exception {
        mockMvc.perform(get("/api/v1/admin/finance/summary").contextPath("/api")
                .with(user(advisorPrincipal)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void advisor_ForbiddenFromApproveEmployee() throws Exception {
        mockMvc.perform(post("/api/v1/admin/employees/1/approve").contextPath("/api")
                .with(user(advisorPrincipal))
                .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    public void advisor_ForbiddenFromPromoteToAdvisor() throws Exception {
        mockMvc.perform(post("/api/v1/admin/employees/1/promote-to-advisor").contextPath("/api")
                .with(user(advisorPrincipal))
                .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    public void advisor_ForbiddenFromDeleteEmployee() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/employees/1").contextPath("/api")
                .with(user(advisorPrincipal))
                .with(csrf()))
                .andExpect(status().isForbidden());
    }

    // --- EMPLOYEE FORBIDDEN ENDPOINTS (403 Forbidden) ---

    @Test
    public void employee_AllowedOnCrmWorkload() throws Exception {
        mockMvc.perform(get("/api/v1/crm/employees/workload").contextPath("/api")
                .with(user(employeePrincipal)))
                .andExpect(status().isOk());
    }

    @Test
    public void employee_ForbiddenFromApproveReassignment() throws Exception {
        mockMvc.perform(post("/api/v1/crm/tasks/1/reassign/approve").contextPath("/api")
                .with(user(employeePrincipal))
                .with(csrf()))
                .andExpect(status().isForbidden());
    }
}
