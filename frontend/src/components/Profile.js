import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [dreams, setDreams] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token"); // ✅ CORRECTION: "token" au lieu de "access"
    if (!token) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        // Charger les infos du profil
        const profileResponse = await api.get("/api/account/profile/");
        setMe(profileResponse.data);

        // Charger les rêves
        const dreamsResponse = await api.get("/api/dreams/list");
        setDreams(dreamsResponse.data.dreams);
        setStats(dreamsResponse.data.stats);

      } catch (e) {
        console.error("Erreur profile:", e);
        setErr("Erreur lors du chargement. Veuillez vous reconnecter.");
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public': return '🌍';
      case 'private': return '🔒';
      case 'friends_only': return '👥';
      default: return '❓';
    }
  };

  const getPrivacyLabel = (privacy) => {
    switch (privacy) {
      case 'public': return 'Public';
      case 'private': return 'Privé';
      case 'friends_only': return 'Amis uniquement';
      default: return privacy;
    }
  };

  if (err) {
    return (
      <div style={{ padding: 24, color: "crimson", textAlign: "center" }}>
        <h3>{err}</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        padding: 60, 
        textAlign: "center",
        fontSize: "18px",
        color: "#6c757d"
      }}>
        <div>🌙 Chargement de vos rêves...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "0 auto", 
      padding: "2rem",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"
    }}>
      {/* Header du profil */}
      <div style={{
        background: "white",
        borderRadius: "15px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        border: "1px solid #e9ecef"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            color: "white"
          }}>
            {me?.username?.charAt(0)?.toUpperCase() || me?.email?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 0.5rem 0", color: "#2c3e50" }}>
              {me?.username || 'Rêveur anonyme'}
            </h2>
            <p style={{ margin: "0", color: "#6c757d", fontSize: "16px" }}>
              📧 {me?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          border: "1px solid #e9ecef"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌙</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#495057" }}>
            {stats.total_dreams || 0}
          </div>
          <div style={{ color: "#6c757d", fontSize: "14px" }}>Total des rêves</div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          border: "1px solid #e9ecef"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌍</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#495057" }}>
            {stats.public_dreams || 0}
          </div>
          <div style={{ color: "#6c757d", fontSize: "14px" }}>Rêves publics</div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          border: "1px solid #e9ecef"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#495057" }}>
            {stats.private_dreams || 0}
          </div>
          <div style={{ color: "#6c757d", fontSize: "14px" }}>Rêves privés</div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          border: "1px solid #e9ecef"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#495057" }}>
            {stats.friends_only_dreams || 0}
          </div>
          <div style={{ color: "#6c757d", fontSize: "14px" }}>Entre amis</div>
        </div>
      </div>

      {/* Titre de la section rêves */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        border: "1px solid #e9ecef"
      }}>
        <h3 style={{ margin: 0, color: "#2c3e50", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          🎨 Vos rêves ({dreams.length})
        </h3>
      </div>

      {/* Liste des rêves */}
      {dreams.length === 0 ? (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          border: "1px solid #e9ecef",
          color: "#6c757d"
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>😴</div>
          <h4 style={{ margin: "0 0 1rem 0" }}>Aucun rêve pour le moment</h4>
          <p>Créez votre premier rêve pour commencer votre journal onirique !</p>
          <button 
            onClick={() => navigate("/create-dream")}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontSize: "16px",
              cursor: "pointer",
              marginTop: "1rem"
            }}
          >
            🌙 Créer mon premier rêve
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "1.5rem"
        }}>
          {dreams.map((dream) => (
            <div
              key={dream.dream_id}
              style={{
                background: "white",
                borderRadius: "15px",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                border: "1px solid #e9ecef",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
              }}
            >
              {/* Image du rêve */}
              {dream.img_b64 && (
                <div style={{ width: "100%", height: "200px", overflow: "hidden" }}>
                  <img 
                    src={dream.img_b64} 
                    alt="Image du rêve"
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}

              {/* Contenu du rêve */}
              <div style={{ padding: "1.5rem" }}>
                {/* En-tête avec date et privacy */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "1rem"
                }}>
                  <div style={{ color: "#6c757d", fontSize: "14px" }}>
                    📅 {formatDate(dream.date)}
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    background: "#f8f9fa",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#495057"
                  }}>
                    {getPrivacyIcon(dream.privacy)}
                    {getPrivacyLabel(dream.privacy)}
                  </div>
                </div>

                {/* Transcription */}
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ 
                    margin: "0 0 0.5rem 0", 
                    color: "#2c3e50",
                    fontSize: "16px"
                  }}>
                    💭 Votre récit
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    color: "#495057",
                    lineHeight: "1.5",
                    fontSize: "14px"
                  }}>
                    {dream.transcription}
                  </p>
                </div>

                {/* ID du rêve */}
                <div style={{
                  paddingTop: "1rem",
                  borderTop: "1px solid #f0f0f0",
                  fontSize: "12px",
                  color: "#adb5bd",
                  textAlign: "center"
                }}>
                  Rêve #{dream.dream_id}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}