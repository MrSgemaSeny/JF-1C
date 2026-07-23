package com.example.zhanfinancebackend.modules.documents.config;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.documents.entity.DocumentTemplate;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentTemplateRepository;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import org.apache.poi.xwpf.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;

@Component
public class OfficialDocumentTemplateSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(OfficialDocumentTemplateSeeder.class);

    private final DocumentTemplateRepository templateRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;

    public OfficialDocumentTemplateSeeder(DocumentTemplateRepository templateRepository,
                                         StorageService storageService,
                                         UserRepository userRepository) {
        this.templateRepository = templateRepository;
        this.storageService = storageService;
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        User admin = userRepository.findAll().stream().findFirst().orElse(null);

        // 1. Act of Completed Works (Form R-1 RK)
        createTemplateIfAbsent(
                "Акт выполненных работ (Форма Р-1 РК)",
                "Официальная форма Р-1 утверждена МФ РК для акта приём-передачи оказанных услуг",
                admin,
                generateFormR1Docx()
        );

        // 2. Report of Rendered Services
        createTemplateIfAbsent(
                "Отчет об оказанных услугах (Приложение к АВР)",
                "Подробный отчет о выполненных бухгалтерских и юридических работах по задаче",
                admin,
                generateServicesReportDocx()
        );

        // 3. Client Approval and Signature Sheet
        createTemplateIfAbsent(
                "Лист согласования и подписи клиента",
                "Официальный протокол подтверждения приема оказанных услуг клиентом",
                admin,
                generateApprovalSheetDocx()
        );
    }

    private void createTemplateIfAbsent(String name, String description, User admin, byte[] docxBytes) {
        if (templateRepository.findAll().stream().anyMatch(t -> name.equalsIgnoreCase(t.getName()))) {
            return;
        }
        try {
            String storageKey = storageService.store(
                    docxBytes,
                    name.replaceAll("[^a-zA-Z0-9_-]", "_") + ".docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );
            DocumentTemplate template = new DocumentTemplate(name, description, storageKey, admin);
            templateRepository.save(template);
            log.info("Successfully seeded official document template: {}", name);
        } catch (Exception e) {
            log.error("Failed to seed document template {}: {}", name, e.getMessage());
        }
    }

    private byte[] generateFormR1Docx() throws Exception {
        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XWPFParagraph header = doc.createParagraph();
            header.setAlignment(ParagraphAlignment.RIGHT);
            XWPFRun rHeader = header.createRun();
            rHeader.setText("Приложение 50 к приказу Министра финансов РК");
            rHeader.setFontSize(9);

            XWPFParagraph title = doc.createParagraph();
            title.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun rTitle = title.createRun();
            rTitle.setText("АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)");
            rTitle.setBold(true);
            rTitle.setFontSize(14);

            XWPFParagraph subTitle = doc.createParagraph();
            subTitle.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun rSub = subTitle.createRun();
            rSub.setText("Форма Р-1 № {{DOC_NUMBER}} от {{DATE_TODAY}} года");
            rSub.setFontSize(11);

            XWPFParagraph p1 = doc.createParagraph();
            XWPFRun rP1 = p1.createRun();
            rP1.setText("Исполнитель: ТОО \"Zhan Finance\" (БИН: 220340012345, АО \"Kaspi Bank\", БИК: KASPKSKX, ИИК: KZ123456789012345678)\n");
            rP1.setText("Заказчик: {{CLIENT_COMPANY}} / {{CLIENT_NAME}} (ИИН/БИН: {{CLIENT_IIN}}, Email: {{CLIENT_EMAIL}}, Тел: {{CLIENT_PHONE}})\n");
            rP1.setText("Договор оказания услуг: № {{DOC_NUMBER}} от {{DATE_TODAY_SHORT}}\n");

            // Table of services
            XWPFTable table = doc.createTable(2, 5);
            XWPFTableRow headerRow = table.getRow(0);
            headerRow.getCell(0).setText("№");
            headerRow.getCell(1).setText("Наименование работ (услуг)");
            headerRow.getCell(2).setText("Дата выполнения");
            headerRow.getCell(3).setText("Кол-во");
            headerRow.getCell(4).setText("Сумма (тенге)");

            XWPFTableRow dataRow = table.getRow(1);
            dataRow.getCell(0).setText("1");
            dataRow.getCell(1).setText("{{TASK_SERVICE}} — {{TASK_TITLE}}");
            dataRow.getCell(2).setText("{{DATE_TODAY_SHORT}}");
            dataRow.getCell(3).setText("1");
            dataRow.getCell(4).setText("{{TASK_AMOUNT}}");

            XWPFParagraph pFooter = doc.createParagraph();
            XWPFRun rFoot = pFooter.createRun();
            rFoot.setText("\nИтого оказано услуг на сумму: {{TASK_AMOUNT}} тенге.\n");
            rFoot.setText("Работы (услуги) выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.\n\n");

            // Signatures table
            XWPFTable sigTable = doc.createTable(1, 2);
            sigTable.getRow(0).getCell(0).setText("Сдал (Исполнитель):\n\n__________________ / Директор ТОО Zhan Finance\nМ.П.");
            sigTable.getRow(0).getCell(1).setText("Принял (Заказчик):\n\n__________________ / {{CLIENT_NAME}}\nМ.П.");

            doc.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generateServicesReportDocx() throws Exception {
        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XWPFParagraph title = doc.createParagraph();
            title.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun rTitle = title.createRun();
            rTitle.setText("ОТЧЕТ ОБ ОКАЗАННЫХ УСЛУГАХ");
            rTitle.setBold(true);
            rTitle.setFontSize(14);

            XWPFParagraph subTitle = doc.createParagraph();
            subTitle.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun rSub = subTitle.createRun();
            rSub.setText("к Договору № {{DOC_NUMBER}} от {{DATE_TODAY}}");
            rSub.setFontSize(11);

            XWPFParagraph p1 = doc.createParagraph();
            XWPFRun rP1 = p1.createRun();
            rP1.setText("Клиент: {{CLIENT_COMPANY}} ({{CLIENT_NAME}})\n");
            rP1.setText("Направление услуг: {{TASK_SERVICE}}\n");
            rP1.setText("Задание: {{TASK_TITLE}}\n");
            rP1.setText("Описание выполненных работ: {{TASK_DESCRIPTION}}\n");
            rP1.setText("Стоимость обслуживания: {{TASK_AMOUNT}} тенге\n");

            XWPFParagraph pSig = doc.createParagraph();
            XWPFRun rSig = pSig.createRun();
            rSig.setText("\nОтчет составил специалист ТОО Zhan Finance: _______________\n");
            rSig.setText("Отчет принял Заказчик {{CLIENT_NAME}}: _______________\n");

            doc.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generateApprovalSheetDocx() throws Exception {
        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XWPFParagraph title = doc.createParagraph();
            title.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun rTitle = title.createRun();
            rTitle.setText("ЛИСТ СОГЛАСОВАНИЯ И ПОДТВЕРЖДЕНИЯ УСЛУГ");
            rTitle.setBold(true);
            rTitle.setFontSize(14);

            XWPFParagraph p1 = doc.createParagraph();
            XWPFRun rP1 = p1.createRun();
            rP1.setText("Настоящим Клиент {{CLIENT_NAME}} ({{CLIENT_COMPANY}}) подтверждает получение и согласование документов по задаче \"{{TASK_TITLE}}\".\n");
            rP1.setText("Дата согласования: {{DATE_TODAY}}\n");
            rP1.setText("Статус подписи: Электронно подтверждено в CRM Zhan Finance.\n\n");
            rP1.setText("Подпись Клиента: __________________\n");

            doc.write(out);
            return out.toByteArray();
        }
    }
}
