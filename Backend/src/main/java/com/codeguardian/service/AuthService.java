package com.codeguardian.service;

import com.codeguardian.payload.LoginDto;
import com.codeguardian.payload.RegisterDto;

public interface AuthService {
    String login(LoginDto loginDto);
    String register(RegisterDto registerDto);
}
