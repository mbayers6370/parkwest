import "./personal.css";
import { PersonalNav } from "@/components/personal-nav";

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="personal-shell">
      <PersonalNav />
      {children}
    </div>
  );
}
