export default function Notifications() {
  return (
    <section style={{ maxWidth: 680 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Stay updated</p>
          <h1>Alerts</h1>
        </div>
      </div>

      <div className="panel">
        <div className="empty" style={{ padding: "1.5rem 0.25rem" }}>
          <h3>No notifications yet</h3>
          <p>
            Likes, comments, and follows will show up here when they start coming
            in.
          </p>
        </div>
      </div>
    </section>
  );
}
