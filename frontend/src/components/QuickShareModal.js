// frontend/src/components/QuickShareModal.js
import React, { useState, useEffect } from "react";
import { getFriendsList, shareDreamWithFriend } from "../services/api";
import { useNavigate } from "react-router-dom";

const QuickShareModal = ({ show, onClose, dream, onDreamShared }) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  // Charger les amis
  useEffect(() => {
    if (show) {
      loadFriends();
      setMessage("");
      setError("");
    }
  }, [show]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const friendsList = await getFriendsList();
      setFriends(friendsList || []);
    } catch (err) {
      console.error('Erreur chargement amis:', err);
      setError("Impossible de charger vos amis.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (friend) => {
    if (!dream) return;

    setSharing(true);
    setError("");

    try {
      const result = await shareDreamWithFriend(
        friend.username, 
        dream.dream_id, 
        message || `Regarde ce rêve de ${dream.user?.username} !`
      );
      
      if (onDreamShared) {
        onDreamShared(result, friend);
      }
      
      // Fermer le modal
      onClose();
      
      // Rediriger vers la messagerie avec cet ami
      navigate(`/messaging/${encodeURIComponent(friend.username)}`);
      
    } catch (err) {
      console.error('Erreur partage rêve:', err);
      if (err.response?.status === 403) {
        setError("Vous n'avez pas le droit de partager ce rêve.");
      } else {
        setError("Impossible de partager le rêve. Réessayez.");
      }
    } finally {
      setSharing(false);
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "500px",
        maxHeight: "80vh",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Header */}
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ margin: 0, color: "#374151" }}>
            📤 Partager ce rêve
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6b7280"
            }}
          >
            ×
          </button>
        </div>

        {/* Contenu */}
        <div style={{
          padding: "1.5rem",
          maxHeight: "60vh",
          overflowY: "auto"
        }}>
          {/* Preview du rêve */}
          {dream && (
            <div style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
                {dream.img_b64 && (
                  <img 
                    src={dream.img_b64} 
                    alt="Rêve" 
                    style={{ 
                      width: "60px", 
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "8px"
                    }} 
                  />
                )}
                <div>
                  <div style={{ fontWeight: "600", color: "#374151" }}>
                    Rêve de {dream.user?.username}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    {dream.privacy === 'public' ? '🌍 Public' : '👥 Amis'}
                  </div>
                </div>
              </div>
              <p style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "#6b7280",
                fontStyle: "italic",
                lineHeight: "1.4"
              }}>
                "{dream.transcription?.substring(0, 100)}..."
              </p>
            </div>
          )}

          {/* Message d'accompagnement */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "500",
              color: "#374151"
            }}>
              💬 Message d'accompagnement :
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Regarde ce rêve de ${dream?.user?.username} !`}
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                resize: "vertical",
                fontSize: "0.9rem"
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "0.75rem",
              borderRadius: "6px",
              marginBottom: "1rem"
            }}>
              {error}
            </div>
          )}

          {/* Liste des amis */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
              🔄 Chargement de vos amis...
            </div>
          ) : friends.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
              <p>Aucun ami trouvé.</p>
            </div>
          ) : (
            <div>
              <h4 style={{ marginBottom: "1rem", color: "#374151" }}>
                👥 Choisir un ami ({friends.length}) :
              </h4>
              
              <div style={{
                display: "grid",
                gap: "0.75rem",
                maxHeight: "200px",
                overflowY: "auto"
              }}>
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handleShare(friend)}
                    disabled={sharing}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      cursor: sharing ? "not-allowed" : "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.2s",
                      opacity: sharing ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!sharing) {
                        e.target.style.backgroundColor = "#f3f4f6";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#fff";
                    }}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: "bold"
                    }}>
                      {friend.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span style={{ fontWeight: "500", flex: 1 }}>
                      {friend.username}
                    </span>
                    {sharing && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>📤</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "1.5rem",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.75rem 1.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#374151",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickShareModal;
