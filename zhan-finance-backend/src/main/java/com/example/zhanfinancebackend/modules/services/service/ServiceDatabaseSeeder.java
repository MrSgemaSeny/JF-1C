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
                createService("Бухгалтерское сопровождение", "Полный учёт операций, составление отчётности, контроль финансов.", "от 50 000 ₸", true, Arrays.asList("Полный учет операций", "Составление отчетности", "Контроль финансов")),
                createService("Сдача налоговой отчетности", "Своевременная подготовка и сдача всех обязательных форм в налоговую.", "от 20 000 ₸", true, Arrays.asList("Подготовка и сдача отчетности", "Консультации по налогам", "Работа с налоговыми органами")),
                createService("Кадровый учет и расчет зарплаты", "Ведение кадровых документов, табелей, расчет отпускных и больничных.", "от 30 000 ₸", true, Arrays.asList("Кадровые документы", "Расчёт зарплаты", "Табели и отпускные")),
                createService("Восстановление бухгалтерского учета", "Приведём в порядок документы, исправим ошибки и пересдадим отчётность.", "от 100 000 ₸", true, Arrays.asList("Анализ прошлых периодов", "Восстановление документов", "Пересдача отчетности")),
                createService("Обработка первичной документации", "Работа с актами, накладными, счетами и внутренней бухгалтерией.", "от 15 000 ₸", true, Arrays.asList("Обработка актов и накладных", "Ввод первички", "Сверки с контрагентами")),
                createService("Проверка и анализ контрагентов", "Юридическая проверка надежности партнеров и клиентов до сделки.", "от 10 000 ₸", true, Arrays.asList("Проверка контрагентов", "Анализ рисков", "Рекомендации по сотрудничеству"))
        );

        serviceRepository.saveAll(services);
        System.out.println("✓ Successfully seeded " + services.size() + " services.");
    }

    private ServiceEntity createService(String title, String description, String price, boolean isHighlighted, List<String> features) {
        ServiceEntity service = new ServiceEntity(title, description);
        service.setPrice(price);
        service.setIsHighlighted(isHighlighted);
        service.setIsActive(true);
        service.getFeatures().addAll(features);
        return service;
    }
}
