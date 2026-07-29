package com.example.zhanfinancebackend.modules.billing.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findAllByUser(User user);

    Optional<Invoice> findByIdAndUser(Long id, User user);

    List<Invoice> findAllByUserAssignedEmployee(User employee);

    @Query("select invoice from Invoice invoice join fetch invoice.user client left join fetch client.assignedEmployee")
    List<Invoice> findAllWithClient();

    @Query("select invoice from Invoice invoice join fetch invoice.user client left join fetch client.assignedEmployee where invoice.id = :id")
    Optional<Invoice> findByIdWithClient(Long id);

    List<Invoice> findByStatusAndDueDateBefore(Invoice.InvoiceStatus status, java.time.LocalDate date);

    @Query("SELECT i.status as status, COUNT(i.id) as count, SUM(i.amount) as totalAmount FROM Invoice i GROUP BY i.status")
    List<java.util.Map<String, Object>> getFinanceSummaryByStatus();
}
