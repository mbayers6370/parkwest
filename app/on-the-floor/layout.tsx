import { FloorNav } from "@/components/floor-nav";
import styles from "./floor.module.css";

export default function FloorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.floorShell}>
      <FloorNav />
      {children}
    </div>
  );
}
