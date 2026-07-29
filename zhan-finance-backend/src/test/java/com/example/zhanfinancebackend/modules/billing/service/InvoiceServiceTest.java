package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.audit.service.AuditService;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.billing.dto.FinanceSummaryDto;
import com.example.zhanfinancebackend.modules.billing.dto.InvoiceDto;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice.InvoiceStatus;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private UserRepository userRepository;
    @Mock private InvoiceAccessService invoiceAccessService;
    @Mock private AuditService auditService;

    @InjectMocks
    private InvoiceService invoiceService;

    private User admin;
    private User client;
    private Invoice invoice;

    @BeforeEach
    void setUp() {
        admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);

        client = new User();
        client.setId(2L);
        client.setEmail("client@test.com");
        client.setRole(Role.CLIENT);

        invoice = new Invoice(client, "Консультационные услуги", new BigDecimal("50000.00"), LocalDate.now().plusDays(10));
        invoice.setId(100L);
    }

    @Test
    @DisplayName("Создание счета админом успешно логируется и сохраняется")
    void testCreateInvoice_Success() {
        InvoiceDto request = new InvoiceDto(null, 2L, "Консультационные услуги", new BigDecimal("50000.00"), InvoiceStatus.DRAFT, LocalDate.now().plusDays(10));

        when(userRepository.findById(2L)).thenReturn(Optional.of(client));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> {
            Invoice inv = i.getArgument(0);
            inv.setId(100L);
            return inv;
        });

        InvoiceDto result = invoiceService.create(admin, request);

        assertNotNull(result);
        assertEquals("Консультационные услуги", result.title());
        assertEquals(new BigDecimal("50000.00"), result.amount());
        verify(auditService, times(1)).logAction(eq("CREATE"), eq("Invoice"), eq(100L), anyString());
    }

    @Test
    @DisplayName("Расчет финансовой сводки подсчитывает оплаченные и просроченные счета")
    void testGetFinanceSummary_CalculatesCorrectly() {
        InvoiceRepository.InvoiceStatusSummary rowPaid = mock(InvoiceRepository.InvoiceStatusSummary.class);
        when(rowPaid.getStatus()).thenReturn(Invoice.InvoiceStatus.PAID);
        when(rowPaid.getCount()).thenReturn(2L);
        when(rowPaid.getTotalAmount()).thenReturn(new BigDecimal("100000.00"));

        InvoiceRepository.InvoiceStatusSummary rowOverdue = mock(InvoiceRepository.InvoiceStatusSummary.class);
        when(rowOverdue.getStatus()).thenReturn(Invoice.InvoiceStatus.OVERDUE);
        when(rowOverdue.getCount()).thenReturn(1L);
        when(rowOverdue.getTotalAmount()).thenReturn(new BigDecimal("30000.00"));

        when(invoiceRepository.getFinanceSummaryByStatus()).thenReturn(List.of(rowPaid, rowOverdue));

        FinanceSummaryDto summary = invoiceService.getFinanceSummary();

        assertNotNull(summary);
        assertEquals(new BigDecimal("100000.00"), summary.totalPaid());
        assertEquals(new BigDecimal("30000.00"), summary.totalOverdue());
        assertEquals(new BigDecimal("130000.00"), summary.totalInvoiced());
    }
}
