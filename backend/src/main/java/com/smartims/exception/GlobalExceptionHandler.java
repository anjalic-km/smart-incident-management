package com.smartims.exception;

import com.smartims.dto.ApiResponse;
import com.smartims.util.ResponseUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntime(RuntimeException ex) {
        return ResponseUtil.error(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }

//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<ApiResponse<Object>> handleException(Exception ex) {
//        return ResponseUtil.error(
//                HttpStatus.INTERNAL_SERVER_ERROR,
//                "Something went wrong"
//        );
//    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleException(Exception ex) {
        ex.printStackTrace();
        return ResponseUtil.error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getMessage()
        );
    }

}
