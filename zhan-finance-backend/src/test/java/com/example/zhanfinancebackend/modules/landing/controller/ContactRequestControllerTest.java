package com.example.zhanfinancebackend.modules.landing.controller;

import com.example.zhanfinancebackend.modules.landing.dto.ContactRequestCreateRequest;
import com.example.zhanfinancebackend.modules.landing.dto.ContactRequestDto;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest.ContactRequestStatus;
import com.example.zhanfinancebackend.modules.landing.service.ContactRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // disable security filters for simple controller test if needed, or use @WithMockUser
public class ContactRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ContactRequestService contactRequestService;

    @Test
    public void createContactRequest_ShouldReturnSuccess() throws Exception {
        ContactRequestCreateRequest request = new ContactRequestCreateRequest("Ivan Ivanov", "+7 777 123 4567", null, "Test message", "frontend");

        ContactRequestDto mockResponse = new ContactRequestDto(1L, "Ivan Ivanov", "+7 777 123 4567", null, "Test message", "frontend", ContactRequestStatus.NEW, null, null);

        when(contactRequestService.create(any(ContactRequestCreateRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/contact-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Contact request created"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("Ivan Ivanov"));
    }
}
