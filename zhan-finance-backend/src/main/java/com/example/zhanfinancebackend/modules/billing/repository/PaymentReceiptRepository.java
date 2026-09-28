package com.example.zhanfinancebackend.modules.billing.repository;

import com.example.zhanfinancebackend.modules.billing.entity.PaymentReceipt;
import com.example.zhanfinancebackend.modules.billing.entity.PaymentReceiptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentReceiptRepository extends JpaRepository<PaymentReceipt, Long> {

    @Query("SELECT r FROM PaymentReceipt r JOIN FETCH r.client c LEFT JOIN FETCH r.subscription s LEFT JOIN FETCH r.invoice i WHERE r.client.id = :clientId ORDER BY r.createdAt DESC")
    List<PaymentReceipt> findByClientIdOrderByCreatedAtDesc(@Param("clientId") Long clientId);

    @Query("SELECT r FROM PaymentReceipt r JOIN FETCH r.client c LEFT JOIN FETCH r.subscription s LEFT JOIN FETCH r.invoice i WHERE r.status = :status ORDER BY r.createdAt DESC")
    List<PaymentReceipt> findByStatusOrderByCreatedAtDesc(@Param("status") PaymentReceiptStatus status);

    @Query("SELECT r FROM PaymentReceipt r JOIN FETCH r.client c LEFT JOIN FETCH r.subscription s LEFT JOIN FETCH r.invoice i ORDER BY r.createdAt DESC")
    List<PaymentReceipt> findAllWithDetailsOrderByCreatedAtDesc();

    @Query("SELECT r FROM PaymentReceipt r JOIN FETCH r.client c LEFT JOIN FETCH r.subscription s LEFT JOIN FETCH r.invoice i WHERE r.id = :id AND r.client.id = :clientId")
    Optional<PaymentReceipt> findByIdAndClientId(@Param("id") Long id, @Param("clientId") Long clientId);
}
