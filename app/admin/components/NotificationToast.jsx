
import { AlertTriangle, AlertCircle, Bell } from "lucide-react";

export default function NotificationToast({ title, message, severity }) {
  const isCritical = severity === "critical";

  return (
    <div className="notif-toast">
      <div className={`notif-toast__icon ${isCritical ? "critical" : "high"}`}>
        {isCritical ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
      </div>
      <div className="notif-toast__body">
        <div className="notif-toast__title">
          <Bell size={14} />
          <span>{title}</span>
        </div>
        {message && <div className="notif-toast__msg">{message}</div>}
      </div>
    </div> 
  );
}
