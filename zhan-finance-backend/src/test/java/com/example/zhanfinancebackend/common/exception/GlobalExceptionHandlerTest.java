package com.example.zhanfinancebackend.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private MessageSource messageSource;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        messageSource = mock(MessageSource.class);
        handler = new GlobalExceptionHandler(messageSource);
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/test");
    }

    @Test
    void testHandleBadRequest() {
        BadRequestException ex = new BadRequestException("Invalid input");
        
        ResponseEntity<ErrorResponse> response = handler.handleBadRequest(ex, request, Locale.ENGLISH);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("BAD_REQUEST", response.getBody().getCode());
        assertEquals("/api/v1/test", response.getBody().getPath());
        assertNotNull(response.getBody().getRequestId());
    }

    @Test
    void testHandleNotFound() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Not found");
        
        ResponseEntity<ErrorResponse> response = handler.handleNotFound(ex, request, Locale.ENGLISH);
        
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("NOT_FOUND", response.getBody().getCode());
    }

    @Test
    void testHandleConflict() {
        ConflictException ex = new ConflictException("Conflict");
        
        ResponseEntity<ErrorResponse> response = handler.handleConflict(ex, request, Locale.ENGLISH);
        
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("CONFLICT", response.getBody().getCode());
    }

    @Test
    void testHandleUnexpectedException() {
        Exception ex = new Exception("Unexpected error");
        when(messageSource.getMessage(anyString(), any(), anyString(), any())).thenReturn("Translated internal error");
        
        ResponseEntity<ErrorResponse> response = handler.handleUnexpected(ex, request, Locale.ENGLISH);
        
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INTERNAL_ERROR", response.getBody().getCode());
        assertTrue(response.getBody().getMessage().contains("Translated internal error"));
        assertTrue(response.getBody().getMessage().contains("Reference ID:"));
    }
}
