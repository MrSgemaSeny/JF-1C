package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WebKassaService {

    private static final Logger log = LoggerFactory.getLogger(WebKassaService.class);

    @Value("${webkassa.api.url:https://dev.webkassa.kz/api}")
    private String apiUrl;

    @Value("${webkassa.auth.login:mock}")
    private String login;

    @Value("${webkassa.auth.password:mock}")
    private String password;

    @Value("${webkassa.cashbox-id:123456}")
    private String cashboxId;

    public String issueReceipt(Invoice invoice) {
        log.info("Issuing WebKassa receipt for invoice: {}, amount: {}", invoice.getId(), invoice.getAmount());
        
        // Mocking the receipt URL generation. 
        // In a real scenario, we'd authorize, get a token, and send a check payload.
        String receiptUrl = "https://check.webkassa.kz/mock/" + invoice.getId().toString();
        log.info("Successfully generated WebKassa receipt: {}", receiptUrl);
        return receiptUrl;
    }
}
