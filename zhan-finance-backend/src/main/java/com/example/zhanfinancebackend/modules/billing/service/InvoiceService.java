package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.billing.dto.InvoiceDto;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final InvoiceAccessService invoiceAccessService;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            UserRepository userRepository,
            InvoiceAccessService invoiceAccessService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.invoiceAccessService = invoiceAccessService;
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto> findAll(User user) {
        if (user.getRole() == Role.ADMIN) {
            return invoiceRepository.findAllWithClient().stream().map(this::toDto).toList();
        }
        if (user.getRole() == Role.EMPLOYEE) {
            return invoiceRepository.findAllByUserAssignedEmployee(user).stream().map(this::toDto).toList();
        }
        return invoiceRepository.findAllByUser(user).stream().map(this::toDto).toList();
    }

    @Transactional
    public InvoiceDto create(User user, InvoiceDto request) {
        User client = resolveClient(user, request.clientId());
        invoiceAccessService.assertCanCreateFor(user, client);
        Invoice invoice = new Invoice(client, request.title(), request.amount(), request.dueDate());
        if (request.status() != null) {
            invoice.setStatus(request.status());
        }
        return toDto(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceDto update(User user, Long id, InvoiceDto request) {
        Invoice invoice = get(user, id);
        invoiceAccessService.assertCanWrite(user, invoice);
        invoice.setTitle(request.title());
        invoice.setAmount(request.amount());
        invoice.setDueDate(request.dueDate());
        if (request.status() != null) {
            invoice.setStatus(request.status());
        }
        return toDto(invoice);
    }

    @Transactional
    public void delete(User user, Long id) {
        Invoice invoice = get(user, id);
        invoiceAccessService.assertCanWrite(user, invoice);
        invoiceRepository.delete(invoice);
    }

    private Invoice get(User user, Long id) {
        Invoice invoice = invoiceRepository.findByIdWithClient(id)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Invoice not found"));
        invoiceAccessService.assertCanRead(user, invoice);
        return invoice;
    }

    private User resolveClient(User actor, Long clientId) {
        if (clientId == null) {
            return actor;
        }
        return userRepository.findById(clientId)
                .filter(user -> user.getRole() == Role.CLIENT)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Client not found"));
    }

    private InvoiceDto toDto(Invoice invoice) {
        return new InvoiceDto(
                invoice.getId(),
                invoice.getUser().getId(),
                invoice.getTitle(),
                invoice.getAmount(),
                invoice.getStatus(),
                invoice.getDueDate()
        );
    }
}

