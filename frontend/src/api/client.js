const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const MEDIA_BASE = import.meta.env.VITE_MEDIA_URL;

export function mediaUrl(path) {
  if (!path) return null;
  if (typeof path !== "string") {
    if (path.image) return mediaUrl(path.image);
    if (path.url) return mediaUrl(path.url);
    return null;
  }
  if (path.startsWith("blob:") || path.startsWith("data:")) return path;
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const url = new URL(path);
      if (url.pathname.startsWith("/media/")) {
        return `${url.pathname}${url.search}`;
      }
      return path;
    }
  } catch {
    /* keep going */
  }
  if (MEDIA_BASE) {
    const prefix = MEDIA_BASE.replace(/\/$/, "");
    return path.startsWith("/") ? `${prefix}${path}` : `${prefix}/${path}`;
  }
  if (path.startsWith("/media/") || path.startsWith("/")) return path;
  if (path.startsWith("media/")) return `/${path}`;
  return `/media/${path}`;
}

export function postImages(post) {
  const raw = [];
  if (post?.image) raw.push(post.image);
  if (Array.isArray(post?.images)) {
    for (const item of post.images) {
      if (!item) continue;
      raw.push(typeof item === "string" ? item : item.image);
    }
  }
  return [...new Set(raw.map(mediaUrl).filter(Boolean))];
}

async function request(path, { method = "GET", body, token, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!formData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const message =
      data?.error ||
      data?.detail ||
      (typeof data === "object" ? Object.values(data).flat().join(" ") : null) ||
      "Something went wrong";
    throw new Error(message);
  }

  return data;
}

export const api = {
  register: (body) => request("/register/", { method: "POST", body }),
  resendOtp: (body) => request("/resend-otp/", { method: "POST", body }),
  verifyOtp: (body) => request("/verify-otp/", { method: "POST", body }),
  login: (body) => request("/login/", { method: "POST", body }),
  editUser: (body) => request("/edit-user/", { method: "PATCH", body }),
  feed: (token) => request("/feed/", { token }),
  posts: (token) => request("/posts/list/", { token }),
  createPost: (body, token, formData = false) =>
    request("/posts/create/", { method: "POST", body, token, formData }),
  getPost: (id, token) => request(`/posts/${id}/`, { token }),
  updatePost: (id, body, token, formData = false) =>
    request(`/posts/${id}/update/`, { method: "PUT", body, token, formData }),
  deletePost: (id, token) =>
    request(`/posts/${id}/delete/`, { method: "DELETE", token }),
  likePost: (id, token) =>
    request(`/posts/${id}/like/`, { method: "POST", token }),
  commentPost: (id, content, token) =>
    request(`/posts/${id}/comment/`, {
      method: "POST",
      body: { content },
      token,
    }),
  verifiedUsers: (token) => request("/verified-users/", { token }),
  follow: (userId, token) =>
    request(`/follow/${userId}/`, { method: "POST", token }),
  getProfile: (token) => request("/profile/", { token }),
  updateProfile: (formData, token) =>
    request("/profile/", {
      method: "PUT",
      body: formData,
      token,
      formData: true,
    }),
};
