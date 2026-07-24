package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.repository.PipelineRepository;
import com.example.zhanfinancebackend.modules.crm.repository.StageRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PipelineIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private StageRepository stageRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ClientProfileRepository clientProfileRepository;

    private String adminToken;

    @BeforeEach
    void setup() {
        taskRepository.deleteAll();
        stageRepository.deleteAll();
        pipelineRepository.deleteAll();
        clientProfileRepository.deleteAll();
        userRepository.deleteAll();

        User admin = new User("Admin", "admin_pipeline@test.com", "pass", Role.ADMIN);
        admin = userRepository.save(admin);
        adminToken = jwtService.generateAccessToken(admin);

        Pipeline pipeline = new Pipeline("Test Pipeline");
        pipeline.setDefault(true);

        Stage s1 = new Stage(pipeline, "New", 0, "#000000", StageType.OPEN);
        s1.setDefault(true);

        Stage s2 = new Stage(pipeline, "Done", 1, "#ffffff", StageType.WON);

        pipeline.addStage(s1);
        pipeline.addStage(s2);

        pipelineRepository.save(pipeline);
    }

    @Test
    void getPipelines_ShouldReturnPipelinesWithStages() throws Exception {
        mockMvc.perform(get("/api/crm/pipelines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].name").value("Test Pipeline"))
                .andExpect(jsonPath("$.data[0].stages").isArray())
                .andExpect(jsonPath("$.data[0].stages", hasSize(2)));
    }
}
