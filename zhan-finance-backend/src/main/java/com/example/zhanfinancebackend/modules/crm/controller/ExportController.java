package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.service.TaskService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/crm/export")
public class ExportController {

    private static final char BOM = '\ufeff';
    // Точка с запятой — правильный выбор для Excel в RU/KZ локали
    private static final char DELIMITER = ';';
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final TaskService taskService;

    public ExportController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<byte[]> exportTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long stageId
    ) {
        User user = principal.getUser();
        boolean isAdmin = user.getRole() == Role.ADMIN;

        List<TaskDto> tasks = isAdmin 
                ? taskService.getAllTasks(clientId, assignedToId, stageId, null)
                : taskService.getAllTasks(clientId, user.getId(), stageId, null);

        String csv = buildCsv(tasks);
        byte[] csvBytes = (BOM + csv).getBytes(StandardCharsets.UTF_8);

        String filename = "tasks_export_" + java.time.LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + filename)
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }

    // ── CSV builder ──────────────────────────────────────────────────────────

    private String buildCsv(List<TaskDto> tasks) {
        StringBuilder sb = new StringBuilder();

        // Заголовок
        appendRow(sb,
                "ID",
                "Название",
                "Описание",
                "Клиент",
                "Исполнитель",
                "Статус",
                "Дедлайн",
                "Дата создания"
        );

        // Данные
        for (TaskDto t : tasks) {
            appendRow(sb,
                    String.valueOf(t.id()),
                    t.title(),
                    t.description(),
                    t.client() != null ? t.client().fullName() : "",
                    t.assignedTo() != null ? t.assignedTo().fullName() : "Не назначен",
                    t.stage() != null ? t.stage().name() : "Нет стадии",
                    t.dueDate() != null ? t.dueDate().format(DATE_FMT) : "",
                    t.createdAt() != null ? t.createdAt().format(DATETIME_FMT) : ""
            );
        }

        return sb.toString();
    }

    /**
     * Добавляет одну строку CSV.
     * Каждое поле экранируется по RFC 4180:
     *   - обёртывается в кавычки
     *   - внутренние кавычки удваиваются
     *   - переносы строк внутри значения сохраняются (Excel поддерживает)
     */
    private void appendRow(StringBuilder sb, String... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(DELIMITER);
            sb.append(escapeCsvValue(values[i]));
        }
        sb.append("\r\n"); // RFC 4180 требует CRLF
    }

    /**
     * Экранирование одного значения по RFC 4180.
     * Всегда оборачиваем в кавычки — проще и надёжнее чем проверять нужно ли.
     */
    private String escapeCsvValue(String value) {
        if (value == null) return "\"\"";
        // Удваиваем кавычки внутри значения
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    // ── Локализация значений ─────────────────────────────────────────────────


}
//test