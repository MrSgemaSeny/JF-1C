package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.dto.CalendarEventCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.CalendarEventDto;
import com.example.zhanfinancebackend.modules.crm.entity.CalendarEvent;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.TaskStatus;
import com.example.zhanfinancebackend.modules.crm.repository.CalendarEventRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CalendarService {

    private final CalendarEventRepository eventRepository;
    private final TaskRepository taskRepository;

    public CalendarService(CalendarEventRepository eventRepository, TaskRepository taskRepository) {
        this.eventRepository = eventRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<CalendarEventDto> getCalendarEvents(User user, LocalDate startDate, LocalDate endDate) {
        List<CalendarEventDto> dtos = new ArrayList<>();

        // 1. Fetch personal calendar events
        List<CalendarEvent> events = eventRepository.findEventsByUserAndDateRange(user.getId(), startDate, endDate);
        for (CalendarEvent event : events) {
            dtos.add(new CalendarEventDto(
                    "event_" + event.getId(),
                    event.getId(),
                    "EVENT",
                    event.getDate().toString(),
                    event.getTime() != null ? event.getTime().toString() : null,
                    event.getTitle(),
                    event.getDescription(),
                    event.getColor(),
                    false
            ));
        }

        // 2. Fetch tasks with due dates
        List<Task> tasks = taskRepository.findTasksForCalendar(user.getId(), startDate, endDate);
        for (Task task : tasks) {
            dtos.add(new CalendarEventDto(
                    "task_" + task.getId(),
                    task.getId(),
                    "TASK",
                    task.getDueDate().toString(),
                    null,
                    task.getTitle(),
                    task.getDescription(),
                    "RED", // High priority color by default, or map based on priority
                    task.getStatus() == TaskStatus.DONE
            ));
        }

        // 3. Sort by date and time
        dtos.sort(Comparator.comparing(CalendarEventDto::date)
                .thenComparing(dto -> dto.time() != null ? dto.time() : "23:59"));

        return dtos;
    }

    @Transactional
    public CalendarEventDto createEvent(User user, CalendarEventCreateRequest request) {
        CalendarEvent event = new CalendarEvent(
                user,
                request.date(),
                request.time(),
                request.title(),
                request.description(),
                request.color() != null ? request.color() : "BLUE"
        );
        eventRepository.save(event);
        
        return new CalendarEventDto(
                "event_" + event.getId(),
                event.getId(),
                "EVENT",
                event.getDate().toString(),
                event.getTime() != null ? event.getTime().toString() : null,
                event.getTitle(),
                event.getDescription(),
                event.getColor(),
                false
        );
    }
    
    @Transactional
    public void deleteEvent(User user, Long id) {
        CalendarEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Event not found"));
                
        if (!event.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not your event");
        }
        
        eventRepository.delete(event);
    }
}

