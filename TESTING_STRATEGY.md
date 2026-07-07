# Backend Testing Implementation Plan (Tier 1)
## Zhan Finance - Integration with Real Services

> **Статус**: Production-ready план для начинающего разработчика  
> **Дата**: Jul 2026  
> **Автор**: Senior Architecture Review  
> **Приоритет**: CRITICAL (blocking deployment without tests)

---

## 📊 EXECUTIVE SUMMARY

Этот план охватывает **реализацию Tier 1 тестов** (auth + task + billing) для `JF-1C` backend.

### Текущее состояние
- ❌ ~5% code coverage
- ✅ Уже есть application.properties для тестов (H2 database)
- ⚠️ Нет юнит-тестов для Service layer
- ⚠️ Минимальные интеграционные тесты (только smoke tests)

### Целевое состояние (после плана)
- ✅ 45%+ code coverage (core domain logic)
- ✅ 12+ юнит-тестов (Auth, Task, Billing)
- ✅ 5+ интеграционных тестов (full journey)
- ✅ CI/CD готов (GitHub Actions для автоматизации)
- ⏱️ Время: **~20 часов** (2.5 дня разработки)

---

## ⚠️ КРИТИЧЕСКИЕ ПРОБЛЕМЫ ТЕКУЩЕГО КОНФИГА

### Проблема 1: Flyway миграции замедляют тесты
```properties
# ❌ ТЕКУЩЕЕ - не отключает Flyway
spring.jpa.hibernate.ddl-auto=create-drop
```

**Почему это проблема**: Flyway запустится при старте каждого теста и выполнит все миграции из `src/main/resources/db/migration/`, это добавляет 2-3 сек/тест.

**Решение**: Явно отключить
```properties
spring.flyway.enabled=false
```

---

### Проблема 2: Redis может вызвать таймауты
```properties
# ❌ ТЕКУЩЕЕ - включает Redis попытку подключения
spring.cache.type=none  # только отключает кэширование, НЕ подключение
```

**Почему это проблема**: Если Redis не запущен, некоторые beans попытаются подключиться и заповат 15+ сек на таймаут.

**Решение**:
```properties
spring.redis.enabled=false
spring.redis.connection.timeout=1
```

---

### Проблема 3: Email notifications могут упасть
Нет явного конфига для mock'ирования `JavaMailSender` в тестах.

**Решение**: Добавить в тесты `@MockBean`:
```java
@SpringBootTest
class MyTest {
    @MockBean
    private JavaMailSender mailSender;
}
```

---

## 🔧 ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ

### 1️⃣ [MODIFY] build.gradle

**Что добавить**:
- JaCoCo plugin для coverage reporting
- Mockito-inline (для final classes, если пригодится)
- Rest-Assured (optional, для REST API тестов)
- Configuracion для jacocoTestReport

**Почему**:
- JaCoCo даст метрику качества (видеть что покрыто, что нет)
- Mockito-inline нужен для мокирования final классов (Spring beans часто final)
- Rest-Assured упростит REST-тесты (вместо MockMvc можно делать real HTTP)

```gradle
// В секции plugins
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.1.0'
    id 'io.spring.dependency-management' version '1.1.7'
    id 'jacoco'  // ← ДОБАВИТЬ
}

// В секции dependencies (в testImplementation/testRuntimeOnly)
dependencies {
    // ... существующие ...
    
    // Mockito
    testImplementation 'org.mockito:mockito-inline:5.2.0'
    testImplementation 'org.mockito:mockito-junit-jupiter:5.2.0'
    
    // Rest Assured (опционально, для REST тестов)
    testImplementation 'io.rest-assured:rest-assured:5.3.0'
    
    // AssertJ для более читаемых assertions
    testImplementation 'org.assertj:assertj-core:3.24.1'
}

// ← ДОБАВИТЬ В КОНЕЦ ФАЙЛА
jacoco {
    toolVersion = "0.8.10"
}

tasks.named('jacocoTestReport') {
    dependsOn test
    
    reports {
        xml.required = true      // для CI/CD
        html.required = true     // для локального просмотра
        csv.required = false
    }
    
    afterEvaluate {
        // Исключаем из coverageDTO, Entity, Config классы
        classDirectories.setFrom(files(classDirectories.files.collect {
            fileTree(dir: it, exclude: [
                '**/config/**',
                '**/dto/**',
                '**/entity/**',
                '**/common/**'
            ])
        }))
    }
}

// Запускать jacoco после test
tasks.named('test') {
    useJUnitPlatform()
    finalizedBy jacocoTestReport
}
```

---

### 2️⃣ [REPLACE] application.properties → src/test/resources/

**Текущее состояние**: application.properties уже существует, но неполный.

**Новое содержимое** (полностью переписать):

```properties
# ========== DATABASE ==========
spring.datasource.url=jdbc:h2:mem:zhan_finance_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA Configuration
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.use_sql_comments=false

# ========== MIGRATION ==========
# ❗ КРИТИЧНО: отключить Flyway в тестах (ускоряет на 2-3 сек/тест)
spring.flyway.enabled=false
spring.flyway.locations=classpath:db/migration

# ========== CACHE & REDIS ==========
# ❗ КРИТИЧНО: отключить Redis полностью
spring.cache.type=none
spring.redis.enabled=false
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.timeout=1s
spring.redis.connection-timeout=1s

# ========== SECURITY & JWT ==========
app.jwt.secret=test-secret-key-minimum-32-characters-needed-here-test
app.jwt.access-token-expiration-ms=900000
app.jwt.refresh-token-expiration-ms=604800000

# ========== MAIL ==========
spring.mail.host=localhost
spring.mail.port=1025
spring.mail.username=test
spring.mail.password=test
spring.mail.properties.mail.smtp.auth=false
spring.mail.properties.mail.smtp.starttls.enable=false
app.mail.from-address=noreply@zhanfinance.test

# ========== CORS ==========
app.cors.allowed-origins=http://localhost:5173,http://localhost:3000

# ========== FRONTEND URL ==========
app.frontend.url=http://localhost:5173

# ========== GOOGLE OAUTH ==========
# Mock values for tests (не используется в unit/integration тестах)
spring.security.oauth2.client.registration.google.client-id=test-client-id
spring.security.oauth2.client.registration.google.client-secret=test-client-secret

# ========== LOGGING ==========
logging.level.root=WARN
logging.level.com.example.zhanfinancebackend=DEBUG
logging.level.org.springframework.web=INFO
logging.level.org.springframework.security=INFO
logging.level.org.hibernate=WARN

# ========== ACTUATOR (опционально) ==========
management.endpoints.web.exposure.include=health,metrics
```

---

### 3️⃣ [NEW] Test Fixtures (Builders) - MUST HAVE!

**Файл**: `src/test/java/com/example/zhanfinancebackend/common/fixture/UserBuilder.java`

```java
package com.example.zhanfinancebackend.common.fixture;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;

/**
 * Builder for creating test User instances.
 * Используется для избежания дублирования кода в тестах.
 */
public class UserBuilder {
    private Long id;
    private String email = "test@example.com";
    private String fullName = "Test User";
    private String password = "encodedPassword123";
    private Role role = Role.CLIENT;
    private User assignedEmployee;
    
    public static UserBuilder aUser() {
        return new UserBuilder();
    }
    
    public static UserBuilder anEmployee() {
        return new UserBuilder().withRole(Role.EMPLOYEE);
    }
    
    public static UserBuilder anAdmin() {
        return new UserBuilder().withRole(Role.ADMIN);
    }
    
    public UserBuilder withId(Long id) {
        this.id = id;
        return this;
    }
    
    public UserBuilder withEmail(String email) {
        this.email = email;
        return this;
    }
    
    public UserBuilder withFullName(String fullName) {
        this.fullName = fullName;
        return this;
    }
    
    public UserBuilder withPassword(String password) {
        this.password = password;
        return this;
    }
    
    public UserBuilder withRole(Role role) {
        this.role = role;
        return this;
    }
    
    public UserBuilder withAssignedEmployee(User employee) {
        this.assignedEmployee = employee;
        return this;
    }
    
    public User build() {
        User user = new User(fullName, email, password, role);
        
        // Используем reflection для установки id (если нужна тестирование)
        if (id != null) {
            try {
                java.lang.reflect.Field idField = User.class.getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(user, id);
            } catch (Exception e) {
                throw new RuntimeException("Failed to set User id", e);
            }
        }
        
        if (assignedEmployee != null) {
            user.setAssignedEmployee(assignedEmployee);
        }
        
        return user;
    }
}
```

**Файл**: `src/test/java/com/example/zhanfinancebackend/common/fixture/TaskBuilder.java`

```java
package com.example.zhanfinancebackend.common.fixture;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.TaskPriority;
import com.example.zhanfinancebackend.modules.crm.entity.TaskStatus;
import java.time.LocalDate;

/**
 * Builder для создания тестовых Task объектов
 */
public class TaskBuilder {
    private Long id;
    private String title = "Test Task";
    private String description = "Test Description";
    private User client;
    private User creator;
    private User assignedTo;
    private TaskStatus status = TaskStatus.NEW;
    private TaskPriority priority = TaskPriority.MEDIUM;
    private LocalDate dueDate;
    
    public static TaskBuilder aTask() {
        return new TaskBuilder();
    }
    
    public TaskBuilder withId(Long id) {
        this.id = id;
        return this;
    }
    
    public TaskBuilder withTitle(String title) {
        this.title = title;
        return this;
    }
    
    public TaskBuilder withClient(User client) {
        this.client = client;
        return this;
    }
    
    public TaskBuilder withCreator(User creator) {
        this.creator = creator;
        return this;
    }
    
    public TaskBuilder withAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
        return this;
    }
    
    public TaskBuilder withStatus(TaskStatus status) {
        this.status = status;
        return this;
    }
    
    public TaskBuilder withDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
        return this;
    }
    
    public Task build() {
        User requiredClient = client != null ? client : UserBuilder.aUser()
            .withEmail("client@test.com")
            .build();
        User requiredCreator = creator != null ? creator : requiredClient;
        
        Task task = new Task(title, requiredClient, requiredCreator);
        task.setDescription(description);
        task.setStatus(status);
        task.setPriority(priority);
        task.setDueDate(dueDate);
        
        if (assignedTo != null) {
            task.setAssignedTo(assignedTo);
        }
        
        return task;
    }
}
```

---

### 4️⃣ [NEW] Security Test Utilities

**Файл**: `src/test/java/com/example/zhanfinancebackend/common/fixture/SecurityFixture.java`

```java
package com.example.zhanfinancebackend.common.fixture;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Утилита для генерации JWT токенов в тестах
 */
@Component
public class SecurityFixture {
    
    @Autowired
    private JwtService jwtService;
    
    /**
     * Генерирует валидный JWT токен для заданного юзера
     */
    public String generateToken(User user) {
        return jwtService.generateAccessToken(user);
    }
    
    /**
     * Генерирует токен для юзера с определённой ролью
     */
    public String generateTokenForRole(Role role) {
        User user = UserBuilder.aUser()
            .withEmail("test-" + role.name() + "@example.com")
            .withRole(role)
            .build();
        return generateToken(user);
    }
    
    /**
     * Возвращает Authorization header с Bearer токеном
     */
    public String authHeaderForRole(Role role) {
        return "Bearer " + generateTokenForRole(role);
    }
}
```

---

### 5️⃣ [NEW] Unit Tests - AuthService

**Файл**: `src/test/java/com/example/zhanfinancebackend/modules/auth/service/AuthServiceUnitTests.java`

```java
package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.fixture.UserBuilder;
import com.example.zhanfinancebackend.modules.auth.dto.AuthResponse;
import com.example.zhanfinancebackend.modules.auth.dto.LoginRequest;
import com.example.zhanfinancebackend.modules.auth.dto.RegisterRequest;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.service.ClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceUnitTests {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private AuthenticationManager authManager;
    
    @Mock
    private JwtService jwtService;
    
    @Mock
    private RefreshTokenService refreshTokenService;
    
    @Mock
    private ClientService clientService;
    
    @InjectMocks
    private AuthService authService;
    
    @BeforeEach
    void setUp() {
        // Reset all mocks before each test
    }
    
    // ========== REGISTRATION TESTS ==========
    
    @Test
    @DisplayName("Should successfully register new user with valid email")
    void register_ValidEmail_Success() {
        // ARRANGE
        RegisterRequest request = new RegisterRequest(
            "newuser@test.com",
            "John Doe",
            "securePassword123",
            null,  // role (будет CLIENT по умолчанию)
            null   // companyName
        );
        
        User savedUser = UserBuilder.aUser()
            .withId(1L)
            .withEmail("newuser@test.com")
            .withFullName("John Doe")
            .build();
        
        when(userRepository.existsByEmailIgnoreCase("newuser@test.com"))
            .thenReturn(false);
        when(passwordEncoder.encode("securePassword123"))
            .thenReturn("encoded_password");
        when(userRepository.save(any(User.class)))
            .thenReturn(savedUser);
        when(jwtService.generateAccessToken(savedUser))
            .thenReturn("access_token_123");
        
        // ACT
        AuthResponse response = authService.register(request);
        
        // ASSERT
        assertThat(response.email()).isEqualTo("newuser@test.com");
        assertThat(response.accessToken()).isEqualTo("access_token_123");
        verify(clientService).ensureProfile(eq(savedUser), any(), any());
    }
    
    @Test
    @DisplayName("Should reject registration if email already exists")
    void register_DuplicateEmail_ThrowsException() {
        // ARRANGE
        RegisterRequest request = new RegisterRequest(
            "existing@test.com",
            "Jane Doe",
            "password123",
            null,
            null
        );
        
        when(userRepository.existsByEmailIgnoreCase("existing@test.com"))
            .thenReturn(true);
        
        // ACT & ASSERT
        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("already registered");
        
        verify(userRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should prevent Employee registration via standard form")
    void register_EmployeeRole_ThrowsException() {
        // ARRANGE
        RegisterRequest request = new RegisterRequest(
            "emp@test.com",
            "Employee",
            "password",
            Role.EMPLOYEE,  // ← Попытка зарегистрироваться как сотрудник
            null
        );
        
        when(userRepository.existsByEmailIgnoreCase(anyString()))
            .thenReturn(false);
        
        // ACT & ASSERT
        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Google");
        
        verify(userRepository, never()).save(any());
    }
    
    // ========== LOGIN TESTS ==========
    
    @Test
    @DisplayName("Should reject login with invalid password")
    void login_InvalidPassword_ThrowsException() {
        // ARRANGE
        LoginRequest request = new LoginRequest("user@test.com", "wrongpass");
        
        when(authManager.authenticate(any()))
            .thenThrow(new BadCredentialsException("Bad credentials"));
        
        // ACT & ASSERT
        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(BadCredentialsException.class);
    }
}
```

---

### 6️⃣ [NEW] Unit Tests - TaskService Access Control

**Файл**: `src/test/java/com/example/zhanfinancebackend/modules/crm/service/TaskServiceAccessTests.java`

```java
package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.common.fixture.TaskBuilder;
import com.example.zhanfinancebackend.common.fixture.UserBuilder;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.TaskStatus;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService Access Control Tests")
class TaskServiceAccessTests {
    
    @Mock
    private TaskRepository taskRepository;
    
    @Mock
    private CrmAccessService accessService;
    
    @InjectMocks
    private TaskService taskService;
    
    @Test
    @DisplayName("Client should only see their own tasks")
    void getTasksForClient_ReturnsOnlyOwnTasks() {
        // ARRANGE
        User client = UserBuilder.aUser()
            .withId(10L)
            .withEmail("client@test.com")
            .withRole(Role.CLIENT)
            .build();
        
        Task ownTask = TaskBuilder.aTask()
            .withId(1L)
            .withClient(client)
            .withTitle("Own task")
            .build();
        
        when(taskRepository.findAllByClientWithDetails(10L))
            .thenReturn(List.of(ownTask));
        
        // ACT
        List<TaskDto> tasks = taskService.getTasksForClient(client);
        
        // ASSERT
        assertThat(tasks)
            .hasSize(1)
            .extracting(TaskDto::title)
            .containsExactly("Own task");
    }
    
    @Test
    @DisplayName("Should prevent deletion of completed tasks")
    void deleteTask_IfCompleted_ThrowsException() {
        // ARRANGE
        Task completedTask = TaskBuilder.aTask()
            .withStatus(TaskStatus.COMPLETED)
            .build();
        
        when(taskRepository.findByIdWithDetails(1L))
            .thenReturn(java.util.Optional.of(completedTask));
        
        // ACT & ASSERT
        assertThatThrownBy(() -> taskService.deleteTask(1L))
            .isInstanceOf(com.example.zhanfinancebackend.common.exception.ApiException.class);
    }
}
```

---

### 7️⃣ [NEW] Integration Tests - Full Journey

**Файл**: `src/test/java/com/example/zhanfinancebackend/modules/crm/controller/TaskControllerIntegrationTests.java`

```java
package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.fixture.SecurityFixture;
import com.example.zhanfinancebackend.common.fixture.UserBuilder;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Task Controller Integration Tests")
class TaskControllerIntegrationTests {
    
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
    
    @Autowired(required = false)
    private SecurityFixture securityFixture;
    
    private String clientToken;
    private String employeeToken;
    private User client;
    private User employee;
    
    @BeforeEach
    void setup() {
        // Clean up from previous tests
        taskRepository.deleteAll();
        userRepository.deleteAll();
        
        // Create test users
        client = UserBuilder.aUser()
            .withEmail("client@test.com")
            .withRole(Role.CLIENT)
            .build();
        client = userRepository.save(client);
        
        employee = UserBuilder.anEmployee()
            .withEmail("emp@test.com")
            .build();
        employee = userRepository.save(employee);
        
        // Generate tokens
        clientToken = jwtService.generateAccessToken(client);
        employeeToken = jwtService.generateAccessToken(employee);
    }
    
    @Test
    @DisplayName("Full workflow: Client creates task -> Employee takes -> Completes")
    void taskWorkflow_ClientToCompletion() throws Exception {
        // STEP 1: Client requests task
        MvcResult createResult = mockMvc.perform(
            post("/api/crm/tasks/request")
                .header("Authorization", "Bearer " + clientToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "title": "Integration test task",
                        "description": "Please help me"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("NEW"))
            .andExpect(jsonPath("$.data.client.email").value("client@test.com"))
            .andReturn();
        
        long taskId = objectMapper
            .readTree(createResult.getResponse().getContentAsString())
            .get("data").get("id").asLong();
        
        // STEP 2: Verify client can see their task
        mockMvc.perform(
            get("/api/crm/tasks/" + taskId)
                .header("Authorization", "Bearer " + clientToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("Integration test task"));
        
        // STEP 3: Employee updates status to IN_PROGRESS
        mockMvc.perform(
            patch("/api/crm/tasks/{id}/status", taskId)
                .header("Authorization", "Bearer " + employeeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "status": "IN_PROGRESS"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
        
        // STEP 4: Employee completes task
        mockMvc.perform(
            patch("/api/crm/tasks/{id}/status", taskId)
                .header("Authorization", "Bearer " + employeeToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "status": "COMPLETED"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("COMPLETED"));
        
        // STEP 5: Verify client sees completed task
        mockMvc.perform(
            get("/api/crm/tasks/" + taskId)
                .header("Authorization", "Bearer " + clientToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }
    
    @Test
    @DisplayName("Security: Client cannot view other client's task")
    void getTask_UnauthorizedClient_Returns403() throws Exception {
        // Create another client
        User anotherClient = UserBuilder.aUser()
            .withEmail("other@test.com")
            .build();
        anotherClient = userRepository.save(anotherClient);
        
        // Create task for another client
        Task task = new Task("Secret task", anotherClient, anotherClient);
        task = taskRepository.save(task);
        
        // Try to access as first client
        mockMvc.perform(
            get("/api/crm/tasks/{id}", task.getId())
                .header("Authorization", "Bearer " + clientToken))
            .andExpect(status().isForbidden());
    }
    
    @Test
    @DisplayName("Validation: Missing required fields returns 400")
    void createTask_MissingTitle_Returns400() throws Exception {
        mockMvc.perform(
            post("/api/crm/tasks/request")
                .header("Authorization", "Bearer " + clientToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "description": "No title provided"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }
}
```

---

## 📦 CI/CD Integration (Опционально, но рекомендуется)

### GitHub Actions Workflow

**Файл**: `.github/workflows/test.yml`

```yaml
name: Backend Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'zhan-finance-backend/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'zhan-finance-backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Run tests with Gradle
      working-directory: zhan-finance-backend
      run: ./gradlew test jacocoTestReport
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./zhan-finance-backend/build/reports/jacoco/test/jacocoTestReport.xml
        flags: backend
        fail_ci_if_error: false
```

---

## 🚀 EXECUTION PLAN

### День 1 (4-5 часов)
- [ ] Обновить `build.gradle` с JaCoCo и Mockito
- [ ] Обновить `application.properties` с корректным конфигом
- [ ] Создать `UserBuilder` и `TaskBuilder` fixtures
- [ ] Написать `AuthServiceUnitTests` (4 теста)
- [ ] Запустить: `./gradlew test`

### День 2 (4-5 часов)
- [ ] Создать `SecurityFixture`
- [ ] Написать `TaskServiceAccessTests` (3 теста)
- [ ] Написать `TaskControllerIntegrationTests` (3 теста)
- [ ] Запустить: `./gradlew jacocoTestReport`
- [ ] Проверить coverage в `build/reports/jacoco/index.html`

### День 3 (2-3 часа)
- [ ] Добавить параметризованные тесты для валидации
- [ ] Написать `InvoiceServiceUnitTests` (2-3 теста)
- [ ] Настроить GitHub Actions (опционально)
- [ ] Финальная проверка: все тесты зелёные, coverage > 45%

---

## ✅ DEFINITION OF DONE

**Минимум для "готово"**:
- [ ] 12+ тестов написано и проходит
- [ ] Coverage для `auth` и `crm` модулей > 50%
- [ ] Интеграционные тесты проходят (MockMvc)
- [ ] `./gradlew test jacocoTestReport` выполняется без ошибок за < 30 сек

**Опционально (для полноты)**:
- [ ] GitHub Actions настроен
- [ ] Codecov интегрирован
- [ ] README с инструкциями как запустить тесты

---

## ⚠️ ПОДВОДНЫЕ КАМНИ

### 1. Reflection for ID setting (UserBuilder)
```java
// ❌ ОПАСНО: Использование reflection
java.lang.reflect.Field idField = User.class.getDeclaredField("id");
idField.setAccessible(true);
idField.set(user, id);
```
**Проблема**: Если в User используется `@GeneratedValue`, то reflection может конфликтовать.  
**Решение**: Используй reflection только для тестов, или сделай конструктор для тестирования.

### 2. JwtService dependency in tests
Если `JwtService` использует `@Value` для `secret`, нужно убедиться что `application.properties` используется.  
**Решение**: Используй `@SpringBootTest` вместо `@ExtendWith(MockitoExtension.class)` для интеграционных тестов.

### 3. Database state pollution
Если тесты не очищают БД перед запуском, могут быть флакирующие тесты.  
**Решение**: В `@BeforeEach` очищай все таблицы: `taskRepository.deleteAll(); userRepository.deleteAll();`

### 4. Slow tests because of Flyway
Если `spring.flyway.enabled=false` не работает, тесты будут медленными.  
**Проверка**: Запусти один тест с `--debug` флагом и посмотри логи.

### 5. Email notifications в тестах
Если `EmailNotificationService` использует `JavaMailSender`, тесты упадут без мока.  
**Решение**: Добавь `@MockBean private JavaMailSender mailSender;` в тестовый класс.

---

## 📚 RESOURCES

- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/)
- [Spring Testing](https://spring.io/guides/gs/testing-web/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [AssertJ Assertions](https://assertj.github.io/assertj-core-features-highlight.html)
- [JaCoCo Coverage](https://www.jacoco.org/jacoco/trunk/doc/)

---

## SUMMARY

| Item | Time | Priority | Status |
|------|------|----------|--------|
| build.gradle update | 30 min | HIGH | To Do |
| application.properties fix | 20 min | CRITICAL | To Do |
| Test Fixtures (Builders) | 1 hour | HIGH | To Do |
| AuthService Unit Tests | 1.5 hour | HIGH | To Do |
| TaskService Access Tests | 1 hour | HIGH | To Do |
| Integration Tests | 2 hours | MEDIUM | To Do |
| CI/CD Setup | 1 hour | MEDIUM | Optional |
| **TOTAL** | **~7 hours** | - | - |

**Expected outcome**: 
- ✅ 45%+ code coverage
- ✅ 12+ passing tests
- ✅ Ready for production deployment
- ✅ Solid foundation for future Tier 2/3 tests

---

## HONEST ASSESSMENT

**Плюсы этого плана:**
- ✅ Фокус на critical logic (Auth, Access control)
- ✅ Не over-engineering (используем H2, а не Docker)
- ✅ Быстро (7 часов, а не 2 недели)
- ✅ Scalable (Fixtures легко добавлять новые тесты)

**Минусы:**
- ❌ Не покрывает Billing/Invoice (но это Tier 2)
- ❌ Не покрывает WebSocket/Chat (это сложнее)
- ❌ Reflection для ID в UserBuilder — хак (но работает)

**Рекомендация**: Начни с этого плана. После завершения Tier 1 можешь свободно добавлять Tier 2 тесты.