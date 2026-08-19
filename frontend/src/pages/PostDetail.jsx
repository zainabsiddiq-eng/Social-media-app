import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { access, user } = useAuth();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);

  const isOwner = Boolean(post && Number(user?.id) === Number(post.user));

  async function load() {
    try {
      const data = await api.getPost(id, access);
      setPost(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id, access]);

  async function handleLike() {
    try {
      const data = await api.likePost(id, access);
      setLiked(data.message === "Post liked");
      setMessage(data.message === "Post liked" ? "Post liked." : "Post unliked.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Remove this note?")) return;
    try {
      await api.deletePost(id, access);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    setError("");
    try {
      await api.commentPost(id, comment, access);
      setComment("");
      setMessage("Comment added.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!post && !error) {
    return (
      <div className="stack">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }

  return (
    <section style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Note</p>
          <h1>Detail</h1>
        </div>
      </div>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
      {message && <div className="success" style={{ marginBottom: "1rem" }}>{message}</div>}
      {post && (
        <>
          <div className="timeline">
            <PostCard
              post={post}
              onLike={handleLike}
              onDelete={isOwner ? handleDelete : undefined}
              liked={liked}
              canEdit={isOwner}
            />
          </div>
          <form className="panel form" style={{ marginTop: "1.2rem" }} onSubmit={handleComment}>
            <div className="field">
              <label htmlFor="comment">Leave a thought</label>
              <textarea
                id="comment"
                rows={3}
                required
                placeholder="Write a short reply…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <button className="btn">Reply</button>
          </form>
        </>
      )}
    </section>
  );
}
