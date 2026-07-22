package com.example.zhanfinancebackend.modules.services.service;

import com.example.zhanfinancebackend.modules.services.entity.ServiceEntity;
import com.example.zhanfinancebackend.modules.services.repository.ServiceRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Автоматически заполняет таблицу услуг при старте приложения.
 * Работает одинаково и на H2 (локально), и на PostgreSQL (Fly.io).
 */
@Component
public class ServiceDatabaseSeeder {

    private final ServiceRepository serviceRepository;

    public ServiceDatabaseSeeder(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDatabase() {
        if (serviceRepository.count() > 0) {
            System.out.println("✓ Database already seeded. Skipping services seeding.");
            return;
        }

        System.out.println("▶ Seeding services into database...");

        List<ServiceEntity> services = Arrays.asList(
                createService("Бухгалтерское сопровождение", "Accounting Support", "Полный учёт операций, составление отчётности, контроль финансов.", "Full transaction accounting, reporting, and financial control.", "от 50 000 ₸", true, Arrays.asList("Полный учет операций", "Составление отчетности", "Контроль финансов")),
                createService("Сдача налоговой отчетности", "Tax Reporting", "Своевременная подготовка и сдача всех обязательных форм в налоговую.", "Timely preparation and submission of all mandatory tax forms.", "от 20 000 ₸", true, Arrays.asList("Подготовка и сдача отчетности", "Консультации по налогам", "Работа с налоговыми органами")),
                createService("Кадровый учет и расчет зарплаты", "HR and Payroll", "Ведение кадровых документов, табелей, расчет отпускных и больничных.", "Maintenance of HR documents, timesheets, calculation of vacation and sick pay.", "от 30 000 ₸", true, Arrays.asList("Кадровые документы", "Расчёт зарплаты", "Табели и отпускные")),
                createService("Восстановление бухгалтерского учета", "Accounting Restoration", "Приведём в порядок документы, исправим ошибки и пересдадим отчётность.", "We will sort out documents, fix errors, and resubmit reports.", "от 100 000 ₸", true, Arrays.asList("Анализ прошлых периодов", "Восстановление документов", "Пересдача отчетности")),
                createService("Обработка первичной документации", "Primary Documentation Processing", "Работа с актами, накладными, счетами и внутренней бухгалтерией.", "Working with acts, invoices, bills, and internal accounting.", "от 15 000 ₸", true, Arrays.asList("Обработка актов и накладных", "Ввод первички", "Сверки с контрагентами")),
                createService("Проверка и анализ контрагентов", "Contractor Verification", "Юридическая проверка надежности партнеров и клиентов до сделки.", "Legal verification of reliability of partners and clients before a deal.", "от 10 000 ₸", true, Arrays.asList("Проверка контрагентов", "Анализ рисков", "Рекомендации по сотрудничеству"))
        );

        serviceRepository.saveAll(services);
        System.out.println("✓ Successfully seeded " + services.size() + " services.");
    }

    private ServiceEntity createService(String title, String titleEn, String description, String descriptionEn, String price, boolean isHighlighted, List<String> features) {
        ServiceEntity service = new ServiceEntity(title, description);
        service.setTitleEn(titleEn);
        service.setDescriptionEn(descriptionEn);
        service.setPrice(price);
        service.setIsHighlighted(isHighlighted);
        service.setIsActive(true);
        service.getFeatures().addAll(features);
        return service;
    }
}
