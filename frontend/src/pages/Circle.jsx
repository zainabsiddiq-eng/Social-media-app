import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

export default function Circle() {
  const { access, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.feed(access);
      setPosts(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [access]);

  async function handleLike(id) {
    try {
      const data = await api.likePost(id, access);
      setLikedMap((prev) => ({
        ...prev,
        [id]: data.message === "Post liked",
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Your timeline</p>
          <h1>My Post</h1>
        </div>
      </div>

      <Link to="/posts/new" className="compose-prompt">
        <p>Hey {firstName} — share something new.</p>
        <span className="btn ghost">Write</span>
      </Link>

      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {loading && (
        <div className="stack">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty">
          <h3>No posts yet</h3>
          <p>
            Follow a few people or write the first note to get started.
          </p>
          <div className="empty-actions">
            <Link className="btn" to="/people">
              Find people
            </Link>
            <Link className="btn secondary" to="/posts/new">
              Write a note
            </Link>
          </div>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="timeline">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              liked={likedMap[post.id]}
              canEdit={Number(user?.id) === Number(post.user)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
