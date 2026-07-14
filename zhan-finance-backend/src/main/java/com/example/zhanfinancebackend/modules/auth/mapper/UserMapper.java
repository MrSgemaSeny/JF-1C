package com.example.zhanfinancebackend.modules.auth.mapper;

import com.example.zhanfinancebackend.modules.auth.dto.user.UserProfileDto;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeDto;
import com.example.zhanfinancebackend.modules.crm.entity.ClientProfile;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;

@Component
public class UserMapper {

    public EmployeeDto mapToEmployeeDto(User user) {
        if (user == null) return null;
        return new EmployeeDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.isEnabled(),
                user.getCreatedAt() != null ? user.getCreatedAt().atZone(ZoneOffset.UTC) : null
        );
    }

    public UserProfileDto mapToUserProfileDto(User user, ClientProfile clientProfile) {
        if (user == null) return null;

        String phone = null;
        String companyName = null;
        if (clientProfile != null) {
            phone = clientProfile.getPhone();
            companyName = clientProfile.getCompanyName();
        }

        Long assignedEmployeeId = null;
        String assignedEmployeeName = null;
        if (user.getAssignedEmployee() != null) {
            assignedEmployeeId = user.getAssignedEmployee().getId();
            assignedEmployeeName = user.getAssignedEmployee().getFullName();
        }

        return new UserProfileDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                phone,
                companyName,
                user.getAvatarUrl(),
                user.getAuthProvider(),
                assignedEmployeeId,
                assignedEmployeeName,
                user.getLocale()
        );
    }
}
