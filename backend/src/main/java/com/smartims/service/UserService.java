package com.smartims.service;

import com.smartims.dto.LoginRequest;
import com.smartims.dto.LoginResponse;
import com.smartims.dto.RegisterRequest;
import com.smartims.dto.RegisterResponse;

public interface UserService {

    RegisterResponse registerUser(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    void resetPassword(String email, String newPassword);
}
