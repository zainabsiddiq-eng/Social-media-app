import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function CreatePost() {
  const navigate = useNavigate();
  const { access } = useAuth();
  const [form, setForm] = useState({
    title: "",
    caption: "",
    visibility: "public",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("title", form.title);
      body.append("caption", form.caption);
      body.append("visibility", form.visibility);
      if (image) body.append("image", image);

      const post = await api.createPost(body, access, true);
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 680 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Share</p>
          <h1>Write</h1>
        </div>
      </div>
      <form className="panel form" onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            placeholder="Give it a short name"
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
            placeholder="What's on your mind?"
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
            <option value="followers">Circle only</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="image">Photo (optional)</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {image && <p className="muted">{image.name}</p>}
        </div>
        {preview && (
          <div className="post-media">
            <img src={preview} alt="Preview" />
          </div>
        )}
        <button className="btn" disabled={loading}>
          {loading ? "Publishing…" : "Publish"}
        </button>
      </form>
    </section>
  );
}
