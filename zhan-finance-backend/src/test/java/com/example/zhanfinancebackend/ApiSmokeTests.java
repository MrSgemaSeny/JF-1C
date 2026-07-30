package com.example.zhanfinancebackend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.transaction.annotation.Transactional;
import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.repository.PipelineRepository;
import com.example.zhanfinancebackend.modules.crm.repository.StageRepository;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiSmokeTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private StageRepository stageRepository;

    @BeforeEach
    void setup() {
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
    void publicContactRequestIsAvailable() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/contact-requests").contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Smoke User",
                                  "phone": "+77000000000",
                                  "source": "test"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("NEW"));
    }

    @Test
    void authJwtUserProfileAndBillingCrudWork() throws Exception {
        JsonNode auth = register("smoke@example.com");
        String accessToken = auth.get("accessToken").asText();
        String refreshToken = auth.get("refreshToken").asText();

        assertThat(accessToken).isNotBlank();
        assertThat(refreshToken).isNotBlank();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login").contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "smoke@example.com",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andReturn();

        String currentRefreshToken = objectMapper
                .readTree(loginResult.getResponse().getContentAsString())
                .get("data")
                .get("refreshToken")
                .asText();

        mockMvc.perform(post("/api/v1/auth/refresh").contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "%s"
                                }
                                """.formatted(currentRefreshToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());

        mockMvc.perform(get("/api/v1/users/me").contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("smoke@example.com"));

        mockMvc.perform(put("/api/v1/users/me").contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Smoke Updated",
                                  "phone": "+77111111111",
                                  "companyName": "Smoke Company"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Smoke Updated"));

        long invoiceId = createInvoice(accessToken);
        mockMvc.perform(get("/api/v1/billing/invoices").contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Smoke invoice"));

        mockMvc.perform(put("/api/v1/billing/invoices/{id}", invoiceId).contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Updated invoice",
                                  "amount": 2500.00,
                                  "status": "ISSUED",
                                  "dueDate": "2026-07-01"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ISSUED"));

        mockMvc.perform(delete("/api/v1/billing/invoices/{id}", invoiceId).contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        long subscriptionId = createSubscription(accessToken);
        mockMvc.perform(get("/api/v1/billing/subscriptions").contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].planName").value("Business"));

        mockMvc.perform(put("/api/v1/billing/subscriptions/{id}", subscriptionId).contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "planName": "Business Plus",
                                  "monthlyPrice": 9900.00,
                                  "status": "PAUSED",
                                  "startsAt": "2026-06-17",
                                  "endsAt": "2026-12-31"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PAUSED"));

        mockMvc.perform(delete("/api/v1/billing/subscriptions/{id}", subscriptionId).contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    void crmTasksWork() throws Exception {
        JsonNode clientAuth = register("client_smoke@example.com");
        String clientToken = clientAuth.get("accessToken").asText();
        
        // Client requests a task
        MvcResult requestResult = mockMvc.perform(post("/api/v1/crm/tasks/request").contextPath("/api")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Need help with integration",
                                  "description": "Please call me"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stage.type").value("OPEN"))
                .andExpect(jsonPath("$.data.client.email").value("client_smoke@example.com"))
                .andReturn();
                
        long taskId = objectMapper.readTree(requestResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();
                
        // Client can fetch their own task
        mockMvc.perform(get("/api/v1/crm/tasks/" + taskId).contextPath("/api")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Need help with integration"));

        // Employee can fetch pipelines
        JsonNode empAuth = register("employee_smoke@example.com");
        String empToken = empAuth.get("accessToken").asText();

        mockMvc.perform(get("/api/v1/crm/pipelines").contextPath("/api")
                        .header("Authorization", "Bearer " + empToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].name").isNotEmpty())
                .andExpect(jsonPath("$.data[0].stages").isArray())
                .andExpect(jsonPath("$.data[0].stages[0].name").isNotEmpty());
    }

    @Test
    void protectedEndpointsRequireJwt() throws Exception {
        mockMvc.perform(get("/api/v1/users/me").contextPath("/api"))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(get("/api/v1/contact-requests").contextPath("/api"))
                .andExpect(status().is4xxClientError());
    }

    private JsonNode register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register").contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Smoke User",
                                  "email": "%s",
                                  "password": "password123"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
    }

    private long createInvoice(String accessToken) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/billing/invoices").contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Smoke invoice",
                                  "amount": 1000.00,
                                  "dueDate": "2026-07-01"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();
    }

    private long createSubscription(String accessToken) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/billing/subscriptions").contextPath("/api")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "planName": "Business",
                                  "monthlyPrice": 7900.00,
                                  "startsAt": "2026-06-17"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();
    }
}
