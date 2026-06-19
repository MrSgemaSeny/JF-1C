package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.dto.UserDto;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.ClientDto;
import com.example.zhanfinancebackend.modules.crm.entity.ClientProfile;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.List;

@Service
public class ClientService {

    private final ClientProfileRepository clientProfileRepository;
    private final UserRepository userRepository;

    public ClientService(ClientProfileRepository clientProfileRepository, UserRepository userRepository) {
        this.clientProfileRepository = clientProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ClientDto> getAllClients() {
        return clientProfileRepository.findAllWithUser().stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ClientDto> getClientsForEmployee(User employee) {
        return clientProfileRepository.findAllByUserAssignedEmployee(employee).stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public ClientDto getClient(Long id) {
        return clientProfileRepository.findByIdWithUser(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Client profile not found"));
    }

    @Transactional(readOnly = true)
    public ClientProfile getClientProfileEntity(Long id) {
        return clientProfileRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Client profile not found"));
    }

    @Transactional
    public void assignEmployeeToClient(Long clientId, Long employeeId) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Client not found"));
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Employee not found"));

        client.setAssignedEmployee(employee);
        userRepository.save(client);
    }

    @Transactional
    public ClientDto updateClientProfile(Long userId, String companyName, String phone, String notes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        ClientProfile profile = clientProfileRepository.findByUser(user).orElseGet(() -> new ClientProfile(user));
        profile.setCompanyName(companyName);
        profile.setPhone(phone);
        profile.setNotes(notes);

        return mapToDto(clientProfileRepository.save(profile));
    }

    public ClientDto mapToDto(ClientProfile profile) {
        if (profile == null) return null;
        return new ClientDto(
                profile.getId(),
                mapUserToDto(profile.getUser()),
                profile.getCompanyName(),
                profile.getPhone(),
                profile.getNotes(),
                profile.getCreatedAt() != null ? profile.getCreatedAt().atZone(ZoneOffset.UTC) : null,
                profile.getUpdatedAt() != null ? profile.getUpdatedAt().atZone(ZoneOffset.UTC) : null
        );
    }

    public UserDto mapUserToDto(User user) {
        if (user == null) return null;
        return new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }
}
