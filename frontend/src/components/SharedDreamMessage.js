// frontend/src/components/SharedDreamMessage.js
import React from "react";

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
    <div style={{
      maxWidth: "85%",
      alignSelf: isOwnMessage ? "flex-end" : "flex-start",
      marginBottom: "1rem"
    }}>
      <div style={{
        backgroundColor: isOwnMessage ? "#3b82f6" : "#ffffff",
        color: isOwnMessage ? "white" : "#333",
        borderRadius: "18px",
        padding: "0.75rem",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: isOwnMessage ? "none" : "1px solid #e5e7eb"
      }}>
        {/* Header du rêve partagé */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          fontSize: "0.85rem",
          opacity: 0.8
        }}>
          <span>🌙</span>
          <span style={{ fontWeight: "500" }}>
            {isOwnMessage ? "Vous avez" : `${senderUsername} a`} partagé un rêve
          </span>
          {dream.privacy && (
            <span style={{ marginLeft: "auto" }}>
              {getPrivacyIcon(dream.privacy)}
            </span>
          )}
        </div>

        {/* Contenu du rêve */}
        <div style={{
          backgroundColor: isOwnMessage ? "rgba(255,255,255,0.1)" : "#f8f9fa",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "0.5rem"
        }}>
          {/* Image du rêve */}
          {dream.img_b64 && (
            <div style={{
              marginBottom: "0.75rem",
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <img 
                src={dream.img_b64} 
                alt="Rêve partagé" 
                style={{ 
                  width: "100%", 
                  height: "150px",
                  objectFit: "cover"
                }} 
              />
            </div>
          )}

          {/* Transcription du rêve */}
          {dream.transcription && (
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{
                fontSize: "0.8rem",
                fontWeight: "600",
                marginBottom: "0.25rem",
                color: isOwnMessage ? "rgba(255,255,255,0.8)" : "#6b7280"
              }}>
                Récit du rêve :
              </div>
              <div style={{
                fontSize: "0.9rem",
                fontStyle: "italic",
                lineHeight: "1.4",
                color: isOwnMessage ? "rgba(255,255,255,0.95)" : "#374151"
              }}>
                "{dream.transcription}"
              </div>
            </div>
          )}

          {/* Date du rêve */}
          {dream.date && (
            <div style={{
              fontSize: "0.75rem",
              color: isOwnMessage ? "rgba(255,255,255,0.7)" : "#9ca3af",
              textAlign: "right"
            }}>
              Rêvé le {new Date(dream.date).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.75rem",
          color: isOwnMessage ? "rgba(255,255,255,0.7)" : "#9ca3af"
        }}>
          <span>ID: {dream.dream_id}</span>
          <span>{formatTime(timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default SharedDreamMessage;
