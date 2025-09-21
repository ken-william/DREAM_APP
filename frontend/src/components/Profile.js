import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { updateDreamPrivacy } from "../services/api";
import "../styles/Profile.css";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [dreams, setDreams] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
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

  const handleExportDream = async (dreamId) => {
    try {
      const response = await api.get(`/api/dreams/${dreamId}/export`, {
        responseType: 'blob' // Important pour le téléchargement de fichier
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extraire le nom de fichier du header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'mon_reve.html';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);  
        if (match) {
          filename = match[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export du rêve. Veuillez réessayer.');
    }
  };

  // 🆕 NOUVELLE FONCTION : Changer le statut de privacy d'un rêve
  const handlePrivacyChange = async (dreamId, newPrivacy) => {
    try {
      await updateDreamPrivacy(dreamId, newPrivacy);
      
      // Mettre à jour le rêve dans la liste
      setDreams(prevDreams => 
        prevDreams.map(dream => 
          dream.dream_id === dreamId 
            ? { ...dream, privacy: newPrivacy }
            : dream
        )
      );
      
      // Mettre à jour les statistiques
      const updatedStats = { ...stats };
      
      // Recalculer les stats basé sur les nouveaux rêves
      const updatedDreams = dreams.map(dream => 
        dream.dream_id === dreamId ? { ...dream, privacy: newPrivacy } : dream
      );
      
      updatedStats.public_dreams = updatedDreams.filter(d => d.privacy === 'public').length;
      updatedStats.private_dreams = updatedDreams.filter(d => d.privacy === 'private').length;
      updatedStats.friends_only_dreams = updatedDreams.filter(d => d.privacy === 'friends_only').length;
      
      setStats(updatedStats);
      
      console.log(`✅ Statut du rêve #${dreamId} changé vers: ${newPrivacy}`);
      
    } catch (error) {
      console.error('Erreur changement privacy:', error);
      alert('Erreur lors du changement de statut. Veuillez réessayer.');
    }
  };

  if (err) {
    return (
      <div className="profile-error">
        <h3>{err}</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div>🌙 Chargement de vos rêves...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header du profil */}
      <div className="profile-header">
        <div className="profile-user-info">
          <div className="profile-avatar">
            {me?.username?.charAt(0)?.toUpperCase() || me?.email?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          
          <div className="profile-details">
            <h2 className="profile-username">
              {me?.username || 'Rêveur anonyme'}
            </h2>
            <p className="profile-email">
              📧 {me?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="profile-stat-icon">🌙</div>
          <div className="profile-stat-number">
            {stats.total_dreams || 0}
          </div>
          <div className="profile-stat-label">Total des rêves</div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon">🌍</div>
          <div className="profile-stat-number">
            {stats.public_dreams || 0}
          </div>
          <div className="profile-stat-label">Rêves publics</div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon">🔒</div>
          <div className="profile-stat-number">
            {stats.private_dreams || 0}
          </div>
          <div className="profile-stat-label">Rêves privés</div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon">👥</div>
          <div className="profile-stat-number">
            {stats.friends_only_dreams || 0}
          </div>
          <div className="profile-stat-label">Entre amis</div>
        </div>
      </div>

      {/* Titre de la section rêves */}
      <div className="profile-dreams-header">
        <h3 className="profile-dreams-title">
          🎨 Vos rêves ({dreams.length})
        </h3>
      </div>

      {/* Liste des rêves */}
      {dreams.length === 0 ? (
        <div className="profile-empty-dreams">
          <div className="profile-empty-icon">😴</div>
          <h4 className="profile-empty-title">Aucun rêve pour le moment</h4>
          <p>Créez votre premier rêve pour commencer votre journal onirique !</p>
          <button 
            onClick={() => navigate("/create-dream")}
            className="profile-create-button"
          >
            🌙 Créer mon premier rêve
          </button>
        </div>
      ) : (
        <div className="profile-dreams-grid">
          {dreams.map((dream) => (
            <div
              key={dream.dream_id}
              className="profile-dream-card"
            >
              {/* Image du rêve */}
              {dream.img_b64 && (
                <div className="profile-dream-image">
                  <img 
                    src={dream.img_b64} 
                    alt="Image du rêve"
                    className="profile-dream-img"
                  />
                </div>
              )}

              {/* Contenu du rêve */}
              <div className="profile-dream-content">
                {/* En-tête avec date et privacy MODIFIABLE */}
                <div className="profile-dream-header">
                  <div className="profile-dream-date">
                    📅 {formatDate(dream.date)}
                  </div>
                  
                  {/* 🆕 PRIVACY MODIFIABLE AVEC SELECT */}
                  <div className="profile-dream-privacy-selector">
                    <label className="profile-privacy-label">
                      {getPrivacyIcon(dream.privacy)} Visibilité :
                    </label>
                    <select 
                      value={dream.privacy}
                      onChange={(e) => handlePrivacyChange(dream.dream_id, e.target.value)}
                      className="profile-privacy-select"
                    >
                      <option value="public">🌍 Public</option>
                      <option value="friends_only">👥 Amis uniquement</option>
                      <option value="private">🔒 Privé</option>
                    </select>
                  </div>
                </div>

                {/* 🆕 AFFICHAGE DE L'ÉMOTION */}
                {(dream.emotion || dream.emotion_emoji) && (
                  <div className="profile-dream-emotion">
                    <div className="profile-emotion-label">
                      😊 Ambiance détectée :
                    </div>
                    <div className="profile-emotion-display">
                      <span className="profile-emotion-emoji">
                        {dream.emotion_emoji || '😐'}
                      </span>
                      <span className="profile-emotion-name">
                        {dream.emotion || 'Neutre'}
                      </span>
                      {dream.emotion_confidence && (
                        <span className="profile-emotion-confidence">
                          ({Math.round(dream.emotion_confidence * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Transcription */}
                <div className="profile-dream-transcription">
                  <h4 className="profile-dream-transcription-title">
                    💭 Votre récit
                  </h4>
                  <p className="profile-dream-transcription-text">
                    {dream.transcription}
                  </p>
                </div>

                {/* ID du rêve + Actions */}
                <div className="profile-dream-footer">
                  <div className="profile-dream-id">
                    Rêve #{dream.dream_id}
                  </div>
                  
                  {/* 🆕 BOUTON EXPORT */}
                  <button 
                    onClick={() => handleExportDream(dream.dream_id)}
                    className="profile-export-button"
                    title="Télécharger le rêve en HTML"
                  >
                    💾 Exporter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
