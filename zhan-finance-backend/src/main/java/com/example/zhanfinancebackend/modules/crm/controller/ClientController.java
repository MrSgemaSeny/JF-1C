package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.ClientDto;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeDto;
import com.example.zhanfinancebackend.modules.crm.service.ClientService;
import com.example.zhanfinancebackend.modules.crm.service.CrmAccessService;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/crm/clients")
public class ClientController {

    private final ClientService clientService;
    private final CrmAccessService accessService;
    private final UserRepository userRepository;

    public ClientController(ClientService clientService, CrmAccessService accessService, UserRepository userRepository) {
        this.clientService = clientService;
        this.accessService = accessService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<List<ClientDto>> getClients(@AuthenticationPrincipal UserPrincipal principal) {

        User user = principal.getUser();
        if (user.getRole() == Role.ADMIN) {
            return ApiResponse.success(clientService.getAllClients());
        }
        return ApiResponse.success(clientService.getClientsForEmployee(user));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<ClientDto> getClient(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        ClientDto clientDto = clientService.getClient(id);
        User clientUser = clientService.getClientProfileEntity(id).getUser();
        accessService.assertCanReadClient(principal.getUser(), clientUser);
        
        return ApiResponse.success(clientDto);
    }
    
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> assignEmployee(
            @PathVariable Long id,
            @RequestParam Long employeeId
    ) {
        // id is profile ID. Let's find user ID from it.
        Long userId = clientService.getClientProfileEntity(id).getUser().getId();
        clientService.assignEmployeeToClient(userId, employeeId);
        return ApiResponse.success(null);
    }
}
