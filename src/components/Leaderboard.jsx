import { useEffect, useState } from "react";
import { api } from "../api.js";
import Avatar from "./Avatar.jsx";

export default function Leaderboard({ onClose }) {
  const [range, setRange] = useState("alltime");
  const [state, setState] = useState({ loading: true, entries: [], error: null });

  useEffect(() => {
    let stale = false;
    setState({ loading: true, entries: [], error: null });
    api(`/api/leaderboard?range=${range}`)
      .then((data) => { if (!stale) setState({ loading: false, entries: data.entries || [], error: null }); })
      .catch((err) => { if (!stale) setState({ loading: false, entries: [], error: err.message || "Couldn't load leaderboard." }); });
    return () => { stale = true; };
  }, [range]);

  const { loading, entries, error } = state;

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content leaderboard-content">
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
          <button className="icon-btn" type="button" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="tabs">
          <button className={`tab-btn ${range === "alltime" ? "active" : ""}`} onClick={() => setRange("alltime")}>All Time</button>
          <button className={`tab-btn ${range === "today" ? "active" : ""}`} onClick={() => setRange("today")}>Today</button>
        </div>
        <p className="muted small">{range === "today" ? "Resets daily at 12:00 PM." : "Best score ever, per player."}</p>

        {loading && <div className="leaderboard-loading"><span className="spinner" /> Loading…</div>}

        <ol className="leaderboard-list">
          {entries.map((entry, i) => (
            <li key={entry.username} className={`leaderboard-row ${i < 3 ? `top-${i + 1}` : ""}`}>
              <span className="leaderboard-rank">{i + 1}</span>
              <Avatar url={entry.avatarUrl} username={entry.username} className="leaderboard-avatar" />
              <span className="leaderboard-name">{entry.username}</span>
              <span className="leaderboard-score">{entry.score}</span>
            </li>
          ))}
        </ol>

        {!loading && (error || entries.length === 0) && (
          <p className="muted">{error || "No scores yet — be the first!"}</p>
        )}
      </div>
    </div>
  );
}
