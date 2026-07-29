package com.example.zhanfinancebackend.modules.billing.dto;

import java.math.BigDecimal;
import java.util.Map;

public record FinanceSummaryDto(
        BigDecimal totalInvoiced,
        BigDecimal totalPaid,
        BigDecimal totalIssued,
        BigDecimal totalOverdue,
        Map<String, Long> countByStatus,
        Map<String, BigDecimal> amountByStatus
) {}
