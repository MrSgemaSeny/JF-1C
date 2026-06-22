package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.dto.AuthResponse;
import com.example.zhanfinancebackend.modules.auth.dto.LoginRequest;
import com.example.zhanfinancebackend.modules.auth.dto.RefreshRequest;
import com.example.zhanfinancebackend.modules.auth.dto.RegisterRequest;
import com.example.zhanfinancebackend.modules.auth.entity.RefreshToken;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.service.ClientService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final ClientService clientService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            ClientService clientService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.clientService = clientService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException(ErrorCode.CONFLICT, "Email is already registered");
        }

        User user = new User(
                request.fullName(),
                request.email().toLowerCase(),
                passwordEncoder.encode(request.password()),
                Role.CLIENT
        );

        User savedUser = userRepository.save(user);
        // Создаём CRM-карточку клиента при регистрации
        clientService.ensureProfile(savedUser);

        RefreshToken refreshToken = refreshTokenService.create(savedUser);
        return response(savedUser, refreshToken.getToken());
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = (User) authentication.getPrincipal();
        RefreshToken refreshToken = refreshTokenService.create(user);
        return response(user, refreshToken.getToken());
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken refreshToken = refreshTokenService.verify(request.refreshToken());
        User user = refreshToken.getUser();

        RefreshToken newRefreshToken = refreshTokenService.create(user);

        return response(user, newRefreshToken.getToken());
    }

    private AuthResponse response(User user, String refreshToken) {
        return new AuthResponse(
                jwtService.generateAccessToken(user),
                refreshToken,
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }
}