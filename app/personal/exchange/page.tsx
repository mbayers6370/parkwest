import { OPEN_SHIFT_POSTS } from "@/lib/open-shifts";

export default function PersonalExchangePage() {
  return (
    <main className="personal-content">
      <div className="personal-col-main personal-section personal-full-span">
        <div className="personal-section-header">
          <div>
            <p className="personal-section-kicker">Shift Exchange</p>
            <h2 className="personal-section-title">Open Shifts</h2>
          </div>
        </div>

        <div className="p-card exchange-board-card">
          <div className="p-card-header">
            <p className="p-card-title">Open Shifts</p>
          </div>
          <div className="p-card-body exchange-scroll-body">
            <div className="exchange-list exchange-scroll-list">
              {OPEN_SHIFT_POSTS.map((post) => (
                <div key={post.id} className="exchange-row">
                  <p className="exchange-row-title">{post.title}</p>
                  <p className="exchange-row-time">{post.line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
