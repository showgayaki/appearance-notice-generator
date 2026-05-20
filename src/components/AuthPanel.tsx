import { FormEvent, useState } from "react";
import { isLoginConfigured, loginEmail, loginId, supabase } from "../lib/supabase";

type AuthPanelProps = {
  isLoggedIn: boolean;
  onLoggedOut: () => void;
};

export function AuthPanel({ isLoggedIn, onLoggedOut }: AuthPanelProps) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isLoginConfigured) {
      setError("ログインID設定が不足しています。");
      return;
    }

    if (userId.trim() !== loginId) {
      setError("IDまたはパスワードが違います。");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError("IDまたはパスワードが違います。");
      return;
    }

    setPassword("");
    setUserId("");
    setIsOpen(false);
    setIsLoginModalOpen(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    onLoggedOut();
  };

  return (
    <div className="auth-menu">
      <button
        type="button"
        className="account-button"
        aria-label={isLoggedIn ? "管理者メニューを開く" : "ユーザーメニューを開く"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isLoggedIn ? "夏" : "春"}
      </button>

      {isOpen && (
        <div className="account-popover">
          <div className="account-summary">
            <div className="account-avatar">{isLoggedIn ? "夏" : "春"}</div>
            <p>{isLoggedIn ? "管理者" : "一般ユーザー"}</p>
          </div>

          {isLoggedIn ? (
            <button type="button" className="account-menu-button" onClick={() => void signOut()}>
              ログアウト
            </button>
          ) : (
            <button
              type="button"
              className="account-menu-button"
              onClick={() => {
                setError("");
                setIsOpen(false);
                setIsLoginModalOpen(true);
              }}
            >
              管理者ログイン
            </button>
          )}
        </div>
      )}

      {isLoginModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
            <div className="section-heading">
              <h2 id="login-modal-title">管理者ログイン</h2>
              <button type="button" className="plain-button" onClick={() => setIsLoginModalOpen(false)}>
                閉じる
              </button>
            </div>
            <form className="account-login-form" onSubmit={(event) => void signIn(event)}>
              <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="ID" autoComplete="username" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="PASS"
                type="password"
                autoComplete="current-password"
              />
              <button type="submit" disabled={submitting}>
                ログイン
              </button>
              {error && <p className="error">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
