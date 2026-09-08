package com.example.zhanfinancebackend.modules.billing.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Map;

@Service
public class PdfGeneratorService {

    private final TemplateEngine templateEngine;

    public PdfGeneratorService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public byte[] generatePdf(String templateName, Map<String, Object> data) {
        Context context = new Context();
        context.setVariables(data);
        
        // Render Thymeleaf template to HTML string
        String htmlContent = templateEngine.process(templateName, context);
        
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            
            // Register Arial font to support Cyrillic characters if present in classpath
            InputStream fontCheck = PdfGeneratorService.class.getResourceAsStream("/fonts/arial.ttf");
            if (fontCheck != null) {
                try {
                    fontCheck.close();
                } catch (Exception ignored) {}
                builder.useFont(() -> PdfGeneratorService.class.getResourceAsStream("/fonts/arial.ttf"), "Arial");
            }
            
            builder.withHtmlContent(htmlContent, "/");
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}
