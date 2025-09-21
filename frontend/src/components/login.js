import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

export default function LoginForm({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/account/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response:", res.status, data);

      if (!res.ok) {
        if (res.status === 400) {
          setErr("Email ou mot de passe incorrect.");
        } else {
          setErr(`Erreur ${res.status}: ${data.detail || "Problème de connexion"}`);
        }
        return;
      }

      if (!data?.token) {
        setErr("Réponse inattendue du serveur (pas de token).");
        return;
      }

      // Stocker le token
      localStorage.setItem("token", data.token);
      localStorage.setItem("access_token", data.token);
      window.dispatchEvent(new Event("auth-changed"));

      // Récupérer les infos utilisateur
      try {
        const profileRes = await fetch(`${API_BASE}/api/account/profile/`, {
          headers: { "Authorization": `Token ${data.token}` }
        });
        
        if (profileRes.ok) {
          const userData = await profileRes.json();
          if (onLogin) {
            onLogin(userData);
          }
          navigate("/");
        } else {
          navigate("/");
        }
      } catch (profileError) {
        console.error("Erreur récupération profil:", profileError);
        navigate("/");
      }

    } catch (e) {
      console.error("Login network error:", e);
      setErr("Erreur réseau. Vérifiez que le serveur est démarré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      {/* Header */}
      <div className="auth-header">
        <div className="auth-icon">🌙</div>
        <h2 className="auth-title">
          Connexion à DreamShare
        </h2>
        <p className="auth-subtitle">
          Transformez vos rêves en œuvres d'art
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {/* Message d'erreur */}
        {err && (
          <div className="auth-error">
            {err}
          </div>
        )}

        {/* Email */}
        <div className="auth-field">
          <label className="auth-label">
            📧 Adresse email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            disabled={loading}
            className="auth-input"
          />
        </div>

        {/* Mot de passe */}
        <div className="auth-field double-margin">
          <label className="auth-label">
            🔒 Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            className="auth-input"
          />
        </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={loading}
          className={`auth-submit-button ${loading ? 'disabled' : 'enabled'}`}
        >
          {loading ? (
            <>
              <div className="auth-loading-spinner" />
              Connexion...
            </>
          ) : (
            <>🚀 Se connecter</>
          )}
        </button>

        {/* Lien vers l'inscription */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-footer-link">
              Créer un compte ✨
            </Link>
          </p>
        </div>
      </form>

      {/* Debug info (seulement en dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="auth-debug">
          API: {API_BASE}
        </div>
      )}
    </div>
  );
}
