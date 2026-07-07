package com.example.zhanfinancebackend;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.LessonType;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import com.example.zhanfinancebackend.modules.courses.repository.LessonRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CourseIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @BeforeEach
    void setUp() {
        courseRepository.deleteAll();
        lessonRepository.deleteAll();
    }

    private String registerAndGetToken(String email, Role role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Test User",
                                  "email": "%s",
                                  "password": "password123",
                                  "role": "%s"
                                }
                                """.formatted(email, role.name())))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode auth = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        return auth.get("accessToken").asText();
    }

    @Test
    void adminCanCreateCourseAndLessonWithFile_LearnerCanViewAndDownload() throws Exception {
        String adminToken = registerAndGetToken("admin@test.com", Role.ADMIN);
        String learnerToken = registerAndGetToken("learner@test.com", Role.LEARNER);

        // 1. Admin creates a course
        MvcResult courseResult = mockMvc.perform(post("/api/admin/courses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("title", "Integration Test Course")
                        .param("description", "Desc")
                        .param("isPublished", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Integration Test Course"))
                .andReturn();

        Long courseId = objectMapper.readTree(courseResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 2. Admin adds a lesson with a file
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-video.mp4",
                "video/mp4",
                "dummy video content".getBytes()
        );

        MvcResult lessonResult = mockMvc.perform(multipart("/api/admin/courses/" + courseId + "/lessons")
                        .file(file)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("title", "First Lesson")
                        .param("type", "VIDEO")
                        .param("orderIndex", "0"))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andReturn();

        Long lessonId = objectMapper.readTree(lessonResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 3. Learner fetches published courses
        mockMvc.perform(get("/api/courses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(courseId));

        // 4. Learner fetches specific course
        mockMvc.perform(get("/api/courses/" + courseId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lessons[0].id").value(lessonId));

        // 5. Learner downloads/streams the video (Full request)
        mockMvc.perform(get("/api/courses/lessons/" + lessonId + "/file")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(content().string("dummy video content"));

        // 6. Learner streaming with Range Header (Partial content)
        mockMvc.perform(get("/api/courses/lessons/" + lessonId + "/file")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + learnerToken)
                        .header(HttpHeaders.RANGE, "bytes=0-4"))
                .andExpect(status().isPartialContent())
                .andExpect(content().string("dummy"));
    }

    @Test
    void learnerCannotAccessUnpublishedCourse() throws Exception {
        String adminToken = registerAndGetToken("admin2@test.com", Role.ADMIN);
        String learnerToken = registerAndGetToken("learner2@test.com", Role.LEARNER);

        // 1. Admin creates UNPUBLISHED course
        MvcResult courseResult = mockMvc.perform(post("/api/admin/courses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("title", "Secret Course")
                        .param("isPublished", "false"))
                .andExpect(status().isOk())
                .andReturn();

        Long courseId = objectMapper.readTree(courseResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 2. Admin adds a lesson
        MvcResult lessonResult = mockMvc.perform(post("/api/admin/courses/" + courseId + "/lessons")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("title", "Secret Lesson")
                        .param("type", "DOCUMENT"))
                .andExpect(status().isOk())
                .andReturn();
        Long lessonId = objectMapper.readTree(lessonResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // 3. Learner should NOT see it in the list
        mockMvc.perform(get("/api/courses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + learnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());

        // 4. Learner should get error when accessing directly
        mockMvc.perform(get("/api/courses/" + courseId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + learnerToken))
                .andExpect(status().isInternalServerError()); // Or 403/404 depending on error handling

        // 5. Learner should get 403 when trying to access the lesson's file (if it had one)
        mockMvc.perform(get("/api/courses/lessons/" + lessonId + "/file")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + learnerToken))
                .andExpect(status().isForbidden());
    }
}
