import React, { useState, useEffect } from "react";
import { getDreamComments, addDreamComment } from "../services/api";
import "../styles/DreamComments.css";

const DreamComments = ({ show, onClose, dreamId, dreamTitle }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show && dreamId) {
      loadComments();
    }
  }, [show, dreamId]);

  const loadComments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDreamComments(dreamId);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Erreur chargement commentaires:', err);
      setError("Impossible de charger les commentaires.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const comment = await addDreamComment(dreamId, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error('Erreur ajout commentaire:', err);
      setError("Impossible d'ajouter le commentaire.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (!show) return null;

  return (
    <div className="dream-comments-overlay">
      <div className="dream-comments-modal">
        {/* Header */}
        <div className="dream-comments-header">
          <h3 className="dream-comments-title">
            💬 Commentaires {dreamTitle && `- ${dreamTitle}`}
          </h3>
          <button
            onClick={onClose}
            className="dream-comments-close"
          >
            ×
          </button>
        </div>

        {/* Zone commentaires */}
        <div className="dream-comments-content">
          {error && (
            <div className="comments-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="comments-loading">
              🔄 Chargement des commentaires...
            </div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">
              <div className="comments-empty-icon">💬</div>
              <p>Aucun commentaire pour le moment.</p>
              <p className="comments-empty-subtitle">Soyez le premier à commenter ce rêve !</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-user-info">
                      <div className="comment-avatar">
                        {comment.user?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="comment-username">
                        {comment.user?.username || 'Utilisateur'}
                      </span>
                    </div>
                    <span className="comment-time">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="comment-content">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone d'ajout de commentaire */}
        <form onSubmit={handleSubmitComment} className="dream-comments-form">
          <div className="comment-textarea-container">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajoutez un commentaire..."
              rows={3}
              maxLength={500}
              disabled={submitting}
              className="comment-textarea"
            />
            <div className="comment-char-count">
              {newComment.length}/500
            </div>
          </div>
          
          <div className="comment-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="comment-form-button cancel"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className={`comment-form-button submit ${(!newComment.trim() || submitting) ? 'disabled' : 'enabled'}`}
            >
              {submitting ? "📤 Envoi..." : "💬 Commenter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DreamComments;
