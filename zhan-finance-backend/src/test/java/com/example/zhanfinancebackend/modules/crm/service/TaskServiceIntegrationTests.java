package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TaskServiceIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private JwtService jwtService;

    private String clientToken;
    private String employeeToken;
    private User client;
    private User employee;

    @BeforeEach
    void setup() {
        taskRepository.deleteAll();
        userRepository.deleteAll();

        client = new User("Client User", "client@test.com", "encoded", Role.CLIENT);
        client = userRepository.save(client);

        employee = new User("Employee", "emp@test.com", "encoded", Role.EMPLOYEE);
        employee = userRepository.save(employee);

        clientToken = jwtService.generateAccessToken(client);
        employeeToken = jwtService.generateAccessToken(employee);
    }

    @Test
    void taskWorkflow_ClientToCompletion() throws Exception {
        // STEP 1: Client requests task
        MvcResult createResult = mockMvc.perform(
                post("/api/crm/tasks/request")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "title": "Integration test task",
                                "description": "Test description"
                            }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("NEW"))
                .andReturn();

        long taskId = objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // STEP 2: Employee assigns to self
        mockMvc.perform(
                patch("/api/crm/tasks/{id}/assign", taskId)
                        .param("assigneeId", String.valueOf(employee.getId()))
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignedTo.id").value(employee.getId()));

        // STEP 3: Employee completes
        mockMvc.perform(
                patch("/api/crm/tasks/{id}/status", taskId)
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "status": "DONE"
                            }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"));

        // STEP 4: Verify client sees updated task
        mockMvc.perform(
                get("/api/crm/tasks/{id}", taskId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.assignedTo.email").value("emp@test.com"));
    }

    @Test
    void getTask_UnauthorizedClient_Returns403() throws Exception {
        User anotherClient = new User("Another", "another@test.com", "encoded", Role.CLIENT);
        anotherClient = userRepository.save(anotherClient);

        Task task = new Task("Secret task", anotherClient, anotherClient);
        task.setStatus(com.example.zhanfinancebackend.modules.crm.entity.TaskStatus.NEW);
        task = taskRepository.save(task);

        mockMvc.perform(
                get("/api/crm/tasks/{id}", task.getId())
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void createTask_MissingTitle_Returns400() throws Exception {
        mockMvc.perform(
                post("/api/crm/tasks/request")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "description": "No title"
                            }
                            """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }
}
