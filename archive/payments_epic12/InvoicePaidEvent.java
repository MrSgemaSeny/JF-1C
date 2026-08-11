package com.example.zhanfinancebackend.modules.billing.event;

import org.springframework.context.ApplicationEvent;

public class InvoicePaidEvent extends ApplicationEvent {
    private final Long invoiceId;
    private final Long subscriptionId;

    public InvoicePaidEvent(Object source, Long invoiceId, Long subscriptionId) {
        super(source);
        this.invoiceId = invoiceId;
        this.subscriptionId = subscriptionId;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }
}
