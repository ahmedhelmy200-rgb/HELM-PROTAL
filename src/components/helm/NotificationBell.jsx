import React from "react";
import { base44 } from "@/api/base44Client";
import { format, addHours, differenceInHours } from "date-fns";

export async function checkAndCreateReminders(userEmail) {
  const now = new Date();
  const in24h = addHours(now, 24);
  const in48h = addHours(now, 48);

  const [sessions, tasks, invoices, documents, existingNotifs] = await Promise.all([
    base44.entities.Session.filter({ status: "قادمة" }),
    base44.entities.Task.list(),
    base44.entities.Invoice.list(),
    base44.entities.Document.list(),
    base44.entities.Notification.filter({ user_email: userEmail }),
  ]);

  const existingRefs = new Set(existingNotifs.map(n => `${n.reference_id}_${n.type}_${n.title}`));

  const createNotif = async (data) => {
    const key = `${data.reference_id}_${data.type}_${data.title}`;
    if (!existingRefs.has(key)) {
      await base44.entities.Notification.create({ ...data, is_read: false, user_email: userEmail });
      existingRefs.add(key);
    }
  };

  for (const session of sessions) {
    const sessionDate = new Date(session.session_date);
    if (sessionDate > now && sessionDate <= in24h) {
      await createNotif({ title: "تذكير عاجل: جلسة غداً", message: `جلسة في قضية "${session.case_title}" بتاريخ ${format(sessionDate, "yyyy/MM/dd - HH:mm")} في ${session.court}`, type: "جلسة", reference_id: session.id, reference_type: "Session", due_date: session.session_date });
    }
    if (sessionDate > in24h && sessionDate <= in48h) {
      await createNotif({ title: "تذكير: جلسة بعد غد", message: `تذكير مسبق - جلسة في قضية "${session.case_title}" بتاريخ ${format(sessionDate, "yyyy/MM/dd - HH:mm")} في ${session.court}`, type: "جلسة", reference_id: session.id, reference_type: "Session", due_date: session.session_date });
    }
  }

  for (const task of tasks) {
    if (!task.due_date || task.status === "مكتملة") continue;
    const dueDate = new Date(task.due_date);
    const hoursLeft = differenceInHours(dueDate, now);
    if (hoursLeft >= 0 && hoursLeft <= 24) {
      await createNotif({ title: "مهمة تنتهي قريباً", message: `مهمة "${task.title}" موعدها النهائي ${format(dueDate, "yyyy/MM/dd - HH:mm")}`, type: "مهمة", reference_id: task.id, reference_type: "Task", due_date: task.due_date });
    } else if (hoursLeft < 0 && hoursLeft >= -48) {
      await createNotif({ title: "⚠️ مهمة متأخرة", message: `مهمة "${task.title}" تجاوزت موعدها النهائي منذ ${Math.abs(hoursLeft)} ساعة`, type: "مهمة", reference_id: task.id, reference_type: "Task", due_date: task.due_date });
    }
  }

  for (const invoice of invoices) {
    if (!invoice.due_date) continue;
    if (["مدفوعة", "ملغاة"].includes(invoice.status)) continue;
    const dueDate = new Date(invoice.due_date);
    const hoursLeft = differenceInHours(dueDate, now);
    if (hoursLeft < 0 && hoursLeft >= -72) {
      await createNotif({ title: "فاتورة متأخرة السداد", message: `فاتورة رقم ${invoice.invoice_number || ""} للموكل "${invoice.client_name}" تجاوزت موعد الاستحقاق`, type: "عام", reference_id: invoice.id, reference_type: "Invoice", due_date: invoice.due_date });
    } else if (hoursLeft >= 0 && hoursLeft <= 48) {
      await createNotif({ title: "اقتراب موعد استحقاق فاتورة", message: `فاتورة رقم ${invoice.invoice_number || ""} للموكل "${invoice.client_name}" تستحق خلال ${Math.round(hoursLeft)} ساعة`, type: "عام", reference_id: invoice.id, reference_type: "Invoice", due_date: invoice.due_date });
    }
  }

  for (const doc of documents) {
    if (!doc.submission_deadline) continue;
    if (["مقدم"].includes(doc.status)) continue;
    const deadline = new Date(doc.submission_deadline);
    const hoursLeft = differenceInHours(deadline, now);
    if (hoursLeft >= 0 && hoursLeft <= 48) {
      await createNotif({ title: "موعد تقديم وثيقة قريب", message: `وثيقة "${doc.title}" ${doc.case_title ? `في قضية ${doc.case_title}` : ""} - موعد التقديم ${format(deadline, "yyyy/MM/dd")}`, type: "مستند", reference_id: doc.id, reference_type: "Document", due_date: doc.submission_deadline });
    }
  }
}
