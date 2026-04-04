const workspaces = [
  { label: "Personal", href: "/personal", active: true },
  { label: "On The Floor", href: "/on-the-floor", active: false },
  { label: "Admin", href: "/admin", active: false },
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="hero-kicker">Parkwest Scheduling System</p>
          <h1 className="topbar-title brand-title">Operations, without the white-out.</h1>
        </div>
        <nav className="workspace-switcher" aria-label="Workspace Preview">
          {workspaces.map((workspace) => (
            <a
              key={workspace.href}
              className={`workspace-pill${workspace.active ? " active" : ""}`}
              href={workspace.href}
            >
              {workspace.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="workspace-grid">
        <article className="hero-card">
          <p className="hero-kicker">Mobile First</p>
          <h2 className="hero-title brand-title">Simple, obvious, role-aware scheduling.</h2>
          <p className="hero-copy">
            The foundation is now aligned with the planning docs: one Personal workspace for
            everyone, a dedicated On The Floor workspace for floor men, floor women, and
            management, and a separate Manager/Admin area for import, approval, and oversight.
          </p>
        </article>

        <article className="section-card span-4">
          <h3 className="section-heading">Personal</h3>
          <p className="section-subtitle">
            Self-service schedule, time-off requests, request history, and later open shifts.
          </p>
          <div className="stack">
            <div className="mini-card">
              <p className="mini-label">Priority Screen</p>
              <p className="mini-title">Home</p>
              <p className="mini-copy">Next shift, this week, and request actions at a glance.</p>
            </div>
            <div className="badge-row">
              <span className="badge gold">Dealers</span>
              <span className="badge gold">Cage</span>
              <span className="badge gold">Chip Runners</span>
            </div>
          </div>
        </article>

        <article className="section-card span-4">
          <h3 className="section-heading">On The Floor</h3>
          <p className="section-subtitle">
            Live staffing, attendance actions, roster generation, and floor coverage decisions.
          </p>
          <div className="stack">
            <div className="mini-card">
              <p className="mini-label">Priority Screen</p>
              <p className="mini-title">Now</p>
              <p className="mini-copy">Who should be here now, who called out, and who needs action.</p>
            </div>
            <div className="badge-row">
              <span className="badge success">Floor Men</span>
              <span className="badge success">Floor Women</span>
              <span className="badge success">Management</span>
            </div>
          </div>
        </article>

        <article className="section-card span-4">
          <h3 className="section-heading">Manager/Admin</h3>
          <p className="section-subtitle">
            Employee import, alias mapping, schedule import, approvals, and audit history.
          </p>
          <div className="stack">
            <div className="mini-card">
              <p className="mini-label">Priority Screen</p>
              <p className="mini-title">Overview</p>
              <p className="mini-copy">Pending requests, import readiness, and unresolved issues.</p>
            </div>
            <div className="badge-row">
              <span className="badge warning">Admin Controls</span>
            </div>
          </div>
        </article>

        <article className="section-card span-8">
          <h3 className="section-heading">Implementation Baseline</h3>
          <p className="section-subtitle">
            These are the first routes and technical building blocks created from the planning
            phase so we can start iterating in code instead of only in documents.
          </p>
          <ol className="route-list">
            <li>
              <strong>App Router structure</strong> with dedicated entry points for Personal, On
              The Floor, and Admin.
            </li>
            <li>
              <strong>Shared design tokens</strong> for charcoal, warm white, and gold.
            </li>
            <li>
              <strong>Prisma schema</strong> aligned to alias-based imports and separate live
              attendance tracking.
            </li>
            <li>
              <strong>Workspace-aware copy</strong> so the product language stays consistent with
              the docs.
            </li>
          </ol>
        </article>

        <article className="section-card span-4">
          <h3 className="section-heading">Next Build Steps</h3>
          <p className="section-subtitle">Implementation should continue in this order.</p>
          <ol className="route-list">
            <li>
              <strong>Install dependencies</strong> and generate Prisma client.
            </li>
            <li>
              <strong>Stand up layouts</strong> for each workspace.
            </li>
            <li>
              <strong>Implement employee import</strong> and alias review.
            </li>
            <li>
              <strong>Build schedule import</strong> and publish flow.
            </li>
          </ol>
        </article>
      </section>
    </main>
  );
}
