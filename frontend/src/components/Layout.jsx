import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { api, mediaUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.2 5.8-5.8 2.2 2.2-5.8 5.8-2.2Z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19c.8-3 2.9-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />
      <path d="M14 14.6c1.7-.4 3.4.2 4.5 2.4" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.1l1.6 1.5M17.5 15.4l1.6 1.5M3.5 12h2.2M18.3 12h2.2M4.9 16.9l1.6-1.5M17.5 8.6l1.6-1.5" />
    </svg>
  );
}

function SettingsMenu({ open, onClose, onLogout, onEditProfile }) {
  if (!open) return null;

  return (
    <div className="settings-menu" role="menu">
      <button type="button" role="menuitem" onClick={onEditProfile}>
        Edit Profile
      </button>
      <button type="button" role="menuitem" className="danger" onClick={onLogout}>
        Log out
      </button>
      <button type="button" className="settings-dismiss" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const { user, access, logout, updateUser } = useAuth();
  const [picture, setPicture] = useState(user?.profile_picture || null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!access) return;
    api
      .getProfile(access)
      .then((profile) => {
        setPicture(profile.profile_picture || null);
        updateUser({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          profile_picture: profile.profile_picture,
        });
      })
      .catch(() => {});
  }, [access]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!settingsOpen) return;
      if (settingsRef.current?.contains(event.target)) return;
      if (event.target.closest(".dock-settings")) return;
      if (event.target.closest(".settings-sheet-card")) return;
      setSettingsOpen(false);
    }
    function handleEscape(event) {
      if (event.key === "Escape") setSettingsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [settingsOpen]);

  const displayName = user?.name || "User";
  const email = user?.email || "";
  const initial = (displayName || email || "?").charAt(0).toUpperCase();
  const photo = mediaUrl(picture || user?.profile_picture);

  function handleEditProfile() {
    setSettingsOpen(false);
    navigate("/profile");
  }

  function handleLogout() {
    setSettingsOpen(false);
    logout();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="user-brand">
          {photo ? (
            <img className="user-brand-avatar" src={photo} alt="" />
          ) : (
            <span className="user-brand-avatar fallback">{initial}</span>
          )}
          <span className="user-brand-text">
            <strong>{displayName}</strong>
            <small>{email}</small>
          </span>
        </NavLink>
        <nav className="nav-desktop">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
            My Post
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => (isActive ? "active" : undefined)}>
            All Posts
          </NavLink>
          <NavLink to="/people" className={({ isActive }) => (isActive ? "active" : undefined)}>
            People
          </NavLink>
          <NavLink to="/posts/new" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Write
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) => `nav-notify${isActive ? " active" : ""}`}
            title="Notifications"
          >
            <IconBell />
            <span>Alerts</span>
          </NavLink>
          <div className="settings-wrap" ref={settingsRef}>
            <button
              type="button"
              className={`settings-trigger${settingsOpen ? " open" : ""}`}
              aria-haspopup="menu"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((prev) => !prev)}
            >
              <IconSettings />
              Settings
            </button>
            <SettingsMenu
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onEditProfile={handleEditProfile}
              onLogout={handleLogout}
            />
          </div>
        </nav>
      </header>

      <Outlet />

      <nav className="dock" aria-label="Primary">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
          <IconHome />
          My Post
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => (isActive ? "active" : undefined)}>
          <IconCompass />
          All Posts
        </NavLink>
        <NavLink to="/posts/new" className={({ isActive }) => (isActive ? "active" : undefined)}>
          <IconPlus />
          Write
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => (isActive ? "active" : undefined)}>
          <IconBell />
          Alerts
        </NavLink>
        <NavLink to="/people" className={({ isActive }) => (isActive ? "active" : undefined)}>
          <IconPeople />
          People
        </NavLink>
        <button
          type="button"
          className={`dock-settings${settingsOpen ? " active" : ""}`}
          onClick={() => setSettingsOpen((prev) => !prev)}
        >
          <IconSettings />
          Settings
        </button>
      </nav>

      {settingsOpen && (
        <div className="settings-sheet">
          <div className="settings-sheet-card">
            <p className="settings-sheet-title">Settings</p>
            <button type="button" onClick={handleEditProfile}>
              Edit Profile
            </button>
            <button type="button" className="danger" onClick={handleLogout}>
              Log out
            </button>
            <button type="button" className="settings-dismiss" onClick={() => setSettingsOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
