import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

export default function RegisterForm() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/account/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Erreur lors de l'inscription.");
        return;
      }

      navigate("/login", { 
        state: { 
          message: "Compte créé avec succès ! Vous pouvez maintenant vous connecter." 
        }
      });

    } catch (err) {
      console.error("Erreur inscription:", err);
      setError("Erreur réseau. Vérifiez que le serveur est démarré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      {/* Header */}
      <div className="auth-header">
        <div className="auth-icon">✨</div>
        <h2 className="auth-title">
          Rejoindre DreamShare
        </h2>
        <p className="auth-subtitle">
          Créez votre compte et partagez vos rêves
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {/* Message d'erreur */}
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {/* Nom d'utilisateur */}
        <div className="auth-field">
          <label className="auth-label">
            👤 Nom d'utilisateur
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="votre_nom_utilisateur"
            required
            disabled={loading}
            className="auth-input"
          />
        </div>

        {/* Email */}
        <div className="auth-field">
          <label className="auth-label">
            📧 Adresse email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            disabled={loading}
            className="auth-input"
          />
        </div>

        {/* Bouton d'inscription */}
        <button
          type="submit"
          disabled={loading}
          className={`auth-submit-button ${loading ? 'disabled' : 'enabled'}`}
          style={{
            background: loading 
              ? '#d1d5db' 
              : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            boxShadow: loading 
              ? 'none' 
              : '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          {loading ? (
            <>
              <div className="auth-loading-spinner" />
              Création...
            </>
          ) : (
            <>✨ Créer mon compte</>
          )}
        </button>

        {/* Lien vers la connexion */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            Déjà un compte ?{' '}
            <Link to="/login" className="auth-footer-link">
              Se connecter 🚀
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
