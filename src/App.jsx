import { useCallback, useEffect, useState } from "react";
import { api, clearStoredUser, clearToken, getStoredUser, getToken, setStoredUser, setToken } from "./api.js";
import AuthScreen from "./components/AuthScreen.jsx";
import AvatarScreen from "./components/AvatarScreen.jsx";
import GameScreen from "./components/GameScreen.jsx";
import Toast from "./components/Toast.jsx";

export default function App() {
  const [screen, setScreen] = useState(getToken() ? "loading" : "auth");
  const [user, setUser] = useState(getStoredUser());
  const [best, setBest] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => setToast({ message, type, id: Date.now() }), []);

  useEffect(() => {
    if (screen !== "loading") return;
    api("/api/score")
      .then((data) => { setBest(data.bestScore || 0); setUser(getStoredUser()); setScreen("game"); })
      .catch(() => { clearToken(); clearStoredUser(); setScreen("auth"); });
  }, [screen]);

  function handleAuth(data, isNew) {
    const u = { username: data.username, avatarUrl: data.avatarUrl || null };
    setToken(data.token);
    setStoredUser(u);
    setUser(u);
    setBest(data.bestScore || 0);
    setScreen(isNew ? "avatar" : "game");
  }

  function handleAvatarDone(avatarUrl) {
    if (avatarUrl) {
      const u = { ...user, avatarUrl };
      setStoredUser(u);
      setUser(u);
    }
    setScreen("game");
  }

  function logout() {
    clearToken();
    clearStoredUser();
    setUser({});
    setScreen("auth");
  }

  const updateUser = useCallback((u) => { setUser(u); setStoredUser(u); }, []);

  return (
    <>
      {screen === "auth" && <AuthScreen onAuth={handleAuth} />}
      {screen === "avatar" && <AvatarScreen onDone={handleAvatarDone} />}
      {screen === "game" && (
        <GameScreen user={user} setUser={updateUser} initialBest={best} onLogout={logout} showToast={showToast} />
      )}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
