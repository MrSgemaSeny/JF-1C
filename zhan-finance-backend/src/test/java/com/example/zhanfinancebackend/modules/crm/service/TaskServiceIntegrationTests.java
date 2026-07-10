package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.repository.PipelineRepository;
import com.example.zhanfinancebackend.modules.crm.repository.StageRepository;
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
import static org.assertj.core.api.Assertions.assertThat;

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

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private StageRepository stageRepository;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService emailNotificationService;

    private String clientToken;
    private String employeeToken;
    private String adminToken;
    private User client;
    private User employee;
    private User admin;

    @BeforeEach
    void setup() {
        client = new User("Client User", "client@test.com", "encoded", Role.CLIENT);
        client = userRepository.save(client);

        employee = new User("Employee", "emp@test.com", "encoded", Role.EMPLOYEE);
        employee = userRepository.save(employee);

        admin = new User("Admin", "admin2@test.com", "encoded", Role.ADMIN);
        admin = userRepository.save(admin);

        clientToken = jwtService.generateAccessToken(client);
        employeeToken = jwtService.generateAccessToken(employee);
        adminToken = jwtService.generateAccessToken(admin);

        if (pipelineRepository.findByIsDefaultTrue().isEmpty()) {
            Pipeline pipeline = new Pipeline("Default");
            pipeline.setDefault(true);
            pipeline = pipelineRepository.save(pipeline);
            Stage openStage = new Stage(pipeline, "NEW", 0, null, StageType.OPEN);
            openStage.setDefault(true);
            stageRepository.save(openStage);
            stageRepository.save(new Stage(pipeline, "DONE", 1, null, StageType.WON));
        }
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
                .andExpect(jsonPath("$.data.stage.type").value("OPEN"))
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
        Stage doneStage = stageRepository.findAll().stream().filter(s -> s.getType() == StageType.WON).findFirst().orElseThrow();
        mockMvc.perform(
                patch("/api/crm/tasks/{id}/stage", taskId)
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "stageId": %d
                            }
                            """.formatted(doneStage.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stage.type").value("WON"));

        // STEP 4: Verify client sees updated task
        mockMvc.perform(
                get("/api/crm/tasks/{id}", taskId)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stage.type").value("WON"))
                .andExpect(jsonPath("$.data.assignedTo.email").value("emp@test.com"));
    }

    @Test
    void getTask_UnauthorizedClient_Returns403() throws Exception {
        User anotherClient = new User("Another", "another@test.com", "encoded", Role.CLIENT);
        anotherClient = userRepository.save(anotherClient);

        Task task = new Task("Secret task", anotherClient, anotherClient);
        Stage newStage = stageRepository.findAll().stream().filter(s -> s.getType() == StageType.OPEN).findFirst().orElseThrow();
        task.setStage(newStage);
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

    @Test
    void deleteTask_ShouldDeleteTask() throws Exception {
        Task task = new Task("Task to delete", client, client);
        task.setStage(stageRepository.findAll().get(0));
        task = taskRepository.save(task);

        mockMvc.perform(delete("/api/crm/tasks/{id}", task.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        assertThat(taskRepository.findById(task.getId())).isEmpty();
    }
}
