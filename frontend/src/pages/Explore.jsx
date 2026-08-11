import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

export default function Explore() {
  const { access, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState({});

  useEffect(() => {
    setLoading(true);
    api
      .posts(access)
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Look around</p>
          <h1>All Posts</h1>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {loading && (
        <div className="stack">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}
      {!loading && posts.length === 0 && (
        <div className="empty">
          <h3>Nothing to discover yet</h3>
          <p>When people publish public notes, they will show up here.</p>
        </div>
      )}
      <div className="timeline">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            liked={likedMap[post.id]}
            canEdit={user?.id === post.user}
          />
        ))}
      </div>
    </section>
  );
}

