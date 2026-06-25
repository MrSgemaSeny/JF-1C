package com.example.zhanfinancebackend.modules.auth.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.dto.user.UpdatePasswordRequest;
import com.example.zhanfinancebackend.modules.auth.dto.user.UpdateProfileRequest;
import com.example.zhanfinancebackend.modules.auth.dto.user.UserProfileDto;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.auth.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileDto> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(userService.getMyProfile(principal.getId()));
    }

    @PutMapping("/me")
    public ApiResponse<UserProfileDto> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateProfileRequest request
    ) {
        return ApiResponse.success(userService.updateProfile(principal.getId(), request));
    }

    @PutMapping("/me/password")
    public ApiResponse<Void> updateMyPassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdatePasswordRequest request
    ) {
        userService.updatePassword(principal.getId(), request);
        return ApiResponse.success(null);
    }

    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    public ApiResponse<UserProfileDto> uploadAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file
    ) {
        return ApiResponse.success(userService.uploadAvatar(principal.getId(), file));
    }
}
