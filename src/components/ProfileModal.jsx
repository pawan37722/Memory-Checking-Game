import { useRef } from "react";

export default function ProfileModal({ user, uploading, onClose, onChoose, onRemove }) {
  const fileRef = useRef(null);
  const initial = (user.username || "?").charAt(0).toUpperCase();

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content profile-modal-content">
        <div className="leaderboard-header">
          <h2>{user.username || "Profile picture"}</h2>
          <button className="icon-btn" type="button" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="profile-photo-frame">
          {user.avatarUrl
            ? <img className="profile-photo-large" src={user.avatarUrl} alt="Profile photo" />
            : <span className="profile-photo-large profile-photo-fallback">{initial}</span>}
          {uploading && <span className="avatar-spinner avatar-spinner-lg" />}
        </div>
        <div className="profile-modal-actions">
          <button type="button" onClick={() => fileRef.current?.click()}>🖊️ Change photo</button>
          {user.avatarUrl && <button className="btn-secondary" type="button" onClick={onRemove}>Remove photo</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) onChoose(f); }} />
      </div>
    </div>
  );
}
