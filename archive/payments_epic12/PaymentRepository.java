package com.example.zhanfinancebackend.modules.billing.repository;

import com.example.zhanfinancebackend.modules.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByProviderTransactionId(String providerTransactionId);
}
