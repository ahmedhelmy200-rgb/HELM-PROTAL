import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, CalendarDays, CheckSquare, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";

const typeIcons = {
  "جلسة": CalendarDays,
  "مهمة": CheckSquare,
  "مستند": FileText,
  "عام": Bell,
};

const typeColors = {
  "جلسة": "bg-primary/10 text-primary",
  "مهمة": "bg-warning/10 text-warning",
  "مستند": "bg-success/10 text-success",
  "عام": "bg-muted text-muted-foreground",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);
    const notifs = await base44.entities.Notification.filter({ user_email: u.email }, "-created_date");
    setNotifications(notifs);
    setLoading(false);
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id) => {
    await base44.entities.Notification.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="التنبيهات"
        subtitle={unreadCount > 0 ? `${unreadCount} تنبيه غير مقروء` : "جميع التنبيهات مقروءة"}
        action={unreadCount > 0 && (
          <Button onClick={markAllRead} variant="outline" size="sm" className="gap-2">
            <CheckCheck className="h-4 w-4" />
            تعيين الكل كمقروء
          </Button>
        )}
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="لا توجد تنبيهات" description="ستظهر هنا تذكيرات الجلسات والمهام تلقائياً" />
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Card key={notif.id} className={`p-4 flex items-start gap-4 transition-all ${!notif.is_read ? "border-primary/30 bg-primary/5" : ""}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[notif.type] || typeColors["عام"]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{notif.title}</p>
                    {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                  {notif.created_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notif.created_date), "yyyy/MM/dd - HH:mm")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {!notif.is_read && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => markRead(notif.id)}>
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteNotif(notif.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}