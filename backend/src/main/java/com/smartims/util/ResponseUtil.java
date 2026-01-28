package com.smartims.util;

import com.smartims.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResponseUtil {

    public static <T> ResponseEntity<ApiResponse<T>> success(
            String message, T data) {

        ApiResponse<T> response = new ApiResponse<>(
                HttpStatus.OK.value(),
                "SUCCESS",
                message,
                data
        );
        return ResponseEntity.ok(response);
    }

    public static <T> ResponseEntity<ApiResponse<T>> error(
            HttpStatus status, String message) {

        ApiResponse<T> response = new ApiResponse<>(
                status.value(),
                "FAILED",
                message,
                null
        );
        return new ResponseEntity<>(response, status);
    }
}
