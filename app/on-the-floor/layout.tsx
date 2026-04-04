import "./floor.css";
import { FloorNav } from "@/components/floor-nav";

export default function FloorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="floor-shell">
      <FloorNav />
      {children}
    </div>
  );
}
