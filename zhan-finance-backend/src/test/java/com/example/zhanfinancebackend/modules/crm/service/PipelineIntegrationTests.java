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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
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

    private String adminToken;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
        pipelineRepository.deleteAll();

        User admin = new User("Admin", "admin_pipeline@test.com", "pass", Role.ADMIN);
        admin = userRepository.save(admin);
        adminToken = jwtService.generateAccessToken(admin);

        Pipeline pipeline = new Pipeline("Test Pipeline");
        pipeline.setDefault(true);
        pipeline = pipelineRepository.save(pipeline);

        Stage s1 = new Stage(pipeline, "New", 0, "#000000", StageType.OPEN);
        s1.setDefault(true);
        s1 = stageRepository.save(s1);

        Stage s2 = new Stage(pipeline, "Done", 1, "#ffffff", StageType.WON);
        s2 = stageRepository.save(s2);

        pipeline.getStages().add(s1);
        pipeline.getStages().add(s2);
        pipelineRepository.save(pipeline);
    }

    @Test
    void getPipelines_ShouldReturnPipelinesWithStages() throws Exception {
        mockMvc.perform(get("/api/crm/pipelines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[*].name", hasItem("Test Pipeline")));
    }
}
