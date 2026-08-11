import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function HeartIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.2a3.8 3.8 0 0 1 7 3.6C19 15.6 12 20 12 20Z" />
    </svg>
  );
}

export default function PostCard({
  post,
  onLike,
  onDelete,
  showActions = true,
  liked = false,
  likeBusy = false,
  canEdit = false,
}) {
  return (
    <article className="post-card">
      <h3 className="post-title">
        <Link to={`/posts/${post.id}`}>{post.title || "Untitled note"}</Link>
      </h3>
      <div className="post-meta">
        <span className="chip">{post.visibility}</span>
        <span>{formatDate(post.created_at)}</span>
        {post.author_name && <span>{post.author_name}</span>}
        {post.hashtags?.length > 0 && (
          <span>{post.hashtags.map((h) => `#${h.name}`).join(" ")}</span>
        )}
      </div>
      <p className="post-body">{post.caption}</p>
      {post.images?.length > 0 && (
        <div className="stack" style={{ marginTop: "0.9rem" }}>
          {post.images.map((img) => (
            <div className="post-media" key={img.id}>
              <img src={mediaUrl(img.image)} alt="" />
            </div>
          ))}
        </div>
      )}
      {showActions && (
        <div className="post-actions">
          {onLike && (
            <button
              type="button"
              className={`btn soft like-btn${liked ? " liked" : ""}`}
              disabled={likeBusy}
              aria-pressed={liked}
              onClick={() => onLike(post.id)}
            >
              <HeartIcon filled={liked} />
              {liked ? "Unlike" : "Like"}
            </button>
          )}
          <Link className="btn soft" to={`/posts/${post.id}`}>
            Open
          </Link>
          {canEdit && (
            <Link className="btn soft" to={`/posts/${post.id}/edit`}>
              Edit
            </Link>
          )}
          {onDelete && canEdit && (
            <button
              type="button"
              className="btn soft danger-soft"
              onClick={() => onDelete(post.id)}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </article>
  );
}
