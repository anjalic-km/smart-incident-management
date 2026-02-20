package com.smartims.exception;

import com.smartims.dto.ApiResponse;
import com.smartims.service.OtpException;
import com.smartims.util.ResponseUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException(
            AuthenticationException ex) {

        log.warn("Authentication failed", ex);

        return ResponseUtil.error(
                HttpStatus.UNAUTHORIZED,
                "Authentication failed"
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(
            AccessDeniedException ex) {

        log.warn("Access denied", ex);

        return ResponseUtil.error(
                HttpStatus.FORBIDDEN,
                "You do not have permission to access this resource"
        );
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthException(AuthException ex) {

        log.info("AuthException: {}", ex.getMessage());

        return ResponseUtil.error(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage()
        );
    }

    @ExceptionHandler(OtpException.class)
    public ResponseEntity<ApiResponse<?>> handleOtpException(OtpException ex) {

        log.info("OtpException: {}", ex.getMessage());

        return ResponseUtil.error(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<?>> handleBadRequestException(BadRequestException ex) {
        log.info("BadRequestException: {}", ex.getMessage());
        return ResponseUtil.error(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.info("ResourceNotFoundException: {}", ex.getMessage());
        return ResponseUtil.error(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation", ex);
        return ResponseUtil.error(
                HttpStatus.BAD_REQUEST,
                "Invalid or duplicate data"
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.info("IllegalArgumentException: {}", ex.getMessage());
        return ResponseUtil.error(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {

        log.error("Unhandled exception occurred", ex);

        return ResponseUtil.error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong. Please try again later."
        );
    }
}
