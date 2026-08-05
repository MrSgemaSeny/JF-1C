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
    void testHandleMethodArgumentNotValid() {
        org.springframework.web.bind.MethodArgumentNotValidException ex = mock(org.springframework.web.bind.MethodArgumentNotValidException.class);
        org.springframework.validation.BindingResult bindingResult = mock(org.springframework.validation.BindingResult.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(java.util.Collections.emptyList());
        
        ResponseEntity<ErrorResponse> response = handler.handleValidation(ex, request);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("VALIDATION_ERROR", response.getBody().getCode());
    }

    @Test
    void testHandleUnauthorized() {
        UnauthorizedException ex = new UnauthorizedException("Unauthorized");
        ResponseEntity<ErrorResponse> response = handler.handleUnauthorized(ex, request, Locale.ENGLISH);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("UNAUTHORIZED", response.getBody().getCode());
    }

    @Test
    void testHandleAccessDenied() {
        org.springframework.security.access.AccessDeniedException ex = new org.springframework.security.access.AccessDeniedException("Denied");
        ResponseEntity<ErrorResponse> response = handler.handleAccessDenied(ex, request, Locale.ENGLISH);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("FORBIDDEN", response.getBody().getCode());
    }

    @Test
    void testHandleUnprocessableEntity() {
        InvalidStateException ex = new InvalidStateException("Invalid state");
        ResponseEntity<ErrorResponse> response = handler.handleUnprocessableEntity(ex, request, Locale.ENGLISH);
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, response.getStatusCode());
        assertEquals("UNPROCESSABLE_ENTITY", response.getBody().getCode());
    }

    @Test
    void testHandleApiException() {
        ApiException ex = new ApiException(ErrorCode.BAD_REQUEST, "API error");
        ResponseEntity<ErrorResponse> response = handler.handleApiException(ex, request, Locale.ENGLISH);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(ErrorCode.BAD_REQUEST.name(), response.getBody().getCode());
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
