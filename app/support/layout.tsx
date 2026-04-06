import "../admin/admin.css";
import "./support.css";
import { SupportNav } from "@/components/support-nav";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <SupportNav />
      <div className="admin-main">{children}</div>
    </div>
  );
}
