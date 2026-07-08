package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.billing.dto.InvoiceDto;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InvoiceAccessService invoiceAccessService;

    @InjectMocks
    private InvoiceService invoiceService;

    private User admin;
    private User client;

    @BeforeEach
    void setUp() {
        admin = mock(User.class);
        lenient().when(admin.getId()).thenReturn(1L);
        lenient().when(admin.getRole()).thenReturn(Role.ADMIN);

        client = mock(User.class);
        lenient().when(client.getId()).thenReturn(2L);
        lenient().when(client.getRole()).thenReturn(Role.CLIENT);
    }

    @Test
    void testFindAllForAdmin() {
        Invoice invoice = new Invoice(client, "Test Invoice", new BigDecimal("100.00"), LocalDate.now());
        org.springframework.test.util.ReflectionTestUtils.setField(invoice, "id", 10L);

        when(invoiceRepository.findAllWithClient()).thenReturn(List.of(invoice));

        List<InvoiceDto> result = invoiceService.findAll(admin);

        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).id());
        assertEquals("Test Invoice", result.get(0).title());
        verify(invoiceRepository).findAllWithClient();
    }

    @Test
    void testCreateInvoice() {
        InvoiceDto request = new InvoiceDto(null, 2L, "New Invoice", new BigDecimal("500.00"), null, LocalDate.now());

        when(userRepository.findById(2L)).thenReturn(Optional.of(client));
        doNothing().when(invoiceAccessService).assertCanCreateFor(admin, client);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice saved = invocation.getArgument(0);
            org.springframework.test.util.ReflectionTestUtils.setField(saved, "id", 100L);
            return saved;
        });

        InvoiceDto result = invoiceService.create(admin, request);

        assertNotNull(result);
        assertEquals(100L, result.id());
        assertEquals("New Invoice", result.title());
        assertEquals(new BigDecimal("500.00"), result.amount());
    }
}
