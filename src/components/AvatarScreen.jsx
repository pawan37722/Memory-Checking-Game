import { useState } from "react";
import { api, prepareAvatar } from "../api.js";

export default function AvatarScreen({ onDone }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleFile(file) {
    setError(null);
    if (!file) return;
    try {
      setPreview(await prepareAvatar(file));
    } catch (err) {
      setError(err.message);
    }
  }

  async function save() {
    if (!preview) { onDone(null); return; }
    setError(null);
    setSaving(true);
    try {
      const data = await api("/api/profile", {
        method: "POST",
        body: JSON.stringify({ avatarUrl: preview }),
      });
      onDone(data.avatarUrl);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <h1>Add a profile picture</h1>
        <p className="muted">Optional, but it'll show up on the leaderboard. Max size 50MB.</p>

        <label
          htmlFor="avatar-input"
          className="avatar-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        >
          {preview ? <img className="avatar-preview" src={preview} alt="Preview" /> : <span>📷 Click to choose a photo</span>}
        </label>
        <input id="avatar-input" type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />

        {error && <p className="error">{error}</p>}
        {saving && <p className="muted">Uploading…</p>}

        <div className="avatar-actions">
          <button className="btn-secondary" type="button" onClick={() => onDone(null)}>Skip for now</button>
          <button type="button" disabled={saving} onClick={save}>Save &amp; continue</button>
        </div>
      </div>
    </div>
  );
}
