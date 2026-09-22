package com.example.zhanfinancebackend.modules.crm;

import com.example.zhanfinancebackend.common.exception.ConflictException;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.PipelineRepository;
import com.example.zhanfinancebackend.modules.crm.repository.StageRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.crm.service.TaskService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class TaskConcurrencyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StageRepository stageRepository;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private TaskService taskService;

    @Autowired
    private EntityManager entityManager;

    private User client;
    private User employee1;
    private User employee2;
    private Stage defaultStage;

    @BeforeEach
    void setUp() {
        client = userRepository.save(new User("Test Client", "client_concurrency@zhanfinance.kz", "password", Role.CLIENT));
        employee1 = userRepository.save(new User("Emp One", "emp1_concurrency@zhanfinance.kz", "password", Role.EMPLOYEE));
        employee2 = userRepository.save(new User("Emp Two", "emp2_concurrency@zhanfinance.kz", "password", Role.EMPLOYEE));

        Pipeline pipeline = pipelineRepository.findByIsDefaultTrue()
                .orElseGet(() -> {
                    Pipeline p = new Pipeline("Default Pipeline");
                    p.setDefault(true);
                    return pipelineRepository.save(p);
                });

        defaultStage = stageRepository.findByPipelineIdAndIsDefaultTrue(pipeline.getId())
                .orElseGet(() -> {
                    Stage s = new Stage(pipeline, "Default Stage", 0, "#ffffff", StageType.OPEN);
                    s.setDefault(true);
                    return stageRepository.save(s);
                });
    }

    @Test
    void testOptimisticLockingOnTaskUpdate() {
        Task task = new Task("Concurrency Test Task", client, client);
        task.setStage(defaultStage);
        Task saved = taskRepository.saveAndFlush(task);
        assertNotNull(saved.getVersion());
        assertEquals(0L, saved.getVersion());

        // Update task to version 1 in DB
        saved.setTitle("Updated Title in Session 1");
        taskRepository.saveAndFlush(saved);
        assertEquals(1L, saved.getVersion());

        // Clear persistence context
        entityManager.clear();

        // Create stale entity referencing the same ID with old version 0
        Task staleTask = new Task();
        staleTask.setId(saved.getId());
        staleTask.setVersion(0L);
        staleTask.setTitle("Stale Title in Session 2");
        staleTask.setClient(client);
        staleTask.setCreatedBy(client);
        staleTask.setStage(defaultStage);

        // Updating with stale version 0 must throw ObjectOptimisticLockingFailureException
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> {
            taskRepository.saveAndFlush(staleTask);
        });
    }

    @Test
    void testClaimTaskFromPoolSuccessAndConflict() {
        Task task = new Task("Pool Task", client, client);
        task.setStage(defaultStage);
        task.setAssignedTo(null);
        Task saved = taskRepository.saveAndFlush(task);

        TaskDto claimedDto = taskService.claimTaskFromPool(saved.getId(), employee1);
        assertNotNull(claimedDto.assignedTo());
        assertEquals(employee1.getId(), claimedDto.assignedTo().id());

        assertThrows(ConflictException.class, () -> {
            taskService.claimTaskFromPool(saved.getId(), employee2);
        });
    }

    @Test
    void testClaimTaskEndpointMockMvc() throws Exception {
        Task task = new Task("MockMvc Claim Task", client, client);
        task.setStage(defaultStage);
        task.setAssignedTo(null);
        Task saved = taskRepository.saveAndFlush(task);

        UserPrincipal empPrincipal = new UserPrincipal(employee1);

        mockMvc.perform(post("/api/v1/crm/tasks/{id}/claim", saved.getId()).contextPath("/api")
                        .header("X-Requested-With", "XMLHttpRequest")
                        .with(user(empPrincipal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assignedTo.id").value(employee1.getId()));
    }
}
