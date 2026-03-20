import React from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";

export default function InvoicePDF({ invoice }) {
  const { appPublicSettings } = useAuth();
  const settings = appPublicSettings || {};
  const primaryColor = settings?.primary_color || "#1d4ed8";
  const subtotal = Math.max(0, (invoice.total_fees || 0) - (invoice.discount || 0));
  const vat = subtotal * ((invoice.vat_rate || 0) / 100);
  const total = subtotal + vat;
  const remaining = Math.max(0, total - (invoice.paid_amount || 0));
  const officeName = settings?.office_name || invoice.office_name || "مكتب المحامي";
  const officePhone = settings?.phone || invoice.office_phone || "";
  const officeAddress = settings?.address || invoice.office_address || "";
  const logoUrl = settings?.logo_url || null;
  const stampUrl = settings?.stamp_url || null;
  const signatureUrl = settings?.signature_url || null;
  const bank_name = settings?.bank_name || "";
  const iban = settings?.iban || "";
  const vat_number = settings?.vat_number || "";
  const currency = settings?.currency || "د.إ";
  const invoice_footer_text = settings?.invoice_footer_text || "شكراً لثقتكم بنا · نتمنى لكم دوام التوفيق والنجاح";
  const invoice_header_text = settings?.invoice_header_text || "";
  const watermarkText = settings?.office_name || officeName || 'HELM LAW';
  const statusColors = {"مدفوعة":"#16a34a","متأخرة":"#dc2626","صادرة":primaryColor,"مسودة":"#6b7280","ملغاة":"#6b7280"};

  return (
    <div id="invoice-print-area" dir="rtl" style={{ fontFamily: "'Cairo', 'Arial', sans-serif", width: "794px", minHeight: "1123px", background: "#fff", color: "#1a1a2e", padding: 0, boxSizing: "border-box", position: "relative", overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.06, transform: 'rotate(-32deg)' }}>
        {logoUrl ? (
          <img src={logoUrl} alt="watermark" style={{ width: '420px', objectFit: 'contain', filter: 'grayscale(1)' }} />
        ) : (
          <div style={{ fontSize: '68px', fontWeight: 900, color: primaryColor, letterSpacing: '0.12em' }}>{watermarkText}</div>
        )}
      </div>

      <div style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`, padding: "32px 48px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: 'relative', zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {logoUrl && <img src={logoUrl} alt="شعار المكتب" style={{ height: "64px", width: "64px", objectFit: "contain", background: "#fff", borderRadius: "12px", padding: "6px" }} />}
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", margin: 0 }}>{officeName}</h1>
            {invoice_header_text && <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.82)", fontSize: "12px" }}>{invoice_header_text}</p>}
            <div style={{ marginTop: "6px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {officePhone && <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>📞 {officePhone}</span>}
              {settings?.email && <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>✉️ {settings.email}</span>}
              {officeAddress && <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>📍 {officeAddress}</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "14px 24px", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "11px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>فاتورة رقم</p>
            <p style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: "bold" }}>{invoice.invoice_number || "---"}</p>
          </div>
          <div style={{ marginTop: "8px", textAlign: "left", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
            <p style={{ margin: "2px 0" }}>📅 {invoice.issue_date ? format(new Date(invoice.issue_date), "yyyy/MM/dd") : "---"}</p>
            {invoice.due_date && <p style={{ margin: "2px 0" }}>⏰ الاستحقاق: {format(new Date(invoice.due_date), "yyyy/MM/dd")}</p>}
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 48px", position: 'relative', zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <div style={{ padding: "8px 20px", borderRadius: "20px", fontSize: "14px", fontWeight: "700", background: `${statusColors[invoice.status] || "#6b7280"}15`, color: statusColors[invoice.status] || "#6b7280", border: `2px solid ${statusColors[invoice.status] || "#6b7280"}40` }}>{invoice.status}</div>
        </div>

        <div style={{ display: "flex", gap: "20px", marginBottom: "28px" }}>
          <div style={{ flex: 1, background: "#f8fafc", borderRadius: "12px", padding: "18px", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>بيانات الموكل</p>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1a1a2e" }}>{invoice.client_name}</p>
          </div>
          {invoice.case_title && <div style={{ flex: 1, background: "#f8fafc", borderRadius: "12px", padding: "18px", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#6b7280", fontWeight: "700" }}>القضية</p>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#1a1a2e" }}>{invoice.case_title}</p>
            {invoice.case_number && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>رقم: {invoice.case_number}</p>}
          </div>}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", borderRadius: "12px", overflow: "hidden" }}>
          <thead><tr style={{ background: primaryColor, color: "#fff" }}><th style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", fontWeight: "bold" }}>#</th><th style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", fontWeight: "bold" }}>البيان</th><th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "bold" }}>المبلغ ({currency})</th></tr></thead>
          <tbody>{invoice.items && invoice.items.length > 0 ? invoice.items.map((item, i) => <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}><td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280", borderBottom: "1px solid #e2e8f0" }}>{i + 1}</td><td style={{ padding: "12px 16px", fontSize: "13px", borderBottom: "1px solid #e2e8f0" }}>{item.description}</td><td style={{ padding: "12px 16px", fontSize: "13px", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>{(item.amount || 0).toLocaleString()}</td></tr>) : <tr style={{ background: "#fff" }}><td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280" }}>1</td><td style={{ padding: "12px 16px", fontSize: "13px" }}>أتعاب المحاماة</td><td style={{ padding: "12px 16px", fontSize: "13px", textAlign: "left" }}>{(invoice.total_fees || 0).toLocaleString()}</td></tr>}</tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'flex-end', gap: '20px', marginBottom: "28px" }}>
          <div style={{ flex: 1 }}>
            {(bank_name || iban) && <div style={{ background: "#f0f9ff", borderRadius: "12px", padding: "16px", border: "1px solid #bae6fd", marginBottom: "16px" }}><p style={{ margin: "0 0 8px", fontSize: "12px", color: "#0369a1", fontWeight: "700" }}>💳 بيانات الدفع البنكي</p><div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px" }}>{bank_name && <span>🏦 البنك: <strong>{bank_name}</strong></span>}{iban && <span>IBAN: <strong>{iban}</strong></span>}{vat_number && <span>الرقم الضريبي: <strong>{vat_number}</strong></span>}</div></div>}
            {invoice.notes && <div style={{ background: "#fffbeb", borderRadius: "12px", padding: "16px", border: "1px solid #fde68a" }}><p style={{ margin: "0 0 8px", fontSize: "12px", color: "#92400e", fontWeight: "700" }}>📝 ملاحظات</p><p style={{ margin: 0, fontSize: "13px", lineHeight: "1.7", color: "#78350f" }}>{invoice.notes}</p></div>}
          </div>
          <div style={{ width: "320px", background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0", fontSize: "13px" }}><span style={{ color: "#6b7280" }}>المجموع الفرعي</span><span style={{ fontWeight: "600" }}>{(invoice.total_fees || 0).toLocaleString()} {currency}</span></div>
            {(invoice.discount || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0", fontSize: "13px" }}><span style={{ color: "#6b7280" }}>الخصم</span><span style={{ color: "#16a34a", fontWeight: "600" }}>- {(invoice.discount || 0).toLocaleString()} {currency}</span></div>}
            {(invoice.vat_rate || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0", fontSize: "13px" }}><span style={{ color: "#6b7280" }}>ضريبة القيمة المضافة ({invoice.vat_rate}%)</span><span style={{ fontWeight: "600" }}>{vat.toLocaleString()} {currency}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `2px solid ${primaryColor}`, fontSize: "16px", fontWeight: "800" }}><span>الإجمالي</span><span style={{ color: primaryColor }}>{total.toLocaleString()} {currency}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0", fontSize: "13px" }}><span style={{ color: "#6b7280" }}>المدفوع</span><span style={{ color: "#16a34a", fontWeight: "600" }}>{(invoice.paid_amount || 0).toLocaleString()} {currency}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", background: remaining > 0 ? "#fef2f2" : "#f0fdf4", borderRadius: "8px", marginTop: "8px", fontSize: "16px", fontWeight: "800" }}><span style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>المتبقي</span><span style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>{remaining.toLocaleString()} {currency}</span></div>
          </div>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${primaryColor}10 0%, ${primaryColor}05 100%)`, borderTop: `3px solid ${primaryColor}`, padding: "18px 48px 24px", textAlign: "center", position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: "13px", color: primaryColor, fontWeight: "700" }}>{invoice_footer_text}</p>
            {invoice.payment_method && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#6b7280" }}>طريقة الدفع: {invoice.payment_method}</p>}
            {settings?.website && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>🌐 {settings.website}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '18px' }}>
            {stampUrl && <img src={stampUrl} alt="ختم المكتب" style={{ maxHeight: '86px', maxWidth: '96px', objectFit: 'contain', opacity: 0.88 }} />}
            {signatureUrl && <img src={signatureUrl} alt="توقيع المكتب" style={{ maxHeight: '64px', maxWidth: '150px', objectFit: 'contain' }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
