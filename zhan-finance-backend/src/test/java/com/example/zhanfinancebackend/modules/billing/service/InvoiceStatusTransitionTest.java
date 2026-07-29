package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.common.exception.UnprocessableEntityException;
import com.example.zhanfinancebackend.modules.audit.service.AuditService;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.billing.dto.InvoiceDto;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InvoiceStatusTransitionTest {

    private InvoiceService invoiceService;
    private InvoiceRepository invoiceRepository;
    private UserRepository userRepository;
    private InvoiceAccessService invoiceAccessService;
    private AuditService auditService;

    private User admin;
    private Invoice paidInvoice;

    @BeforeEach
    void setUp() {
        invoiceRepository = mock(InvoiceRepository.class);
        userRepository = mock(UserRepository.class);
        invoiceAccessService = mock(InvoiceAccessService.class);
        auditService = mock(AuditService.class);

        invoiceService = new InvoiceService(invoiceRepository, userRepository, invoiceAccessService, auditService);

        admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);

        paidInvoice = new Invoice(admin, "Test Invoice", new BigDecimal("100.00"), LocalDate.now().plusDays(5));
        paidInvoice.setId(42L);
        paidInvoice.setStatus(Invoice.InvoiceStatus.PAID);
    }

    @Test
    @DisplayName("Попытка изменить статус оплаченного счета (PAID -> DRAFT) вызывает UnprocessableEntityException")
    void updateInvoice_PaidToDraft_ThrowsUnprocessableEntity() {
        when(invoiceRepository.findByIdWithClient(42L)).thenReturn(Optional.of(paidInvoice));

        InvoiceDto updateReq = new InvoiceDto(
                42L, admin.getId(), "Updated", new BigDecimal("100.00"),
                Invoice.InvoiceStatus.DRAFT, LocalDate.now().plusDays(5)
        );

        assertThrows(UnprocessableEntityException.class, () -> invoiceService.update(admin, 42L, updateReq));
    }

    @Test
    @DisplayName("Попытка изменить статус отмененного счета (CANCELED -> ISSUED) вызывает UnprocessableEntityException")
    void updateInvoice_CanceledToIssued_ThrowsUnprocessableEntity() {
        Invoice canceledInvoice = new Invoice(admin, "Canceled Invoice", new BigDecimal("200.00"), LocalDate.now().plusDays(5));
        canceledInvoice.setId(43L);
        canceledInvoice.setStatus(Invoice.InvoiceStatus.CANCELED);

        when(invoiceRepository.findByIdWithClient(43L)).thenReturn(Optional.of(canceledInvoice));

        InvoiceDto updateReq = new InvoiceDto(
                43L, admin.getId(), "Updated", new BigDecimal("200.00"),
                Invoice.InvoiceStatus.ISSUED, LocalDate.now().plusDays(5)
        );

        assertThrows(UnprocessableEntityException.class, () -> invoiceService.update(admin, 43L, updateReq));
    }
}
