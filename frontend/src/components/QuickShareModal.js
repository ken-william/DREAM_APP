import React, { useState, useEffect } from "react";
import { getFriendsList, shareDreamWithFriend } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/QuickShareModal.css";

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
    <div className="quick-share-overlay">
      <div className="quick-share-modal">
        {/* Header */}
        <div className="quick-share-header">
          <h3 className="quick-share-title">
            📤 Partager ce rêve
          </h3>
          <button
            onClick={onClose}
            className="quick-share-close"
          >
            ×
          </button>
        </div>

        {/* Contenu */}
        <div className="quick-share-content">
          {/* Preview du rêve */}
          {dream && (
            <div className="dream-preview">
              <div className="dream-preview-header">
                {dream.img_b64 && (
                  <img 
                    src={dream.img_b64} 
                    alt="Rêve" 
                    className="dream-preview-image"
                  />
                )}
                <div className="dream-preview-info">
                  <div className="dream-preview-author">
                    Rêve de {dream.user?.username}
                  </div>
                  <div className="dream-preview-privacy">
                    {dream.privacy === 'public' ? '🌍 Public' : '👥 Amis'}
                  </div>
                </div>
              </div>
              <p className="dream-preview-text">
                "{dream.transcription?.substring(0, 100)}..."
              </p>
            </div>
          )}

          {/* Message d'accompagnement */}
          <div className="message-input-section">
            <label className="message-input-label">
              💬 Message d'accompagnement :
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Regarde ce rêve de ${dream?.user?.username} !`}
              rows={3}
              className="message-input-textarea"
            />
          </div>

          {error && (
            <div className="share-error-message">
              {error}
            </div>
          )}

          {/* Liste des amis */}
          {loading ? (
            <div className="friends-loading">
              🔄 Chargement de vos amis...
            </div>
          ) : friends.length === 0 ? (
            <div className="friends-empty">
              <div className="friends-empty-icon">👥</div>
              <p>Aucun ami trouvé.</p>
            </div>
          ) : (
            <div>
              <h4 className="friends-list-title">
                👥 Choisir un ami ({friends.length}) :
              </h4>
              
              <div className="friends-list-container">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handleShare(friend)}
                    disabled={sharing}
                    className="friend-item"
                  >
                    <div className="friend-avatar">
                      {friend.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="friend-name">
                      {friend.username}
                    </span>
                    {sharing && <span className="friend-sharing-icon">📤</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="quick-share-footer">
          <button
            onClick={onClose}
            className="quick-share-cancel"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickShareModal;
