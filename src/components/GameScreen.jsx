import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, prepareAvatar, setStoredUser } from "../api.js";
import { IMAGES, placeholderFor } from "../images.js";
import Avatar from "./Avatar.jsx";
import Leaderboard from "./Leaderboard.jsx";
import ProfileModal from "./ProfileModal.jsx";

const GRID_COLS = 5;
const GRID_ROWS = 10;
const GRID_SIZE = GRID_COLS * GRID_ROWS;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeGame() {
  const pool = shuffle(IMAGES).slice(0, GRID_SIZE);
  return { pool, order: shuffle(pool.map((_, i) => i)) };
}

export default function GameScreen({ user, setUser, initialBest, onLogout, showToast }) {
  const [game, setGame] = useState(makeGame);
  const [chosen, setChosen] = useState(() => new Set());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(initialBest);
  const [over, setOver] = useState(null);
  const [showBoard, setShowBoard] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const ended = useRef(false);

  useEffect(() => {
    IMAGES.forEach((img) => { const el = new Image(); el.src = img.url; });
  }, []);

  const tooFew = IMAGES.length < GRID_SIZE;

  const newGame = useCallback(() => {
    setGame(makeGame());
    setChosen(new Set());
    setScore(0);
    setOver(null);
    ended.current = false;
  }, []);

  async function endGame(finalScore) {
    if (ended.current) return;
    ended.current = true;
    setOver({ text: "…" });
    let isNewBest = false;
    let best = bestScore;
    try {
      const data = await api("/api/score", { method: "POST", body: JSON.stringify({ score: finalScore }) });
      isNewBest = data.bestScore > bestScore;
      best = data.bestScore;
      setBestScore(best);
    } catch { /* still show the result locally */ }
    setOver({
      text: isNewBest ? `New best score: ${finalScore}! 🎉` : `Your score: ${finalScore}. Best: ${best}.`,
    });
  }

  function onPick(idx) {
    if (over) return;
    if (chosen.has(idx)) { endGame(score); return; }
    const next = new Set(chosen);
    next.add(idx);
    setChosen(next);
    setScore(score + 1);
    setGame((g) => ({ ...g, order: shuffle(g.order) }));
  }

  async function changeAvatar(file) {
    const prev = user.avatarUrl || null;
    let dataUrl;
    try { dataUrl = await prepareAvatar(file); }
    catch (err) { showToast(err.message, "error"); return; }

    setUser({ ...user, avatarUrl: dataUrl });
    setUploading(true);
    try {
      const data = await api("/api/profile", { method: "POST", body: JSON.stringify({ avatarUrl: dataUrl }) });
      const u = { ...user, avatarUrl: data.avatarUrl };
      setStoredUser(u); setUser(u);
    } catch (err) {
      setUser({ ...user, avatarUrl: prev });
      showToast(err.message || "Couldn't save your photo — try again.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    const prev = user.avatarUrl || null;
    setUser({ ...user, avatarUrl: null });
    try {
      await api("/api/profile", { method: "DELETE" });
      setStoredUser({ ...user, avatarUrl: null });
    } catch (err) {
      setUser({ ...user, avatarUrl: prev });
      showToast(err.message || "Couldn't remove your photo — try again.", "error");
    }
  }

  const orderOf = useMemo(() => {
    const map = new Array(game.pool.length);
    game.order.forEach((poolIdx, pos) => { map[poolIdx] = pos; });
    return map;
  }, [game]);

  if (tooFew) {
    return <p style={{ padding: 24 }}>images.js needs at least {GRID_SIZE} images (currently {IMAGES.length}).</p>;
  }

  return (
    <div className="game-screen">
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="brand">🧠 Memory Card</h1>
          <button className="pill-btn" type="button" onClick={() => setShowLeaderboard(true)}>🏆 Leaderboard</button>
          <button className="user-chip" type="button" title="Update profile picture" onClick={() => setShowProfile(true)}>
            <span className="avatar-wrap">
              <Avatar url={user.avatarUrl} username={user.username} className="user-avatar" fallbackClassName="user-avatar-fallback" />
              {uploading && <span className="avatar-spinner" />}
            </span>
            <span>{user.username || "Player"}</span>
          </button>
          <button className="pill-btn pill-btn-muted" type="button" onClick={onLogout}>Logout</button>
        </div>
        <div className="stats">
          <span>Score: <b>{score}</b></span>
          <span>Best Score: <b>{bestScore}</b></span>
        </div>
        <div className="controls">
          <button onClick={newGame}>New Game</button>
        </div>
      </header>

      <div className="board">
        {game.pool.map((img, idx) => (
          <div
            key={img.url}
            className={`cell ${over ? "disabled" : ""}`}
            style={{ order: orderOf[idx] }}
            onClick={() => onPick(idx)}
          >
            <img
              src={img.url}
              alt=""
              loading="eager"
              decoding="async"
              onError={(e) => {
                const fb = placeholderFor(img.fallbackIndex);
                if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
              }}
            />
          </div>
        ))}
      </div>

      {over && (
        <div className="modal">
          <div className="modal-content">
            <h2>Game Over</h2>
            <p>{over.text}</p>
            <button onClick={newGame}>Play Again</button>
          </div>
        </div>
      )}

      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showProfile && (
        <ProfileModal
          user={user}
          uploading={uploading}
          onClose={() => setShowProfile(false)}
          onChoose={changeAvatar}
          onRemove={removeAvatar}
        />
      )}
    </div>
  );
}
