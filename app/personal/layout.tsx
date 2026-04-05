import { PersonalNav } from "@/components/personal-nav";
import shared from "./personal-shared.module.css";

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={shared.personalShell}>
      <PersonalNav />
      {children}
    </div>
  );
}
