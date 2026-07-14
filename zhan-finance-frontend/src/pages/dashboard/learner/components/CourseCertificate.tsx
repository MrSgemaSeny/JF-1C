import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { Download } from 'lucide-react';
import { Spinner } from '@/shared/ui/Spinner';

interface CourseCertificateProps {
  courseTitle: string;
  studentName: string;
  date: string;
}

export function CourseCertificate({ courseTitle, studentName, date }: CourseCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPdf = async () => {
    if (!certificateRef.current) return;
    setIsGenerating(true);
    
    try {
      const element = certificateRef.current;
      const opt = {
        margin: 0,
        filename: `certificate-${courseTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
      };

      // Temporarily show the certificate to capture it
      element.style.display = 'block';
      await html2pdf().from(element).set(opt).save();
      element.style.display = 'none';
    } catch (err) {
      console.error('Error generating PDF', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={downloadPdf} 
        disabled={isGenerating}
        className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shrink-0 flex items-center gap-2 disabled:opacity-50"
      >
        {isGenerating ? <Spinner size="sm" className="text-white" /> : <Download size={18} />}
        Скачать сертификат
      </button>

      {/* Hidden certificate template for PDF generation */}
      <div 
        style={{ display: 'none' }}
      >
        <div 
          ref={certificateRef}
          style={{
            width: '297mm',
            height: '210mm',
            padding: '20mm',
            backgroundColor: '#ffffff',
            backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Border */}
          <div style={{
            position: 'absolute',
            top: '10mm',
            left: '10mm',
            right: '10mm',
            bottom: '10mm',
            border: '2px solid #047857',
            borderRadius: '10px'
          }}></div>

          <div style={{
            position: 'absolute',
            top: '12mm',
            left: '12mm',
            right: '12mm',
            bottom: '12mm',
            border: '1px solid #047857',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h1 style={{ color: '#047857', fontSize: '64px', fontWeight: 'bold', margin: '0 0 20px 0' }}>СЕРТИФИКАТ</h1>
            <p style={{ fontSize: '24px', color: '#6b7280', margin: '0 0 40px 0' }}>об успешном окончании курса</p>
            
            <p style={{ fontSize: '18px', color: '#374151', margin: '0 0 10px 0' }}>Настоящий сертификат подтверждает, что</p>
            <h2 style={{ fontSize: '48px', color: '#111827', margin: '0 0 40px 0', borderBottom: '2px solid #047857', paddingBottom: '10px', minWidth: '400px' }}>
              {studentName}
            </h2>
            
            <p style={{ fontSize: '18px', color: '#374151', margin: '0 0 10px 0' }}>успешно завершил(а) обучение по программе</p>
            <h3 style={{ fontSize: '32px', color: '#047857', margin: '0 0 50px 0' }}>«{courseTitle}»</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 'auto', padding: '0 50px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 5px 0' }}>Дата выдачи</p>
                <p style={{ fontSize: '20px', color: '#111827', margin: 0, borderBottom: '1px solid #111827', paddingBottom: '5px', minWidth: '150px' }}>{date}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 5px 0' }}>Zhan Finance</p>
                <p style={{ fontSize: '20px', color: '#111827', margin: 0, borderBottom: '1px solid #111827', paddingBottom: '5px', minWidth: '150px' }}>_______________</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
