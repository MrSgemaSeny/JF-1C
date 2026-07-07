package com.example.zhanfinancebackend.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // --- 400 Bad Request ---
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        String requestId = UUID.randomUUID().toString();
        List<ErrorResponse.ErrorDetail> details = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> new ErrorResponse.ErrorDetail(err.getField(), err.getDefaultMessage()))
                .collect(Collectors.toList());

        log.warn("[{}] Validation failed: {}", requestId, details);
        
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                "Validation failed",
                details,
                request.getRequestURI(),
                requestId
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", exception, request);
    }

    // --- 401 Unauthorized ---
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", exception, request);
    }

    // --- 403 Forbidden ---
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", exception, request);
    }

    // --- 404 Not Found ---
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", exception, request);
    }

    // --- 409 Conflict ---
    
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, "CONFLICT", exception, request);
    }

    // --- 422 Unprocessable Entity ---
    
    @ExceptionHandler({InvalidStateException.class, UnprocessableEntityException.class})
    public ResponseEntity<ErrorResponse> handleUnprocessableEntity(RuntimeException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, "UNPROCESSABLE_ENTITY", exception, request);
    }

    // --- Legacy ApiException Mapping ---
    
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException exception, HttpServletRequest request) {
        HttpStatus status = exception.getErrorCode().getStatus();
        return buildResponse(status, exception.getErrorCode().name(), exception, request);
    }

    // --- 500 Internal Server Error ---
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        String requestId = UUID.randomUUID().toString();
        log.error("[{}] Unexpected internal error at {}: {}", requestId, request.getRequestURI(), exception.getMessage(), exception);
        
        ErrorResponse response = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                "Internal server error",
                request.getRequestURI(),
                requestId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    // --- Utility ---

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String code, Exception exception, HttpServletRequest request) {
        String requestId = UUID.randomUUID().toString();
        
        if (status.is5xxServerError()) {
            log.error("[{}] Error {}: {}", requestId, status.value(), exception.getMessage(), exception);
        } else {
            log.warn("[{}] Error {}: {}", requestId, status.value(), exception.getMessage());
        }

        ErrorResponse response = new ErrorResponse(
                status.value(),
                code,
                exception.getMessage() != null ? exception.getMessage() : status.getReasonPhrase(),
                request.getRequestURI(),
                requestId
        );
        return ResponseEntity.status(status).body(response);
    }
}
