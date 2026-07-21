package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.CalendarEventCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.CalendarEventDto;
import com.example.zhanfinancebackend.modules.crm.service.CalendarService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/crm/calendar")
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    public ApiResponse<List<CalendarEventDto>> getEvents(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ApiResponse.success(calendarService.getCalendarEvents(principal.getUser(), startDate, endDate));
    }

    @PostMapping
    public ApiResponse<CalendarEventDto> createEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CalendarEventCreateRequest request
    ) {
        return ApiResponse.success(calendarService.createEvent(principal.getUser(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<CalendarEventDto> updateEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CalendarEventCreateRequest request
    ) {
        return ApiResponse.success(calendarService.updateEvent(principal.getUser(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        calendarService.deleteEvent(principal.getUser(), id);
        return ApiResponse.success(null);
    }
}
