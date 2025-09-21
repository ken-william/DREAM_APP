import React from "react";
import "../styles/SharedDreamMessage.css";

const SharedDreamMessage = ({ dream, senderUsername, timestamp, isOwnMessage = false }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public':
        return '🌍';
      case 'friends_only':
        return '👥';
      case 'private':
        return '🔒';
      default:
        return '🔒';
    }
  };

  return (
    <div className={`shared-dream-message ${isOwnMessage ? 'own' : 'other'}`}>
      <div className={`shared-dream-bubble ${isOwnMessage ? 'own' : 'other'}`}>
        {/* Header du rêve partagé */}
        <div className="shared-dream-header">
          <span>🌙</span>
          <span className="shared-dream-sender">
            {isOwnMessage ? "Vous avez" : `${senderUsername} a`} partagé un rêve
          </span>
          {dream.privacy && (
            <span className="shared-dream-privacy">
              {getPrivacyIcon(dream.privacy)}
            </span>
          )}
        </div>

        {/* Contenu du rêve */}
        <div className={`shared-dream-content ${isOwnMessage ? 'own' : 'other'}`}>
          {/* Image du rêve */}
          {dream.img_b64 && (
            <div className="shared-dream-image">
              <img 
                src={dream.img_b64} 
                alt="Rêve partagé" 
                className="shared-dream-img"
              />
            </div>
          )}

          {/* Transcription du rêve */}
          {dream.transcription && (
            <div className="shared-dream-transcription">
              <div className={`shared-dream-transcription-label ${isOwnMessage ? 'own' : 'other'}`}>
                Récit du rêve :
              </div>
              <div className={`shared-dream-transcription-text ${isOwnMessage ? 'own' : 'other'}`}>
                "{dream.transcription}"
              </div>
            </div>
          )}

          {/* Date du rêve */}
          {dream.date && (
            <div className={`shared-dream-date ${isOwnMessage ? 'own' : 'other'}`}>
              Rêvé le {new Date(dream.date).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`shared-dream-footer ${isOwnMessage ? 'own' : 'other'}`}>
          <span>ID: {dream.dream_id}</span>
          <span>{formatTime(timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default SharedDreamMessage;
