package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.dto.AuthResponse;
import com.example.zhanfinancebackend.modules.auth.entity.RefreshToken;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.service.ClientService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Service
public class GoogleAuthService {

    @Value("${google.client.id:249161344734-j51fft6shbogf2clnrhofn3l0c1euihl.apps.googleusercontent.com}")
    private String googleClientId;

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final ClientService clientService;

    public GoogleAuthService(
            UserRepository userRepository,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            ClientService clientService
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.clientService = clientService;
    }

    @Transactional
    public AuthResponse loginWithGoogle(String credential, Role requestedRole) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail().toLowerCase();
                String name = (String) payload.get("name");

                Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(email);
                User user;

                if (optionalUser.isPresent()) {
                    user = optionalUser.get();
                    if (!user.isEnabled()) {
                        throw new ApiException(ErrorCode.UNAUTHORIZED, "Аккаунт еще не активирован администратором");
                    }
                } else {
                    Role assignedRole = requestedRole != null ? requestedRole : Role.CLIENT;
                    boolean isEmployee = assignedRole == Role.EMPLOYEE;

                    user = new User(
                            name != null ? name : "Google User",
                            email,
                            UUID.randomUUID().toString(),
                            assignedRole
                    );
                    
                    if (isEmployee) {
                        user.setEnabled(false);
                    }
                    
                    user = userRepository.save(user);
                    
                    if (!isEmployee) {
                        clientService.ensureProfile(user);
                    } else {
                        return null; // pending approval
                    }
                }

                RefreshToken refreshToken = refreshTokenService.create(user);

                return new AuthResponse(
                        jwtService.generateAccessToken(user),
                        refreshToken.getToken(),
                        "Bearer",
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getRole()
                );
            } else {
                throw new ApiException(ErrorCode.UNAUTHORIZED, "Invalid Google token");
            }
        } catch (Exception e) {
            throw new ApiException(ErrorCode.UNAUTHORIZED, "Google authentication failed: " + e.getMessage());
        }
    }
}
