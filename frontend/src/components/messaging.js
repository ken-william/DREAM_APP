// frontend/src/components/messaging.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getFriendsList, 
  getMessagesWithFriend, 
  sendTextMessage,
  getUserDreams,
  shareDreamWithFriend
} from "../services/api";
import SharedDreamMessage from "./SharedDreamMessage";

export default function Messaging({ currentUser }) {
  const navigate = useNavigate();
  const { username } = useParams(); // ami sélectionné (optionnel)
  const messagesEndRef = useRef(null);
  
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Modal de partage de rêve
  const [showShareModal, setShowShareModal] = useState(false);
  const [userDreams, setUserDreams] = useState([]);
  const [loadingDreams, setLoadingDreams] = useState(false);

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Redirige vers login si pas de token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Charger la liste d'amis
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

  // Charger la conversation si un ami est sélectionné
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
    // Ajouter le message de rêve partagé à la conversation
    setMessages((prev) => [...prev, sharedMessage]);
  };

  const handleOpenShareModal = async () => {
    setShowShareModal(true);
    setLoadingDreams(true);
    try {
      const dreams = await getUserDreams();
      setUserDreams(Array.isArray(dreams) ? dreams : []);
    } catch (err) {
      console.error('Erreur chargement rêves:', err);
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

    // Message texte classique
    return (
      <div
        key={message.id}
        style={{
          alignSelf: isOwnMessage ? "flex-end" : "flex-start",
          maxWidth: "70%",
          marginBottom: "1rem"
        }}
      >
        <div style={{
          backgroundColor: isOwnMessage ? "#3b82f6" : "#fff",
          color: isOwnMessage ? "white" : "#374151",
          padding: "0.75rem 1rem",
          borderRadius: "18px",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          border: isOwnMessage ? "none" : "1px solid #e5e7eb"
        }}>
          <div style={{ marginBottom: "0.25rem" }}>
            {message.text}
          </div>
          <div style={{ 
            fontSize: "0.75rem", 
            opacity: 0.7,
            textAlign: "right"
          }}>
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: "1rem",
      maxWidth: "1400px",
      margin: "0 auto",
      height: "calc(100vh - 100px)"
    }}>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "320px 1fr", 
        gap: "1rem",
        height: "100%"
      }}>
        
        {/* Sidebar - Liste des amis */}
        <aside style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1.5rem",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem"
          }}>
            <h3 style={{ margin: 0, color: "#374151" }}>
              💬 Messagerie
            </h3>
            <span style={{
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: "bold"
            }}>
              {friends.length}
            </span>
          </div>
          
          {friends.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2rem 1rem",
              color: "#6b7280",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
              <p style={{ marginBottom: "1rem" }}>Aucun ami pour le moment.</p>
              <button 
                onClick={() => navigate('/social')}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                🔍 Trouver des amis
              </button>
            </div>
          ) : (
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "0.5rem",
              overflowY: "auto",
              flex: 1
            }}>
              {friends.map((friend) => (
                <button
                  key={friend.id || friend.username}
                  onClick={() => openConversation(friend)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    border: username === friend.username ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    backgroundColor: username === friend.username ? "#eff6ff" : "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: "bold",
                    flexShrink: 0
                  }}>
                    {friend.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: "600", 
                      color: "#374151",
                      marginBottom: "0.25rem"
                    }}>
                      {friend.username}
                    </div>
                    <div style={{ 
                      fontSize: "0.85rem", 
                      color: "#6b7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {username === friend.username ? "Conversation active" : "Cliquer pour discuter"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Zone de conversation */}
        <section style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          
          {/* Header de conversation */}
          <div style={{
            borderBottom: "1px solid #e5e7eb",
            padding: "1.25rem 1.5rem",
            backgroundColor: "#f9fafb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3 style={{ margin: 0, color: "#374151", marginBottom: "0.25rem" }}>
                {username ? `💬 ${username}` : "💬 Messagerie"}
              </h3>
              {username && (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
                  Conversation privée
                </p>
              )}
            </div>
            
            {/* Bouton partager un rêve */}
            {username && (
              <button
                onClick={handleOpenShareModal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.9rem"
                }}
              >
                🌙 Partager un rêve
              </button>
            )}
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "0.75rem 1.5rem",
              margin: "1rem",
              borderRadius: "8px",
              fontSize: "0.9rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Zone des messages */}
          <div style={{
            flex: 1,
            padding: "1.5rem",
            overflowY: "auto",
            backgroundColor: "#fafafa",
            display: "flex",
            flexDirection: "column",
            minHeight: 0
          }}>
            {loading ? (
              <div style={{ 
                textAlign: "center", 
                padding: "3rem", 
                color: "#6b7280",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1
              }}>
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <div>Chargement des messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "3rem", 
                color: "#6b7280",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1
              }}>
                {username ? (
                  <>
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💬</div>
                    <h4 style={{ marginBottom: "0.5rem", color: "#374151" }}>
                      Début de conversation
                    </h4>
                    <p style={{ marginBottom: "1.5rem" }}>
                      Aucun message avec {username}. Commencez la conversation !
                    </p>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button
                        onClick={handleOpenShareModal}
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#8b5cf6",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                      >
                        🌙 Partager un rêve
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🙋‍♂️</div>
                    <h4 style={{ marginBottom: "0.5rem", color: "#374151" }}>
                      Choisissez un ami
                    </h4>
                    <p>
                      Sélectionnez un ami dans la liste pour commencer à discuter.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {messages.map(renderMessage)}
                </div>
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Zone de saisie */}
          <form 
            onSubmit={handleSendText} 
            style={{ 
              borderTop: "1px solid #e5e7eb",
              padding: "1.25rem 1.5rem",
              backgroundColor: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "1rem"
            }}
          >
            {/* Zone de texte au-dessus */}
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
                style={{ 
                  width: "100%", 
                  padding: "0.75rem 1rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  outline: "none",
                  fontSize: "0.9rem",
                  resize: "vertical",
                  minHeight: "80px",
                  maxHeight: "150px",
                  fontFamily: "inherit"
                }}
              />
            </div>
            
            {/* Boutons en bas */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button 
                disabled={!username || !text.trim() || sending} 
                type="submit"
                style={{
                  backgroundColor: (!username || !text.trim() || sending) ? "#d1d5db" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "0.75rem 1.5rem",
                  cursor: (!username || !text.trim() || sending) ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  minWidth: "120px"
                }}
              >
                {sending ? (
                  <>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }} />
                    Envoi...
                  </>
                ) : (
                  <>
                    📤 Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Modal de partage de rêve simplifié */}
      {showShareModal && (
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
                🌙 Partager un rêve avec {username}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
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
              {loadingDreams ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                  🔄 Chargement de vos rêves...
                </div>
              ) : userDreams.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌙</div>
                  <p>Aucun rêve à partager.</p>
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      navigate('/create-dream');
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    ✨ Créer un rêve
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                    Choisissez un rêve à partager avec {username} :
                  </p>
                  
                  <div style={{
                    display: "grid",
                    gap: "1rem",
                    maxHeight: "400px",
                    overflowY: "auto"
                  }}>
                    {userDreams.map((dream) => (
                      <div
                        key={dream.dream_id}
                        onClick={() => handleShareDream(dream.dream_id)}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          padding: "1rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          backgroundColor: "#fff"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f3f4f6";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#fff";
                        }}
                      >
                        {dream.img_b64 && (
                          <img 
                            src={dream.img_b64} 
                            alt="Rêve" 
                            style={{ 
                              width: "80px", 
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              flexShrink: 0
                            }} 
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "0.25rem"
                          }}>
                            Rêve du {new Date(dream.date).toLocaleDateString('fr-FR')}
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: "0.9rem",
                            color: "#6b7280",
                            lineHeight: "1.4",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical"
                          }}>
                            {dream.transcription || dream.reformed_prompt || 'Aucune description'}
                          </p>
                        </div>
                      </div>
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
                onClick={() => setShowShareModal(false)}
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
      )}

      {/* CSS pour l'animation de loading */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
