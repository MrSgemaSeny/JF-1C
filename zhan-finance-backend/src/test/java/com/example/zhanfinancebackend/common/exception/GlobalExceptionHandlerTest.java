package com.example.zhanfinancebackend.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Locale;
import java.util.List;

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

    @Test
    void testHandleHttpMessageNotReadableGeneral() {
        org.springframework.http.converter.HttpMessageNotReadableException ex = 
                new org.springframework.http.converter.HttpMessageNotReadableException("Required request body is missing", (org.springframework.http.HttpInputMessage) null);
        
        ResponseEntity<ErrorResponse> response = handler.handleHttpMessageNotReadable(ex, request, Locale.ENGLISH);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INVALID_PAYLOAD", response.getBody().getCode());
        assertEquals("Malformed request payload", response.getBody().getMessage());
    }

    @Test
    void testHandleHttpMessageNotReadableInvalidEnum() {
        com.fasterxml.jackson.databind.exc.InvalidFormatException ife = mock(com.fasterxml.jackson.databind.exc.InvalidFormatException.class);
        when(ife.getValue()).thenReturn("UNKNOWN_STATUS");
        doReturn(com.example.zhanfinancebackend.modules.billing.entity.Invoice.InvoiceStatus.class).when(ife).getTargetType();
        
        com.fasterxml.jackson.databind.JsonMappingException.Reference ref = new com.fasterxml.jackson.databind.JsonMappingException.Reference(null, "status");
        when(ife.getPath()).thenReturn(List.of(ref));
        
        org.springframework.http.converter.HttpMessageNotReadableException ex = mock(org.springframework.http.converter.HttpMessageNotReadableException.class);
        when(ex.getCause()).thenReturn(ife);
        when(ex.getMessage()).thenReturn("Cannot deserialize value UNKNOWN_STATUS");
        
        ResponseEntity<ErrorResponse> response = handler.handleHttpMessageNotReadable(ex, request, Locale.ENGLISH);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INVALID_PAYLOAD", response.getBody().getCode());
        assertTrue(response.getBody().getMessage().contains("Invalid value 'UNKNOWN_STATUS' for enum InvoiceStatus"));
        assertNotNull(response.getBody().getDetails());
        assertEquals(1, response.getBody().getDetails().size());
        assertEquals("status", response.getBody().getDetails().get(0).getField());
    }

    @Test
    void testHandleDataIntegrityViolation() {
        org.springframework.dao.DataIntegrityViolationException ex =
                new org.springframework.dao.DataIntegrityViolationException("duplicate key value violates unique constraint");
        when(messageSource.getMessage(eq("error.data_integrity_violation"), any(), anyString(), any()))
                .thenReturn("Duplicate record or integrity violation");

        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolation(ex, request, Locale.ENGLISH);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("DATA_CONFLICT", response.getBody().getCode());
        assertEquals("Duplicate record or integrity violation", response.getBody().getMessage());
        assertNotNull(response.getBody().getRequestId());
    }

    @Test
    void testHandleIllegalArgument() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid status argument");

        ResponseEntity<ErrorResponse> response = handler.handleIllegalArgument(ex, request, Locale.ENGLISH);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("BAD_REQUEST", response.getBody().getCode());
        assertEquals("Invalid status argument", response.getBody().getMessage());
    }

    @Test
    void testHandleMethodArgumentTypeMismatch() {
        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex =
                mock(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("taskId");
        when(ex.getMessage()).thenReturn("Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long'");
        when(messageSource.getMessage(eq("error.invalid_parameter"), any(), anyString(), any()))
                .thenReturn("Invalid parameter format");

        ResponseEntity<ErrorResponse> response = handler.handleMethodArgumentTypeMismatch(ex, request, Locale.ENGLISH);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INVALID_PARAMETER", response.getBody().getCode());
        assertTrue(response.getBody().getMessage().contains("taskId"));
    }

    @Test
    void testHandleMissingServletRequestParameter() {
        org.springframework.web.bind.MissingServletRequestParameterException ex =
                new org.springframework.web.bind.MissingServletRequestParameterException("page", "int");
        when(messageSource.getMessage(eq("error.missing_parameter"), any(), anyString(), any()))
                .thenReturn("Missing parameter");

        ResponseEntity<ErrorResponse> response = handler.handleMissingServletRequestParameter(ex, request, Locale.ENGLISH);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("MISSING_PARAMETER", response.getBody().getCode());
        assertTrue(response.getBody().getMessage().contains("page"));
    }

    @Test
    void testHandleMaxUploadSizeExceeded() {
        org.springframework.web.multipart.MaxUploadSizeExceededException ex =
                new org.springframework.web.multipart.MaxUploadSizeExceededException(20 * 1024 * 1024L);
        when(messageSource.getMessage(eq("error.file_too_large"), any(), anyString(), any()))
                .thenReturn("File size exceeds 20MB limit");

        ResponseEntity<ErrorResponse> response = handler.handleMaxUploadSizeExceeded(ex, request, Locale.ENGLISH);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("FILE_TOO_LARGE", response.getBody().getCode());
        assertEquals("File size exceeds 20MB limit", response.getBody().getMessage());
    }
}
