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
                "Акт выполненных работ (Форма Р-1)",
                "Официальная форма Р-1 утверждена МФ РК для акта приём-передачи оказанных услуг",
                admin,
                generateFormR1Docx()
        );

        // 2. Report of Rendered Services
        createTemplateIfAbsent(
                "Отчет об оказанных услугах (АВР)",
                "Подробный отчет о выполненных бухгалтерских и юридических работах по задаче",
                admin,
                generateServicesReportDocx()
        );

        // 3. Client Approval and Signature Sheet
        createTemplateIfAbsent(
                "Лист согласования и подписи",
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
            XWPFRun rP1a = p1.createRun();
            rP1a.setText("Исполнитель: ТОО \"Zhan Finance\" (БИН: 220340012345, АО \"Kaspi Bank\", БИК: KASPKSKX, ИИК: KZ123456789012345678)");
            rP1a.addBreak();
            XWPFRun rP1b = p1.createRun();
            rP1b.setText("Заказчик: {{CLIENT_COMPANY}} / {{CLIENT_NAME}} (ИИН/БИН: {{CLIENT_IIN}}, Email: {{CLIENT_EMAIL}}, Тел: {{CLIENT_PHONE}})");
            rP1b.addBreak();
            XWPFRun rP1c = p1.createRun();
            rP1c.setText("Договор оказания услуг: № {{DOC_NUMBER}} от {{DATE_TODAY_SHORT}}");

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
            XWPFRun rFoot1 = pFooter.createRun();
            rFoot1.addBreak();
            rFoot1.setText("Итого оказано услуг на сумму: {{TASK_AMOUNT}} тенге.");
            rFoot1.addBreak();
            XWPFRun rFoot2 = pFooter.createRun();
            rFoot2.setText("Работы (услуги) выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.");
            rFoot2.addBreak();
            rFoot2.addBreak();

            // Signatures table
            XWPFTable sigTable = doc.createTable(1, 2);
            XWPFParagraph sigP1 = sigTable.getRow(0).getCell(0).addParagraph();
            XWPFRun rSig1 = sigP1.createRun();
            rSig1.setText("Сдал (Исполнитель):");
            rSig1.addBreak();
            rSig1.addBreak();
            rSig1.setText("__________________ / Директор ТОО Zhan Finance");
            rSig1.addBreak();
            rSig1.setText("М.П.");

            XWPFParagraph sigP2 = sigTable.getRow(0).getCell(1).addParagraph();
            XWPFRun rSig2 = sigP2.createRun();
            rSig2.setText("Принял (Заказчик):");
            rSig2.addBreak();
            rSig2.addBreak();
            rSig2.setText("__________________ / {{CLIENT_NAME}}");
            rSig2.addBreak();
            rSig2.setText("М.П.");

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
            XWPFRun rP1a = p1.createRun();
            rP1a.setText("Клиент: {{CLIENT_COMPANY}} ({{CLIENT_NAME}})");
            rP1a.addBreak();
            XWPFRun rP1b = p1.createRun();
            rP1b.setText("Направление услуг: {{TASK_SERVICE}}");
            rP1b.addBreak();
            XWPFRun rP1c = p1.createRun();
            rP1c.setText("Задание: {{TASK_TITLE}}");
            rP1c.addBreak();
            XWPFRun rP1d = p1.createRun();
            rP1d.setText("Описание выполненных работ: {{TASK_DESCRIPTION}}");
            rP1d.addBreak();
            XWPFRun rP1e = p1.createRun();
            rP1e.setText("Стоимость обслуживания: {{TASK_AMOUNT}} тенге");

            XWPFParagraph pSig = doc.createParagraph();
            XWPFRun rSig1 = pSig.createRun();
            rSig1.addBreak();
            rSig1.setText("Отчет составил специалист ТОО Zhan Finance: _______________");
            rSig1.addBreak();
            XWPFRun rSig2 = pSig.createRun();
            rSig2.setText("Отчет принял Заказчик {{CLIENT_NAME}}: _______________");

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
            XWPFRun rP1a = p1.createRun();
            rP1a.setText("Настоящим Клиент {{CLIENT_NAME}} ({{CLIENT_COMPANY}}) подтверждает получение и согласование документов по задаче \"{{TASK_TITLE}}\".");
            rP1a.addBreak();
            XWPFRun rP1b = p1.createRun();
            rP1b.setText("Дата согласования: {{DATE_TODAY}}");
            rP1b.addBreak();
            XWPFRun rP1c = p1.createRun();
            rP1c.setText("Статус подписи: Электронно подтверждено в CRM Zhan Finance.");
            rP1c.addBreak();
            rP1c.addBreak();
            XWPFRun rP1d = p1.createRun();
            rP1d.setText("Подпись Клиента: __________________");

            doc.write(out);
            return out.toByteArray();
        }
    }
}
