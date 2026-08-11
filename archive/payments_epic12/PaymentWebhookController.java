package com.example.zhanfinancebackend.modules.billing.controller;

import com.example.zhanfinancebackend.modules.billing.service.KaspiPayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/billing/payments/webhook")
public class PaymentWebhookController {

    private final KaspiPayService kaspiPayService;

    public PaymentWebhookController(KaspiPayService kaspiPayService) {
        this.kaspiPayService = kaspiPayService;
    }

    @PostMapping("/kaspi")
    public ResponseEntity<Void> handleKaspiWebhook(@RequestBody KaspiWebhookDto dto) {
        // In a real scenario, signature validation would happen here.
        kaspiPayService.handleWebhook(dto.transactionId(), dto.invoiceId(), dto.amount(), dto.status());
        return ResponseEntity.ok().build();
    }

    public record KaspiWebhookDto(String transactionId, Long invoiceId, BigDecimal amount, String status) {}
}
