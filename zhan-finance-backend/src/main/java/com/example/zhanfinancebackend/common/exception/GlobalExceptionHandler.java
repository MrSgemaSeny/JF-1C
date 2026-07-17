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

import org.springframework.context.MessageSource;
import java.util.Locale;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

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
        
        String titleMessage = "Validation failed";
        try {
            titleMessage = messageSource.getMessage("error.validation.failed", null, titleMessage, request.getLocale());
        } catch (Exception ignored) {}

        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                titleMessage,
                details,
                request.getRequestURI(),
                requestId
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException exception, HttpServletRequest request, Locale locale) {
        return buildResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", exception, request, locale);
    }

    // --- 401 Unauthorized ---
    
    @ExceptionHandler({UnauthorizedException.class, org.springframework.security.core.AuthenticationException.class})
    public ResponseEntity<ErrorResponse> handleUnauthorized(Exception exception, HttpServletRequest request, Locale locale) {
        String message = exception.getMessage();
        try {
            if (exception instanceof org.springframework.security.authentication.BadCredentialsException) {
                message = messageSource.getMessage("error.bad.credentials", null, locale);
            } else if (exception instanceof org.springframework.security.core.userdetails.UsernameNotFoundException) {
                message = messageSource.getMessage("error.user.not.found", null, locale);
            } else {
                message = messageSource.getMessage("error.unauthorized", null, locale);
            }
        } catch (Exception e) {}
        
        String requestId = UUID.randomUUID().toString();
        log.warn("[{}] Error 401: {}", requestId, exception.getMessage());
        
        ErrorResponse response = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED",
                message != null ? message : "Unauthorized",
                request.getRequestURI(),
                requestId
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    // --- 403 Forbidden ---
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request, Locale locale) {
        return buildResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", exception, request, locale);
    }

    // --- 404 Not Found ---
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request, Locale locale) {
        return buildResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", exception, request, locale);
    }

    // --- 409 Conflict ---
    
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException exception, HttpServletRequest request, Locale locale) {
        return buildResponse(HttpStatus.CONFLICT, "CONFLICT", exception, request, locale);
    }

    // --- 422 Unprocessable Entity ---
    
    @ExceptionHandler({InvalidStateException.class, UnprocessableEntityException.class})
    public ResponseEntity<ErrorResponse> handleUnprocessableEntity(RuntimeException exception, HttpServletRequest request, Locale locale) {
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, "UNPROCESSABLE_ENTITY", exception, request, locale);
    }

    // --- Legacy ApiException Mapping ---
    
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException exception, HttpServletRequest request, Locale locale) {
        HttpStatus status = exception.getErrorCode().getStatus();
        return buildResponse(status, exception.getErrorCode().name(), exception, request, locale);
    }

    // --- 500 Internal Server Error ---
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request, Locale locale) {
        String requestId = UUID.randomUUID().toString();
        log.error("[{}] Unexpected internal error at {}: {}", requestId, request.getRequestURI(), exception.getMessage(), exception);
        
        String translatedMessage = "Internal server error. Reference ID: " + requestId;
        try {
            translatedMessage = messageSource.getMessage("error.internal", null, "Internal server error", locale) + ". Reference ID: " + requestId;
        } catch (Exception ignored) {}

        ErrorResponse response = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL_ERROR",
                translatedMessage,
                request.getRequestURI(),
                requestId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    // --- Utility ---

    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status, 
            String code, 
            Exception exception, 
            HttpServletRequest request,
            Locale locale
    ) {
        String requestId = UUID.randomUUID().toString();
        log.warn("[{}] Error {}: {}", requestId, status.value(), exception.getMessage());
        
        String translatedMessage = exception.getMessage();
        try {
            String messageKey = "error.internal";
            if (exception instanceof ResourceNotFoundException) messageKey = "error.resource.notFound";
            else if (exception instanceof org.springframework.security.authentication.BadCredentialsException) messageKey = "error.bad.credentials";
            else if (exception instanceof UnauthorizedException || exception instanceof org.springframework.security.core.AuthenticationException) messageKey = "error.unauthorized";
            else if (exception instanceof AccessDeniedException) messageKey = "error.access.denied";
            else if (exception instanceof ConflictException) messageKey = "error.conflict";
            else if (exception instanceof BadRequestException) messageKey = "error.bad.request";
            else if (exception instanceof ApiException apiEx) {
                messageKey = "error." + apiEx.getErrorCode().name().toLowerCase();
            }
            
            translatedMessage = messageSource.getMessage(messageKey, null, exception.getMessage(), locale);
        } catch (Exception e) {
            // fallback
        }

        ErrorResponse response = new ErrorResponse(
                status.value(),
                code,
                translatedMessage,
                request.getRequestURI(),
                requestId
        );
        return ResponseEntity.status(status).body(response);
    }
}
