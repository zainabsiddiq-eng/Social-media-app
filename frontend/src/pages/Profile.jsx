import { useEffect, useState } from "react";
import { api, mediaUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { access, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", bio: "" });
  const [picture, setPicture] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getProfile(access)
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          bio: data.bio || "",
        });
      })
      .catch((err) => setError(err.message));
  }, [access]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("phone", form.phone);
      body.append("bio", form.bio);
      if (picture) body.append("profile_picture", picture);

      const data = await api.updateProfile(body, access);
      setProfile(data);
      updateUser({
        name: data.name,
        phone: data.phone,
        profile_picture: data.profile_picture,
      });
      setMessage("Profile saved.");
      setPicture(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!profile && !error) {
    return <div className="skeleton" style={{ height: 180 }} />;
  }

  return (
    <section style={{ maxWidth: 680 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Edit Profile</h1>
        </div>
      </div>

      {profile && (
        <div className="profile-hero">
          {profile.profile_picture ? (
            <img src={mediaUrl(profile.profile_picture)} alt="" />
          ) : (
            <div className="avatar-fallback">
              {(profile.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
              {profile.name}
            </h2>
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              {profile.email}
            </p>
            <div className="stats">
              <span><strong>{profile.posts_count}</strong> posts</span>
              <span><strong>{profile.followers}</strong> followers</span>
              <span><strong>{profile.following}</strong> following</span>
            </div>
          </div>
        </div>
      )}

      <form className="panel form" onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            rows={4}
            placeholder="A short line about you"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="picture">Profile picture</label>
          <input
            id="picture"
            type="file"
            accept="image/*"
            onChange={(e) => setPicture(e.target.files?.[0] || null)}
          />
        </div>
        <button className="btn" disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}
