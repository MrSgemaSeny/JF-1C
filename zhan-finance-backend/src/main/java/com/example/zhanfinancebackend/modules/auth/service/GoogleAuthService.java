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

import java.io.IOException;
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
        GoogleIdToken idToken;
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            idToken = verifier.verify(credential);
        } catch (IOException | java.security.GeneralSecurityException e) {
            throw new com.example.zhanfinancebackend.common.exception.UnauthorizedException("Google authentication failed: " + e.getMessage());
        }

        if (idToken == null) {
            throw new com.example.zhanfinancebackend.common.exception.UnauthorizedException("Invalid Google token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail().toLowerCase();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(email);
        User user;
        boolean isNewUser;

        if (optionalUser.isPresent()) {
            user = optionalUser.get();
            if (!user.isEnabled()) {
                throw new com.example.zhanfinancebackend.common.exception.UnauthorizedException("Аккаунт ещё не активирован администратором");
            }
            // Update avatar and provider if they login via Google
            boolean updated = false;
            if (picture != null && user.getAvatarUrl() == null) {
                user.setAvatarUrl(picture);
                updated = true;
            }
            if (user.getAuthProvider() != com.example.zhanfinancebackend.modules.auth.entity.AuthProvider.GOOGLE) {
                user.setAuthProvider(com.example.zhanfinancebackend.modules.auth.entity.AuthProvider.GOOGLE);
                updated = true;
            }
            if (updated) {
                user = userRepository.save(user);
            }
            isNewUser = false;
        } else {
            Role assignedRole = requestedRole != null ? requestedRole : Role.CLIENT;
            boolean isEmployee = assignedRole == Role.EMPLOYEE;

            user = new User(
                    name != null ? name : "Google User",
                    email,
                    UUID.randomUUID().toString(),
                    assignedRole
            );
            user.setAuthProvider(com.example.zhanfinancebackend.modules.auth.entity.AuthProvider.GOOGLE);
            if (picture != null) {
                user.setAvatarUrl(picture);
            }

            if (isEmployee) {
                user.setEnabled(false);
            }

            user = userRepository.save(user);

            if (isEmployee) {
                return null; // pending approval
            }

            // New Client: create empty profile (phone/company filled later via onboarding)
            clientService.ensureProfile(user);
            isNewUser = true;
        }

        RefreshToken refreshToken = refreshTokenService.create(user);

        return new AuthResponse(
                jwtService.generateAccessToken(user),
                refreshToken.getToken(),
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                isNewUser,
                user.getAvatarUrl(),
                user.getAuthProvider(),
                user.getLocale()
        );
    }
}

