package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.billing.dto.InvoiceDto;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import com.example.zhanfinancebackend.modules.audit.service.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final InvoiceAccessService invoiceAccessService;
    private final AuditService auditService;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            UserRepository userRepository,
            InvoiceAccessService invoiceAccessService,
            AuditService auditService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.invoiceAccessService = invoiceAccessService;
        this.auditService = auditService;
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

    @Transactional(readOnly = true)
    public Invoice getInvoiceForPdf(User user, Long id) {
        return get(user, id);
    }

    @Transactional
    public InvoiceDto create(User user, InvoiceDto request) {
        User client = resolveClient(user, request.clientId());
        invoiceAccessService.assertCanCreateFor(user, client);
        Invoice invoice = new Invoice(client, request.title(), request.amount(), request.dueDate());
        if (request.status() != null) {
            invoice.setStatus(request.status());
        }
        Invoice saved = invoiceRepository.save(invoice);
        auditService.logAction("CREATE", "Invoice", saved.getId(), "Invoice created for user " + client.getEmail() + " with amount " + saved.getAmount());
        return toDto(saved);
    }

    @Transactional
    public InvoiceDto update(User user, Long id, InvoiceDto request) {
        Invoice invoice = get(user, id);
        invoiceAccessService.assertCanWrite(user, invoice);
        
        StringBuilder details = new StringBuilder();
        if (!invoice.getTitle().equals(request.title())) {
            details.append("Title changed from '").append(invoice.getTitle()).append("' to '").append(request.title()).append("'; ");
        }
        if (invoice.getAmount().compareTo(request.amount()) != 0) {
            details.append("Amount changed from ").append(invoice.getAmount()).append(" to ").append(request.amount()).append("; ");
        }
        if (!invoice.getDueDate().equals(request.dueDate())) {
            details.append("Due date changed from ").append(invoice.getDueDate()).append(" to ").append(request.dueDate()).append("; ");
        }
        if (request.status() != null && invoice.getStatus() != request.status()) {
            details.append("Status changed from ").append(invoice.getStatus()).append(" to ").append(request.status()).append("; ");
        }
        
        invoice.setTitle(request.title());
        invoice.setAmount(request.amount());
        invoice.setDueDate(request.dueDate());
        if (request.status() != null) {
            invoice.setStatus(request.status());
        }
        
        if (details.length() > 0) {
            auditService.logAction("UPDATE", "Invoice", invoice.getId(), details.toString());
        }
        
        return toDto(invoice);
    }

    @Transactional
    public void delete(User user, Long id) {
        Invoice invoice = get(user, id);
        invoiceAccessService.assertCanWrite(user, invoice);
        auditService.logAction("DELETE", "Invoice", invoice.getId(), "Invoice deleted: " + invoice.getTitle() + " with amount " + invoice.getAmount());
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

