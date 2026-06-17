package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.dto.InvoiceDto;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto> findAll(User user) {
        return invoiceRepository.findAllByUser(user).stream().map(this::toDto).toList();
    }

    @Transactional
    public InvoiceDto create(User user, InvoiceDto request) {
        Invoice invoice = new Invoice(user, request.title(), request.amount(), request.dueDate());
        if (request.status() != null) {
            invoice.setStatus(request.status());
        }
        return toDto(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceDto update(User user, Long id, InvoiceDto request) {
        Invoice invoice = get(user, id);
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
        invoiceRepository.delete(get(user, id));
    }

    private Invoice get(User user, Long id) {
        return invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Invoice not found"));
    }

    private InvoiceDto toDto(Invoice invoice) {
        return new InvoiceDto(
                invoice.getId(),
                invoice.getTitle(),
                invoice.getAmount(),
                invoice.getStatus(),
                invoice.getDueDate()
        );
    }
}
