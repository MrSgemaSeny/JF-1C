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
            
            // Register Arial font to support Cyrillic characters
            builder.useFont(() -> {
                InputStream is = PdfGeneratorService.class.getResourceAsStream("/fonts/arial.ttf");
                if (is == null) {
                    throw new RuntimeException("Font file arial.ttf not found in resources!");
                }
                return is;
            }, "Arial");
            
            builder.withHtmlContent(htmlContent, "/");
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}
