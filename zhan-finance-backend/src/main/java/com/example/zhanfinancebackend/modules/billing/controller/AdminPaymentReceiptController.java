package com.example.zhanfinancebackend.modules.billing.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.dto.PaymentReceiptDto;
import com.example.zhanfinancebackend.modules.billing.dto.PaymentReceiptReviewRequest;
import com.example.zhanfinancebackend.modules.billing.entity.PaymentReceiptStatus;
import com.example.zhanfinancebackend.modules.billing.service.PaymentReceiptService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/admin/billing/receipts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentReceiptController {

    private final PaymentReceiptService paymentReceiptService;

    public AdminPaymentReceiptController(PaymentReceiptService paymentReceiptService) {
        this.paymentReceiptService = paymentReceiptService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentReceiptDto>>> getAllReceipts(
            @AuthenticationPrincipal User admin,
            @RequestParam(value = "status", required = false) PaymentReceiptStatus status
    ) {
        List<PaymentReceiptDto> receipts = paymentReceiptService.getAllReceipts(admin, status);
        return ResponseEntity.ok(ApiResponse.success(receipts));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<PaymentReceiptDto>> confirmReceipt(
            @AuthenticationPrincipal User admin,
            @PathVariable("id") Long id
    ) {
        PaymentReceiptDto result = paymentReceiptService.confirmReceipt(admin, id);
        return ResponseEntity.ok(ApiResponse.success(result, "Payment receipt confirmed successfully"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<PaymentReceiptDto>> rejectReceipt(
            @AuthenticationPrincipal User admin,
            @PathVariable("id") Long id,
            @Valid @RequestBody(required = false) PaymentReceiptReviewRequest request
    ) {
        String note = request != null ? request.note() : null;
        PaymentReceiptDto result = paymentReceiptService.rejectReceipt(admin, id, note);
        return ResponseEntity.ok(ApiResponse.success(result, "Payment receipt rejected successfully"));
    }
}
