package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.dto.CalendarEventDto;
import com.example.zhanfinancebackend.modules.crm.entity.CalendarEvent;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.CalendarEventRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CalendarServiceTest {

    private CalendarService calendarService;
    private CalendarEventRepository eventRepository;
    private TaskRepository taskRepository;

    @BeforeEach
    void setUp() {
        eventRepository = mock(CalendarEventRepository.class);
        taskRepository = mock(TaskRepository.class);
        calendarService = new CalendarService(eventRepository, taskRepository);
    }

    @Test
    void testGetCalendarEvents_MixingAndSorting() {
        User user = new User();
        user.setId(1L);

        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate endDate = LocalDate.of(2026, 8, 31);

        // Event 1: Aug 15, 14:00
        CalendarEvent event1 = new CalendarEvent();
        event1.setId(100L);
        event1.setDate(LocalDate.of(2026, 8, 15));
        event1.setTime(LocalTime.of(14, 0));
        event1.setTitle("Meeting");

        // Event 2: Aug 10, no time (should be treated as 23:59)
        CalendarEvent event2 = new CalendarEvent();
        event2.setId(101L);
        event2.setDate(LocalDate.of(2026, 8, 10));
        event2.setTitle("Holiday");

        when(eventRepository.findEventsByUserAndDateRange(1L, startDate, endDate))
                .thenReturn(List.of(event1, event2));

        // Task 1: Aug 15, 09:00 (due date is LocalDate, so time is null -> 23:59)
        Task task1 = new Task();
        task1.setId(200L);
        task1.setDueDate(LocalDate.of(2026, 8, 15));
        task1.setTitle("Task Due");
        
        Stage wonStage = new Stage();
        wonStage.setType(StageType.WON);
        task1.setStage(wonStage); // should map to isCompleted = true

        when(taskRepository.findTasksForCalendar(1L, startDate, endDate))
                .thenReturn(List.of(task1));

        List<CalendarEventDto> events = calendarService.getCalendarEvents(user, startDate, endDate);

        assertEquals(3, events.size());

        // Sorting check:
        // 1. event2: Aug 10
        // 2. event1: Aug 15 14:00
        // 3. task1: Aug 15 (no time -> 23:59)
        
        assertEquals("event_101", events.get(0).id());
        assertEquals("event_100", events.get(1).id());
        assertEquals("task_200", events.get(2).id());

        assertTrue(events.get(2).isCompleted()); // because StageType.WON
        assertEquals("RED", events.get(2).color()); // Task default color
    }
}
