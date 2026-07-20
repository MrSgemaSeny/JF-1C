import fs from 'fs';
import docx from 'docx';
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          text: 'ДОГОВОР ОКАЗАНИЯ УСЛУГ № {{DOC_NUMBER}}',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Дата документа: ', bold: true }),
            new TextRun('{{DATE_TODAY}}'),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: '1. СТОРОНЫ', bold: true }),
          ],
        }),
        new Paragraph({
          text: 'Исполнитель: ТОО "Zhan Finance", с одной стороны, и',
        }),
        new Paragraph({
          text: 'Заказчик: {{CLIENT_NAME}} (ИИН/БИН: {{CLIENT_IIN}}), Компания: {{CLIENT_COMPANY}}, в лице уполномоченного представителя, с другой стороны.',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: '2. ПРЕДМЕТ ДОГОВОРА', bold: true }),
          ],
        }),
        new Paragraph({
          text: 'Исполнитель обязуется оказать Заказчику услугу "{{TASK_SERVICE}}" в рамках задачи: "{{TASK_TITLE}}".',
        }),
        new Paragraph({
          text: 'Описание: {{TASK_DESCRIPTION}}',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: '3. СТОИМОСТЬ И СРОКИ', bold: true }),
          ],
        }),
        new Paragraph({
          text: 'Сумма к оплате составляет: {{TASK_AMOUNT}} тенге.',
        }),
        new Paragraph({
          text: 'Срок выполнения работ: до {{TASK_DEADLINE}} года.',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: '4. РЕКВИЗИТЫ', bold: true }),
          ],
        }),
        new Paragraph({
          text: 'Исполнитель: ТОО "Zhan Finance"',
        }),
        new Paragraph({
          text: 'Заказчик: {{CLIENT_NAME}}',
        }),
        new Paragraph({
          text: 'Телефон: {{CLIENT_PHONE}}',
        }),
        new Paragraph({
          text: 'Email: {{CLIENT_EMAIL}}',
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('C:/Users/murat/Desktop/Шаблон_договора_пример.docx', buffer);
  console.log('Document created successfully');
});
