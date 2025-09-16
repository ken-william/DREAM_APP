import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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
      const res = await fetch("http://localhost:8000/api/account/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Erreur lors de l'inscription.");
        return;
      }

      // Succès - redirection vers login avec message
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
        }}>✨</div>
        <h2 style={{
          color: '#1f2937',
          fontWeight: '700',
          fontSize: '1.8rem',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Rejoindre DreamShare
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '0.95rem',
          margin: 0
        }}>
          Créez votre compte et partagez vos rêves
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {/* Message d'erreur */}
        {error && (
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
            {error}
          </div>
        )}

        {/* Nom d'utilisateur */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            color: '#374151',
            fontWeight: '600',
            marginBottom: '0.5rem',
            fontSize: '0.9rem'
          }}>
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
            name="email"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            value={formData.password}
            onChange={handleChange}
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

        {/* Bouton d'inscription */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            background: loading 
              ? '#d1d5db' 
              : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: loading 
              ? 'none' 
              : '0 4px 15px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
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
              Création...
            </>
          ) : (
            <>
              ✨ Créer mon compte
            </>
          )}
        </button>

        {/* Lien vers la connexion */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: '#6b7280',
            fontSize: '0.9rem',
            margin: 0
          }}>
            Déjà un compte ?{' '}
            <Link 
              to="/login" 
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
              Se connecter 🚀
            </Link>
          </p>
        </div>
      </form>

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
