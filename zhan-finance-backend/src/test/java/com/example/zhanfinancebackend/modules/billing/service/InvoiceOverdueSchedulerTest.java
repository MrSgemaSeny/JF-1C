package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceOverdueSchedulerTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private InvoiceOverdueScheduler scheduler;

    @Test
    @DisplayName("markOverdueInvoices() вызывается с правильными статусами и тегущей датой Asia/Almaty")
    void testMarkOverdueInvoices_ExecutesBulkUpdate() {
        when(invoiceRepository.bulkUpdateInvoiceStatus(
                eq(Invoice.InvoiceStatus.ISSUED),
                eq(Invoice.InvoiceStatus.OVERDUE),
                any(LocalDate.class)
        )).thenReturn(3);

        scheduler.markOverdueInvoices();

        verify(invoiceRepository).bulkUpdateInvoiceStatus(
                eq(Invoice.InvoiceStatus.ISSUED),
                eq(Invoice.InvoiceStatus.OVERDUE),
                any(LocalDate.class)
        );
    }
}
