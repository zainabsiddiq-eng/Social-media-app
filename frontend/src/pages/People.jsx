import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function People() {
  const { access, user } = useAuth();
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .verifiedUsers(access)
      .then((data) => setPeople(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message));
  }, [access]);

  async function toggleFollow(id) {
    setMessage("");
    setError("");
    setBusyId(id);
    try {
      const data = await api.follow(id, access);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const list = people.filter((p) => p.id !== user?.id);

  return (
    <section style={{ maxWidth: 640 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Grow closer</p>
          <h1>People</h1>
        </div>
      </div>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
      {message && <div className="success" style={{ marginBottom: "1rem" }}>{message}</div>}
      <div className="panel">
        {list.length === 0 && (
          <div className="empty" style={{ padding: "1rem 0" }}>
            <h3>No one here yet</h3>
            <p>Verified members will appear as they join.</p>
          </div>
        )}
        {list.map((person) => (
          <div className="user-row" key={person.id}>
            <div className="user-main">
              <div className="avatar-fallback">
                {(person.name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{person.name}</strong>
                <div className="muted" style={{ fontSize: "0.88rem" }}>
                  In the circle
                </div>
              </div>
            </div>
            <button
              className="btn ghost"
              type="button"
              disabled={busyId === person.id}
              onClick={() => toggleFollow(person.id)}
            >
              {busyId === person.id ? "…" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
