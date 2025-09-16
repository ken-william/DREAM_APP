import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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
      localStorage.setItem("access_token", data.token); // Pour la compatibilité
      window.dispatchEvent(new Event("auth-changed"));

      // Récupérer les infos utilisateur
      try {
        const profileRes = await fetch(`${API_BASE}/api/account/profile/`, {
          headers: { "Authorization": `Token ${data.token}` }
        });
        
        if (profileRes.ok) {
          const userData = await profileRes.json();
          if (onLogin) {
            onLogin(userData); // Callback pour App.js
          }
          navigate("/"); // Redirection vers l'accueil
        } else {
          // Si problème de récupération du profil, on redirige quand même
          navigate("/");
        }
      } catch (profileError) {
        console.error("Erreur récupération profil:", profileError);
        navigate("/"); // Redirection même en cas d'erreur
      }

    } catch (e) {
      console.error("Login network error:", e);
      setErr("Erreur réseau. Vérifiez que le serveur est démarré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
      padding: '3rem',
      maxWidth: '420px',
      width: '100%',
      margin: '2rem'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>🌙</div>
        <h2 style={{
          color: '#1f2937',
          fontWeight: '700',
          fontSize: '1.8rem',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Connexion à DreamShare
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '0.95rem',
          margin: 0
        }}>
          Transformez vos rêves en œuvres d'art
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {/* Message d'erreur */}
        {err && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {err}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            color: '#374151',
            fontWeight: '600',
            marginBottom: '0.5rem',
            fontSize: '0.9rem'
          }}>
            📧 Adresse email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: loading ? '#f9fafb' : 'white',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Mot de passe */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            color: '#374151',
            fontWeight: '600',
            marginBottom: '0.5rem',
            fontSize: '0.9rem'
          }}>
            🔒 Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: loading ? '#f9fafb' : 'white',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            background: loading 
              ? '#d1d5db' 
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: loading 
              ? 'none' 
              : '0 4px 15px rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
            }
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Connexion...
            </>
          ) : (
            <>
              🚀 Se connecter
            </>
          )}
        </button>

        {/* Lien vers l'inscription */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: '#6b7280',
            fontSize: '0.9rem',
            margin: 0
          }}>
            Pas encore de compte ?{' '}
            <Link 
              to="/register" 
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#1d4ed8';
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#3b82f6';
                e.target.style.textDecoration = 'none';
              }}
            >
              Créer un compte ✨
            </Link>
          </p>
        </div>
      </form>

      {/* Debug info (seulement en dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          API: {API_BASE}
        </div>
      )}

      {/* Animations CSS */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
