import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getFriendsList, 
  getMessagesWithFriend, 
  sendTextMessage,
  getShareableDreams,  // ✅ CORRECTION: Utiliser getShareableDreams au lieu de getUserDreams
  shareDreamWithFriend
} from "../services/api";
import SharedDreamMessage from "./SharedDreamMessage";
import "../styles/Messaging.css";

export default function Messaging({ currentUser }) {
  const navigate = useNavigate();
  const { username } = useParams();
  const messagesEndRef = useRef(null);
  
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userDreams, setUserDreams] = useState([]);
  const [loadingDreams, setLoadingDreams] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const loadFriends = async () => {
      setError("");
      try {
        const friendsList = await getFriendsList();
        setFriends(Array.isArray(friendsList) ? friendsList : []);
      } catch (err) {
        console.error("Erreur amis:", err);
        setError("Impossible de charger vos amis.");
      }
    };
    
    if (currentUser) {
      loadFriends();
    }
  }, [currentUser]);

  useEffect(() => {
    const loadThread = async () => {
      setError("");
      setMessages([]);
      if (!username) return;

      setLoading(true);
      try {
        const messagesList = await getMessagesWithFriend(username);
        setMessages(Array.isArray(messagesList) ? messagesList : []);
      } catch (err) {
        console.error("Erreur conversation:", err);
        if (err.response?.status === 403) {
          setError("Vous n'êtes pas amis avec cette personne.");
        } else if (err.response?.status === 404) {
          setError("Utilisateur introuvable.");
        } else {
          setError("Erreur lors du chargement de la conversation.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      loadThread();
    }
  }, [username, currentUser]);

  const openConversation = (friend) => {
    navigate(`/messaging/${encodeURIComponent(friend.username)}`);
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !text.trim()) return;

    setSending(true);
    try {
      const newMessage = await sendTextMessage(username, text.trim());
      setMessages((prev) => [...prev, newMessage]);
      setText("");
    } catch (err) {
      console.error("Erreur envoi:", err);
      if (err.response?.status === 403) {
        setError("Vous n'êtes pas amis avec cette personne.");
      } else {
        setError("Impossible d'envoyer le message.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleDreamShared = (sharedMessage) => {
    setMessages((prev) => [...prev, sharedMessage]);
  };

  const handleOpenShareModal = async () => {
    setShowShareModal(true);
    setLoadingDreams(true);
    try {
      const response = await getShareableDreams();  // ✅ CORRECTION
      const dreams = response?.dreams || response || [];
      console.log('🌅 Rêves partageables chargés:', dreams.length);
      setUserDreams(Array.isArray(dreams) ? dreams : []);
    } catch (err) {
      console.error('Erreur chargement rêves partageables:', err);
      setUserDreams([]);
    } finally {
      setLoadingDreams(false);
    }
  };

  const handleShareDream = async (dreamId) => {
    try {
      const result = await shareDreamWithFriend(username, dreamId, '');
      setMessages((prev) => [...prev, result]);
      setShowShareModal(false);
    } catch (err) {
      console.error('Erreur partage rêve:', err);
      setError('Impossible de partager le rêve.');
    }
  };

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

  const renderMessage = (message) => {
    const isOwnMessage = message.from_username === currentUser?.username;
    
    if (message.message_type === 'dream' && message.dream) {
      return (
        <SharedDreamMessage
          key={message.id}
          dream={message.dream}
          senderUsername={message.from_username}
          timestamp={message.created_at}
          isOwnMessage={isOwnMessage}
        />
      );
    }

    return (
      <div key={message.id} className={`message-item ${isOwnMessage ? 'own' : 'other'}`}>
        <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
          <div className="message-text">{message.text}</div>
          <div className="message-time">{formatTime(message.created_at)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="messaging-container">
      <div className="messaging-grid">
        
        {/* Sidebar - Liste des amis */}
        <aside className="messaging-sidebar">
          <div className="messaging-sidebar-header">
            <h3 className="messaging-sidebar-title">💬 Messagerie</h3>
            <span className="messaging-sidebar-badge">{friends.length}</span>
          </div>
          
          {friends.length === 0 ? (
            <div className="messaging-no-friends">
              <div className="messaging-no-friends-icon">👥</div>
              <p>Aucun ami pour le moment.</p>
              <button 
                onClick={() => navigate('/social')}
                className="messaging-find-friends-btn"
              >
                🔍 Trouver des amis
              </button>
            </div>
          ) : (
            <div className="messaging-friends-list">
              {friends.map((friend) => (
                <button
                  key={friend.id || friend.username}
                  onClick={() => openConversation(friend)}
                  className={`messaging-friend-item ${username === friend.username ? 'active' : ''}`}
                >
                  <div className="messaging-friend-avatar">
                    {friend.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="messaging-friend-info">
                    <div className="messaging-friend-name">{friend.username}</div>
                    <div className="messaging-friend-status">
                      {username === friend.username ? "Conversation active" : "Cliquer pour discuter"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Zone de conversation */}
        <section className="messaging-conversation">
          
          {/* Header de conversation */}
          <div className="messaging-conversation-header">
            <div>
              <h3 className="messaging-conversation-title">
                {username ? `💬 ${username}` : "💬 Messagerie"}
              </h3>
              {username && (
                <p className="messaging-conversation-subtitle">
                  Conversation privée
                </p>
              )}
            </div>
            
            {username && (
              <button
                onClick={handleOpenShareModal}
                className="messaging-share-dream-btn"
              >
                🌙 Partager un rêve
              </button>
            )}
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="messaging-error">
              ⚠️ {error}
            </div>
          )}

          {/* Zone des messages */}
          <div className="messaging-messages-area">
            {loading ? (
              <div className="messaging-loading">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <div>Chargement des messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="messaging-empty-state">
                {username ? (
                  <>
                    <div className="messaging-empty-icon">💬</div>
                    <h4 className="messaging-empty-title">Début de conversation</h4>
                    <p>Aucun message avec {username}. Commencez la conversation !</p>
                    <div className="messaging-empty-actions">
                      <button
                        onClick={handleOpenShareModal}
                        className="messaging-empty-btn primary"
                      >
                        🌙 Partager un rêve
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="messaging-empty-icon">🙋‍♂️</div>
                    <h4 className="messaging-empty-title">Choisissez un ami</h4>
                    <p>Sélectionnez un ami dans la liste pour commencer à discuter.</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="messaging-messages-list">
                  {messages.map(renderMessage)}
                </div>
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Zone de saisie */}
          <form onSubmit={handleSendText} className="messaging-input-form">
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={username ? "Tapez votre message..." : "Sélectionnez d'abord un ami"}
                disabled={!username || sending}
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText(e);
                  }
                }}
                className="messaging-textarea"
              />
            </div>
            
            <div className="messaging-input-actions">
              <button 
                disabled={!username || !text.trim() || sending} 
                type="submit"
                className={`messaging-send-btn ${!username || !text.trim() || sending ? 'disabled' : 'enabled'}`}
              >
                {sending ? (
                  <>
                    <div className="messaging-send-spinner" />
                    Envoi...
                  </>
                ) : (
                  <>📤 Envoyer</>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Modal de partage de rêve */}
      {showShareModal && (
        <div className="messaging-share-modal-overlay">
          <div className="messaging-share-modal">
            <div className="messaging-share-modal-header">
              <h3 className="messaging-share-modal-title">
                🌙 Partager un rêve avec {username}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="messaging-share-modal-close"
              >
                ×
              </button>
            </div>

            <div className="messaging-share-modal-content">
              {loadingDreams ? (
                <div className="messaging-share-modal-loading">
                  🔄 Chargement de vos rêves...
                </div>
              ) : userDreams.length === 0 ? (
                <div className="messaging-share-modal-empty">
                  <div className="messaging-share-modal-empty-icon">🌙</div>
                  <h4>Aucun rêve à partager</h4>
                  <p>Vous n'avez aucun rêve <strong>public</strong> ou <strong>visible aux amis</strong>.</p>
                  <p className="text-muted small">Les rêves privés ne peuvent pas être partagés.</p>
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      navigate('/create-dream');
                    }}
                    className="messaging-share-create-btn"
                  >
                    ✨ Créer un rêve
                  </button>
                </div>
              ) : (
                <div>
                <p className="messaging-share-description">
                Choisissez un rêve à partager avec {username} :
                </p>
                    <p className="text-muted small mb-3">
                      🔒 Seuls vos rêves <strong>publics</strong> et <strong>visibles aux amis</strong> peuvent être partagés.
                    </p>
                  
                  <div className="messaging-dreams-grid">
                    {userDreams.map((dream) => (
                      <div
                        key={dream.dream_id}
                        onClick={() => handleShareDream(dream.dream_id)}
                        className="messaging-dream-item"
                      >
                        {dream.img_b64 && (
                          <img 
                            src={dream.img_b64} 
                            alt="Rêve" 
                            className="messaging-dream-image"
                          />
                        )}
                        <div className="messaging-dream-info">
                          <div className="messaging-dream-header">
                            <div className="messaging-dream-date">
                              Rêve du {new Date(dream.date).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="messaging-dream-privacy">
                              {dream.privacy === 'public' ? '🌍 Public' : '👥 Amis'}
                            </div>
                          </div>
                          <p className="messaging-dream-text">
                            {dream.transcription || dream.reformed_prompt || 'Aucune description'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="messaging-share-modal-footer">
              <button
                onClick={() => setShowShareModal(false)}
                className="messaging-share-cancel-btn"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
