import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { access, user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    caption: "",
    visibility: "public",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getPost(id, access)
      .then((post) => {
        if (user?.id && post.user !== user.id) {
          setError("You can only edit your own posts.");
          return;
        }
        setForm({
          title: post.title || "",
          caption: post.caption || "",
          visibility: post.visibility || "public",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, access, user?.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const post = await api.updatePost(id, form, access);
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="stack">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }

  return (
    <section style={{ maxWidth: 680 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Update</p>
          <h1>Edit post</h1>
        </div>
      </div>
      <form className="panel form" onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="caption">Note</label>
          <textarea
            id="caption"
            rows={7}
            required
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="visibility">Who can see this</label>
          <select
            id="visibility"
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}
          >
            <option value="public">Everyone</option>
            <option value="followers">Followers only</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button className="btn" disabled={saving || Boolean(error && !form.caption)}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate(`/posts/${id}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
