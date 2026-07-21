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
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
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
    private final com.example.zhanfinancebackend.modules.notifications.service.NotificationService notificationService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            ClientService clientService,
            com.example.zhanfinancebackend.modules.notifications.service.NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.clientService = clientService;
        this.notificationService = notificationService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new com.example.zhanfinancebackend.common.exception.ConflictException(ErrorCode.EMAIL_ALREADY_REGISTERED.name());
        }

        Role assignedRole = request.role() != null ? request.role() : Role.CLIENT;
        boolean isEmployee = assignedRole == Role.EMPLOYEE;

        User user = new User(
                request.fullName(),
                request.email().toLowerCase(),
                passwordEncoder.encode(request.password()),
                assignedRole
        );

        if (isEmployee) {
            user.setEnabled(false);
        }

        User savedUser = userRepository.save(user);

        // Создаём CRM-карточку клиента при регистрации
        clientService.ensureProfile(savedUser, request.companyName(), request.phone());

        if (isEmployee) {
            notificationService.notifyAdmins(
                    "Запрос на регистрацию",
                    savedUser.getFullName() + " (" + savedUser.getEmail() + ") хочет зарегистрироваться как сотрудник. Требуется подтверждение.",
                    "/admin/employees"
            );
            return new AuthResponse(
                    null,
                    null,
                    "Bearer",
                    savedUser.getId(),
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    savedUser.getRole(),
                    false,
                    savedUser.getAvatarUrl(),
                    savedUser.getAuthProvider(),
                    savedUser.getLocale()
            );
        } else {
            notificationService.notifyAdmins(
                    "Новая регистрация",
                    savedUser.getFullName() + " (" + savedUser.getEmail() + ") зарегистрировался как клиент",
                    "/admin/employees"
            );
            RefreshToken refreshToken = refreshTokenService.create(savedUser);
            return response(savedUser, refreshToken.getToken());
        }
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        // Правильно: берём User из UserPrincipal
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();

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
                user.getRole(),
                false,
                user.getAvatarUrl(),
                user.getAuthProvider(),
                user.getLocale()
        );
    }
}
