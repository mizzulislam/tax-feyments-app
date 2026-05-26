import { TaxReportData } from '@/hooks/useFetchReports';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { useCreateBillingCode } from '@/hooks/useBillingCodes';
import { buildBillingVerificationPayload } from '@/lib/billingGenerator';

export default function TaxHistoryTable({ data }: { data: TaxReportData[] }) {
  const createBilling = useCreateBillingCode();
  
  const getStatusBadge = (status: TaxReportData['status']) => {
    const baseClass = "px-3 py-1.5 text-xs font-bold rounded-full tracking-wider uppercase inline-flex items-center gap-2 shadow-sm backdrop-blur-md";
    switch (status) {
      case 'draft':
        return `${baseClass} bg-orange-500/10 text-orange-400 border border-orange-500/20`;
      case 'submitted':
        return `${baseClass} bg-blue-500/10 text-blue-400 border border-blue-500/20`;
      case 'paid':
        return `${baseClass} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`;
      case 'overdue':
        return `${baseClass} bg-red-500/10 text-red-400 border border-red-500/20`;
      default:
        return `${baseClass} bg-slate-500/10 text-slate-400 border border-slate-500/20`;
    }
  };

  const addDraftWatermark = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setTextColor(226, 232, 240);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('DRAF - BUKAN DOKUMEN RESMI DJP', 105, 150, {
        align: 'center',
        angle: 35,
      });
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(`Tax Feyments App - Halaman ${page} dari ${pageCount}`, 15, 288);
      doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 195, 288, { align: 'right' });
    }
  };

  const handleExportPDF = async (report: TaxReportData) => {
    try {
      const doc = new jsPDF();
      const verificationCode = `TF-${report.tax_year}-${report.tax_period}-${report.id.slice(0, 8).toUpperCase()}`;
      const qrDataUrl = await QRCode.toDataURL(buildBillingVerificationPayload({
        billingCode: verificationCode,
        amount: report.tax_payable,
        reportId: report.id,
      }), { margin: 1, width: 160 });
      
      doc.setFillColor(15, 23, 42); // slate 900
      doc.rect(0, 0, 210, 297, 'F');
      
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 6, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.text('TAX FEYMENTS APP', 20, 44);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(203, 213, 225); // slate 300
      doc.text('Ringkasan Profesional Perhitungan PPh Orang Pribadi', 20, 54);
      doc.text('Simulasi internal untuk pelaporan SPT, bukan bukti resmi DJP.', 20, 62);

      doc.setFillColor(30, 41, 59);
      doc.roundedRect(20, 92, 170, 70, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Identitas Dokumen', 30, 110);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text(`ID Laporan: ${report.id}`, 30, 124);
      doc.text(`Tahun/Masa Pajak: ${report.tax_year} / ${report.tax_period}`, 30, 134);
      doc.text(`Status: ${report.status.toUpperCase()}`, 30, 144);
      doc.text(`Kode Verifikasi: ${verificationCode}`, 30, 154);

      doc.addImage(qrDataUrl, 'PNG', 154, 112, 26, 26);
      doc.setFontSize(10);
      doc.setTextColor(147, 197, 253);
      doc.text('QR Verifikasi', 152, 146);

      doc.setTextColor(226, 232, 240);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`PPh Terutang: Rp ${Number(report.tax_payable).toLocaleString('id-ID')}`, 20, 204);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Penghasilan Bruto: Rp ${Number(report.gross_income).toLocaleString('id-ID')}`, 20, 214);
      doc.text(`Tanggal arsip: ${new Date(report.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 224);

      doc.addPage();
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Detail Perhitungan Pajak', 15, 24);

      autoTable(doc, {
        startY: 36,
        head: [['Komponen', 'Nilai', 'Catatan']],
        body: [
          ['Penghasilan Bruto', `Rp ${Number(report.gross_income).toLocaleString('id-ID')}`, 'Total penghasilan yang menjadi dasar simulasi.'],
          ['PPh Terutang', `Rp ${Number(report.tax_payable).toLocaleString('id-ID')}`, 'Hasil perhitungan engine aplikasi.'],
          ['Tarif Efektif', `${report.gross_income > 0 ? ((report.tax_payable / report.gross_income) * 100).toFixed(2) : '0.00'}%`, 'PPh terutang dibanding penghasilan bruto.'],
          ['Status Laporan', report.status.toUpperCase(), 'Status internal aplikasi.'],
        ],
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        alternateRowStyles: { fillColor: [241, 245, 249] },
      });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Catatan Kepatuhan', 15, 112);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text([
        '1. Simpan bukti potong, dokumen penghasilan, dan bukti pembayaran untuk arsip SPT.',
        '2. Pastikan angka final sesuai dokumen resmi pemberi kerja atau pembukuan usaha.',
        '3. Dokumen ini adalah ringkasan aplikasi, bukan pengganti BPE, SPT, atau kode billing DJP.',
      ], 15, 122);

      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('Visual Ringkasan dan QR', 15, 24);

      const taxRatio = report.gross_income > 0 ? Math.min(report.tax_payable / report.gross_income, 1) : 0;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(20, 52, 170, 18, 3, 3, 'F');
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(20, 52, 170 * taxRatio, 18, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rasio PPh terhadap bruto: ${(taxRatio * 100).toFixed(2)}%`, 20, 82);

      doc.addImage(qrDataUrl, 'PNG', 82, 102, 46, 46);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(verificationCode, 105, 158, { align: 'center' });

      addDraftWatermark(doc);

      doc.save(`Ringkasan_Pajak_${report.tax_year}_${report.tax_period}.pdf`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal.';
      alert('Gagal mengekspor PDF: ' + message);
    }
  };

  const handleCreateBilling = (report: TaxReportData) => {
    createBilling.mutate(report, {
      onSuccess: (billing) => {
        alert(`Kode billing berhasil dibuat: ${billing.billingCode}`);
      },
      onError: (error) => {
        alert(`Gagal membuat billing: ${error.message}`);
      },
    });
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="p-4 md:p-8 border-b border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h3 className="font-bold text-lg md:text-xl text-white tracking-tight">Riwayat Pelaporan</h3>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Pantau arsip kalkulasi, status pengajuan, serta ekspor laporan perpajakan resmi Anda.</p>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-24 px-5 md:px-6 text-center">
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 md:mb-6 shadow-inner">
            <svg className="w-7 h-7 md:w-10 md:h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h4 className="text-base md:text-lg font-medium text-slate-300 mb-2">Belum Ada Dokumen</h4>
          <p className="text-xs md:text-sm text-slate-500 max-w-sm">Mulai simulasi pertama Anda menggunakan panel di samping untuk melihat riwayat tersimpan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-950/50 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/50">
                <th className="p-4 md:p-6 whitespace-nowrap">Tahun / Masa</th>
                <th className="p-4 md:p-6">Penghasilan Bruto</th>
                <th className="p-4 md:p-6">PPh Terutang</th>
                <th className="p-4 md:p-6">Tanggal</th>
                <th className="p-4 md:p-6">Status</th>
                <th className="p-4 md:p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {data.map((report) => (
                <tr key={report.id} className="group hover:bg-slate-800/30 transition-all duration-300">
                  <td className="p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{report.tax_year}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Masa {report.tax_period}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 md:p-6 text-slate-300 font-medium font-mono font-bold">Rp {report.gross_income.toLocaleString('id-ID')}</td>
                  <td className="p-4 md:p-6 font-mono">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-200 font-semibold shadow-inner">
                      Rp {report.tax_payable.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="p-4 md:p-6 text-slate-400">
                    {new Date(report.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td className="p-4 md:p-6">
                    <span className={getStatusBadge(report.status)}>
                      <span className={`w-1.5 h-1.5 rounded-full ${report.status === 'paid' ? 'bg-emerald-400' : report.status === 'draft' ? 'bg-orange-400' : 'bg-blue-400'} animate-pulse`}></span>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4 md:p-6 text-right">
                    <div className="flex justify-end gap-2">
                      {report.status === 'submitted' && (
                        <button
                          onClick={() => handleCreateBilling(report)}
                          disabled={createBilling.isPending}
                          className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all border border-emerald-500/20 inline-flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                          title="Buat Kode Billing"
                        >
                          Billing
                        </button>
                      )}
                      <button
                        onClick={() => handleExportPDF(report)}
                        className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-xl transition-all border border-blue-500/20 inline-flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        title="Unduh Ringkasan Pajak"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
