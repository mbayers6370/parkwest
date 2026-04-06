import Image from "next/image";
import Link from "next/link";

const workspaces = [
  { label: "Personal", href: "/personal" },
  { label: "On The Floor", href: "/on-the-floor" },
  { label: "Admin", href: "/admin" },
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <header className="landing-topbar">
        <div className="landing-topbar-spacer" />
        <nav className="landing-workspace-links" aria-label="Workspace links">
          {workspaces.map((workspace) => (
            <Link key={workspace.href} href={workspace.href} className="portal-topbar-link">
              {workspace.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="landing-auth-wrap">
        <div className="landing-auth-card">
          <div className="landing-auth-header">
            <div className="landing-auth-brand">
              <Image
                src="/logo2x.png"
                alt="Parkwest Casinos"
                width={220}
                height={67}
                className="landing-auth-logo"
                priority
              />
            </div>
          </div>

          <form className="landing-auth-form">
            <div className="field-stack landing-auth-field">
              <label className="landing-auth-label" htmlFor="landing-employee-id">
                Employee ID
              </label>
              <input
                id="landing-employee-id"
                className="text-input landing-auth-input"
                type="text"
                placeholder="Ex. 15011298"
              />
            </div>

            <div className="field-stack landing-auth-field">
              <label className="landing-auth-label" htmlFor="landing-password">
                Password
              </label>
              <input
                id="landing-password"
                className="text-input landing-auth-input"
                type="password"
                placeholder="••••••••"
              />
            </div>

            <div className="landing-auth-actions">
              <Link href="/personal" className="primary-button landing-auth-submit">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
