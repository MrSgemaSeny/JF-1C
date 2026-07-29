package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
public class InvoiceOverdueScheduler {

    private static final Logger log = LoggerFactory.getLogger(InvoiceOverdueScheduler.class);
    private final InvoiceRepository invoiceRepository;

    public InvoiceOverdueScheduler(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    // Run every day at 1:00 AM
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void markOverdueInvoices() {
        log.info("Checking for overdue ISSUED invoices...");
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Almaty"));
        int updatedCount = invoiceRepository.bulkUpdateInvoiceStatus(Invoice.InvoiceStatus.ISSUED, Invoice.InvoiceStatus.OVERDUE, today);

        if (updatedCount > 0) {
            log.info("Updated {} overdue invoices to OVERDUE status.", updatedCount);
        } else {
            log.info("No overdue invoices found.");
        }
    }
}
