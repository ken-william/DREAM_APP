// frontend/src/components/DreamComments.js
import React, { useState, useEffect } from "react";
import { getDreamComments, addDreamComment } from "../services/api";

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
      setComments(prev => [comment, ...prev]); // Ajouter en haut
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
        maxWidth: "600px",
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
            💬 Commentaires {dreamTitle && `- ${dreamTitle}`}
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

        {/* Zone commentaires */}
        <div style={{
          padding: "1.5rem",
          maxHeight: "50vh",
          overflowY: "auto"
        }}>
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

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
              🔄 Chargement des commentaires...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
              <p>Aucun commentaire pour le moment.</p>
              <p style={{ fontSize: "0.9rem" }}>Soyez le premier à commenter ce rêve !</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}>
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}>
                        {comment.user?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        {comment.user?.username || 'Utilisateur'}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    color: "#374151",
                    lineHeight: "1.5"
                  }}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone d'ajout de commentaire */}
        <form 
          onSubmit={handleSubmitComment}
          style={{
            padding: "1.5rem",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb"
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajoutez un commentaire..."
              rows={3}
              maxLength={500}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                resize: "vertical",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
            <div style={{ 
              fontSize: "0.75rem", 
              color: "#6b7280",
              textAlign: "right",
              marginTop: "0.25rem"
            }}>
              {newComment.length}/500
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button
              type="button"
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
              Fermer
            </button>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              style={{
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "8px",
                backgroundColor: (!newComment.trim() || submitting) ? "#d1d5db" : "#3b82f6",
                color: "white",
                cursor: (!newComment.trim() || submitting) ? "not-allowed" : "pointer",
                fontWeight: "500"
              }}
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
