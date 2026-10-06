import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

function Hint({ hint }) {
  if (!hint) return null;
  const isErr = hint.kind === "error";
  return (
    <p className={`field-hint ${isErr ? "hint-error" : "hint-ok"}`}>
      {isErr ? "✕" : "✓"} {hint.message}
    </p>
  );
}

function useUsernameCheck(username, wantExists) {
  const [hint, setHint] = useState(null);
  useEffect(() => {
    const name = username.trim();
    if (!name) { setHint(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const data = await api(`/api/auth/check-username?username=${encodeURIComponent(name)}`);
        if (cancelled) return;
        if (wantExists) {
          setHint(data.exists ? null : { kind: "error", message: "That username doesn't exist" });
        } else {
          setHint(
            data.exists
              ? { kind: "error", message: "Username already taken" }
              : { kind: "ok", message: "Username is available" }
          );
        }
      } catch { }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [username, wantExists]);
  return [hint, setHint];
}

export default function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [error, setError] = useState(null);
  const [errorKey, setErrorKey] = useState(0);

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginPassHint, setLoginPassHint] = useState(null);
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");

  const [loginUserHint, setLoginUserHint] = useUsernameCheck(loginUser, true);
  const [regUserHint, setRegUserHint] = useUsernameCheck(regUser, false);
  const busy = useRef(false);

  function switchTab(t) {
    setTab(t);
    setError(null);
    setLoginUserHint(null);
    setLoginPassHint(null);
    setRegUserHint(null);
  }

  function showError(message) {
    setError(`⚠️ ${message}`);
    setErrorKey((k) => k + 1);
  }

  async function submitLogin(e) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setLoginUserHint(null);
    setLoginPassHint(null);
    setError(null);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass }),
      });
      onAuth(data, false);
    } catch (err) {
      if (err.code === "USERNAME_NOT_FOUND") setLoginUserHint({ kind: "error", message: "That username doesn't exist" });
      else if (err.code === "WRONG_PASSWORD") setLoginPassHint({ kind: "error", message: "Incorrect password" });
      else showError(err.message);
    } finally {
      busy.current = false;
    }
  }

  async function submitRegister(e) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setRegUserHint(null);
    setError(null);
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: regUser.trim(), password: regPass }),
      });
      onAuth(data, true);
    } catch (err) {
      showError(err.message);
    } finally {
      busy.current = false;
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <h1>🧠 Memory Card</h1>
        <div className="tabs">
          <button className={`tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => switchTab("login")}>Login</button>
          <button className={`tab-btn ${tab === "register" ? "active" : ""}`} onClick={() => switchTab("register")}>Register</button>
        </div>

        {tab === "login" ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <div className="field">
              <input type="text" placeholder="Username" autoComplete="username" required
                value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
              <Hint hint={loginUserHint} />
            </div>
            <div className="field">
              <input type="password" placeholder="Password" autoComplete="current-password" required
                value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
              <Hint hint={loginPassHint} />
            </div>
            <button type="submit">Login</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitRegister}>
            <div className="field">
              <input type="text" placeholder="Username" autoComplete="username" required
                value={regUser} onChange={(e) => setRegUser(e.target.value)} />
              <Hint hint={regUserHint} />
            </div>
            <input type="password" placeholder="Password (min 4 characters)" autoComplete="new-password" required
              value={regPass} onChange={(e) => setRegPass(e.target.value)} />
            <button type="submit">Create account</button>
          </form>
        )}

        {error && <p key={errorKey} className="error">{error}</p>}
      </div>
    </div>
  );
}
