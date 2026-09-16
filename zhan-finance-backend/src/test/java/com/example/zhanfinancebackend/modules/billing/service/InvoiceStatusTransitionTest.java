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
                42L, admin.getId(), "Test Invoice", new BigDecimal("100.00"),
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
                43L, admin.getId(), "Canceled Invoice", new BigDecimal("200.00"),
                Invoice.InvoiceStatus.ISSUED, LocalDate.now().plusDays(5)
        );

        assertThrows(UnprocessableEntityException.class, () -> invoiceService.update(admin, 43L, updateReq));
    }

    @Test
    @DisplayName("Попытка изменить поля (title/amount) оплаченного счета вызывает UnprocessableEntityException")
    void updateInvoice_ModifyPaidFields_ThrowsUnprocessableEntity() {
        when(invoiceRepository.findByIdWithClient(42L)).thenReturn(Optional.of(paidInvoice));

        InvoiceDto updateReq = new InvoiceDto(
                42L, admin.getId(), "New Title", new BigDecimal("999.00"),
                Invoice.InvoiceStatus.PAID, LocalDate.now().plusDays(5)
        );

        assertThrows(UnprocessableEntityException.class, () -> invoiceService.update(admin, 42L, updateReq));
    }

    @Test
    @DisplayName("Попытка удалить оплаченный счет вызывает UnprocessableEntityException")
    void deleteInvoice_Paid_ThrowsUnprocessableEntity() {
        when(invoiceRepository.findByIdWithClient(42L)).thenReturn(Optional.of(paidInvoice));

        assertThrows(UnprocessableEntityException.class, () -> invoiceService.delete(admin, 42L));
    }

    @Test
    @DisplayName("Попытка удалить отмененный счет вызывает UnprocessableEntityException")
    void deleteInvoice_Canceled_ThrowsUnprocessableEntity() {
        Invoice canceledInvoice = new Invoice(admin, "Canceled", new BigDecimal("100.00"), LocalDate.now().plusDays(5));
        canceledInvoice.setId(44L);
        canceledInvoice.setStatus(Invoice.InvoiceStatus.CANCELED);
        when(invoiceRepository.findByIdWithClient(44L)).thenReturn(Optional.of(canceledInvoice));

        assertThrows(UnprocessableEntityException.class, () -> invoiceService.delete(admin, 44L));
    }

    @Test
    @DisplayName("Прямой переход DRAFT -> PAID недопустим без выставления счета (ISSUED)")
    void updateInvoice_DraftToPaid_ThrowsUnprocessableEntity() {
        Invoice draftInvoice = new Invoice(admin, "Draft", new BigDecimal("100.00"), LocalDate.now().plusDays(5));
        draftInvoice.setId(45L);
        draftInvoice.setStatus(Invoice.InvoiceStatus.DRAFT);
        when(invoiceRepository.findByIdWithClient(45L)).thenReturn(Optional.of(draftInvoice));

        InvoiceDto updateReq = new InvoiceDto(
                45L, admin.getId(), "Draft", new BigDecimal("100.00"),
                Invoice.InvoiceStatus.PAID, LocalDate.now().plusDays(5)
        );

        assertThrows(UnprocessableEntityException.class, () -> invoiceService.update(admin, 45L, updateReq));
    }

    @Test
    @DisplayName("Корректный переход DRAFT -> ISSUED -> PAID разрешен")
    void updateInvoice_ValidTransitions_Success() {
        Invoice draftInvoice = new Invoice(admin, "Draft", new BigDecimal("100.00"), LocalDate.now().plusDays(5));
        draftInvoice.setId(46L);
        draftInvoice.setStatus(Invoice.InvoiceStatus.DRAFT);
        when(invoiceRepository.findByIdWithClient(46L)).thenReturn(Optional.of(draftInvoice));

        InvoiceDto issuedReq = new InvoiceDto(
                46L, admin.getId(), "Draft", new BigDecimal("100.00"),
                Invoice.InvoiceStatus.ISSUED, LocalDate.now().plusDays(5)
        );

        InvoiceDto result = invoiceService.update(admin, 46L, issuedReq);
        assertEquals(Invoice.InvoiceStatus.ISSUED, result.status());

        InvoiceDto paidReq = new InvoiceDto(
                46L, admin.getId(), "Draft", new BigDecimal("100.00"),
                Invoice.InvoiceStatus.PAID, LocalDate.now().plusDays(5)
        );

        InvoiceDto paidResult = invoiceService.update(admin, 46L, paidReq);
        assertEquals(Invoice.InvoiceStatus.PAID, paidResult.status());
    }
}
