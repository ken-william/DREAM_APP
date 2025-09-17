// frontend/src/components/ModernDreamCard.js
import React, { useState, useEffect } from "react";
import QuickShareModal from "./QuickShareModal";
import DreamComments from "./DreamComments";
import { toggleDreamLike, updateDreamPrivacy } from "../services/api";

const ModernDreamCard = ({ dream, showAuthor = true, currentUser = null, onDreamUpdate }) => {
  const [showQuickShareModal, setShowQuickShareModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 🆕 États pour la privacy
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [currentPrivacy, setCurrentPrivacy] = useState(dream.privacy);
  
  // États locaux pour les likes (pour mise à jour immédiate)
  const [localLikesCount, setLocalLikesCount] = useState(dream.likes_count || 0);
  const [localUserLiked, setLocalUserLiked] = useState(dream.user_liked || false);

  // Fermer le dropdown privacy si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPrivacyDropdown) {
        setShowPrivacyDropdown(false);
      }
    };

    if (showPrivacyDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showPrivacyDropdown]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Aujourd'hui";
    if (diffDays === 2) return "Hier";
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public': return '🌍';
      case 'friends_only': return '👥';
      case 'private': return '🔒';
      default: return '🔒';
    }
  };

  const getPrivacyLabel = (privacy) => {
    switch (privacy) {
      case 'public': return 'Public';
      case 'friends_only': return 'Amis seulement';
      case 'private': return 'Privé';
      default: return 'Privé';
    }
  };

  const handlePrivacyChange = async (newPrivacy) => {
    if (!currentUser || dream.user?.username !== currentUser.username || isUpdatingPrivacy) {
      return;
    }

    setIsUpdatingPrivacy(true);
    
    try {
      const result = await updateDreamPrivacy(dream.dream_id, newPrivacy);
      setCurrentPrivacy(newPrivacy);
      setShowPrivacyDropdown(false);
      
      // Notifier le parent pour mettre à jour l'affichage
      if (onDreamUpdate) {
        onDreamUpdate({
          ...dream,
          privacy: newPrivacy
        });
      }
      
    } catch (error) {
      console.error('Erreur changement privacy:', error);
      // Afficher un message d'erreur ici si nécessaire
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleLikeClick = async () => {
    if (!currentUser || isLiking) return;
    
    setIsLiking(true);
    
    // Mise à jour optimiste de l'UI
    const newUserLiked = !localUserLiked;
    const newLikesCount = newUserLiked ? localLikesCount + 1 : localLikesCount - 1;
    
    setLocalUserLiked(newUserLiked);
    setLocalLikesCount(newLikesCount);
    
    try {
      const result = await toggleDreamLike(dream.dream_id);
      
      // Mettre à jour avec les vraies données du serveur
      setLocalLikesCount(result.total_likes);
      setLocalUserLiked(result.user_liked);
      
      if (onDreamUpdate) {
        onDreamUpdate({
          ...dream,
          likes_count: result.total_likes,
          user_liked: result.user_liked
        });
      }
      
    } catch (error) {
      console.error('Erreur like:', error);
      // Revenir à l'état précédent en cas d'erreur
      setLocalUserLiked(!newUserLiked);
      setLocalLikesCount(localLikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShareClick = () => {
    setShowQuickShareModal(true);
  };

  const handleCommentClick = () => {
    setShowComments(true);
  };

  const handleDreamShared = (result, friend) => {
    console.log(`Rêve partagé avec ${friend.username} !`);
  };

  // Vérifier si l'utilisateur peut partager ce rêve
  const canShare = currentUser && (
    dream.privacy === 'public' || 
    (dream.privacy === 'friends_only' && dream.user?.username === currentUser) ||
    dream.user?.username === currentUser
  );

  return (
    <>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'scale(1)',
        marginBottom: '2rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
      }}
      >
        {/* Header avec auteur */}
        {showAuthor && dream.user && (
          <div style={{
            padding: '1.5rem 1.5rem 0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {/* Avatar utilisateur */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}>
                {dream.user.username?.[0]?.toUpperCase() || '?'}
              </div>
              
              {/* Infos utilisateur */}
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#1f2937',
                  fontSize: '1rem',
                  marginBottom: '0.25rem'
                }}>
                  {dream.user.username}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#6b7280'
                }}>
                  <span>{formatDate(dream.date)}</span>
                  <span>•</span>
                  
                  {/* Sélecteur de privacy */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {/* Si c'est le rêve de l'utilisateur, afficher un dropdown */}
                    {currentUser && dream.user?.username === currentUser.username ? (
                      <>
                        <button
                          onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                          disabled={isUpdatingPrivacy}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '12px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.8rem',
                            color: '#3b82f6',
                            cursor: isUpdatingPrivacy ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {getPrivacyIcon(currentPrivacy)}
                          <span>{getPrivacyLabel(currentPrivacy)}</span>
                          {!isUpdatingPrivacy && <span style={{ fontSize: '0.7rem' }}>▼</span>}
                          {isUpdatingPrivacy && (
                            <div style={{
                              width: '12px',
                              height: '12px',
                              border: '2px solid rgba(59, 130, 246, 0.3)',
                              borderTop: '2px solid #3b82f6',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                          )}
                        </button>
                        
                        {/* Dropdown menu */}
                        {showPrivacyDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 50,
                            marginTop: '0.5rem',
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            minWidth: '180px',
                            overflow: 'hidden'
                          }}>
                            {[
                              { value: 'private', label: 'Privé', icon: '🔒', desc: 'Visible par vous seul' },
                              { value: 'friends_only', label: 'Amis seulement', icon: '👥', desc: 'Visible par vos amis' },
                              { value: 'public', label: 'Public', icon: '🌍', desc: 'Visible par tous' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handlePrivacyChange(option.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: currentPrivacy === option.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem'
                                }}
                                onMouseEnter={(e) => {
                                  if (currentPrivacy !== option.value) {
                                    e.target.style.background = 'rgba(0, 0, 0, 0.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (currentPrivacy !== option.value) {
                                    e.target.style.background = 'transparent';
                                  }
                                }}
                              >
                                <span style={{ fontSize: '1rem' }}>{option.icon}</span>
                                <div>
                                  <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '0.125rem'
                                  }}>
                                    {option.label}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280'
                                  }}>
                                    {option.desc}
                                  </div>
                                </div>
                                {currentPrivacy === option.value && (
                                  <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '0.8rem',
                                    color: '#3b82f6'
                                  }}>
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Si ce n'est pas le rêve de l'utilisateur, affichage simple */
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {getPrivacyIcon(currentPrivacy)}
                        <span style={{ textTransform: 'capitalize' }}>
                          {getPrivacyLabel(currentPrivacy)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu 3 points (optionnel) */}
            <button style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '12px',
              color: '#9ca3af',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(156, 163, 175, 0.1)';
              e.target.style.color = '#6b7280';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#9ca3af';
            }}
            >
              ⋯
            </button>
          </div>
        )}

        {/* Image du rêve */}
        {dream.img_b64 && (
          <div style={{
            position: 'relative',
            margin: '1rem 1.5rem',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'linear-gradient(45deg, #f3f4f6, #e5e7eb)',
            aspectRatio: '16/10'
          }}>
            {!imageLoaded && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(45deg, #f3f4f6, #e5e7eb)',
                color: '#9ca3af'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            )}
            <img
              src={dream.img_b64}
              alt="Rêve visualisé"
              onLoad={() => setImageLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.3s ease',
                opacity: imageLoaded ? 1 : 0
              }}
            />
            
            {/* Overlay gradient subtil */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.1))',
              pointerEvents: 'none'
            }} />
          </div>
        )}

        {/* Contenu textuel */}
        <div style={{ padding: '0 1.5rem 1rem 1.5rem' }}>
          {/* Prompt reformé */}
          {dream.reformed_prompt && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ✨ Interprétation IA
              </div>
              <p style={{
                margin: 0,
                color: '#374151',
                lineHeight: '1.6',
                fontSize: '0.95rem'
              }}>
                {dream.reformed_prompt}
              </p>
            </div>
          )}

          {/* Transcription */}
          {dream.transcription && (
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎙️ Récit original
              </div>
              <p style={{
                margin: 0,
                color: '#374151',
                lineHeight: '1.7',
                fontSize: '1rem'
              }}>
                {dream.transcription}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Bouton Like */}
              <button
                onClick={handleLikeClick}
                disabled={!currentUser || isLiking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '25px',
                  border: 'none',
                  background: localUserLiked 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'rgba(239, 68, 68, 0.1)',
                  color: localUserLiked ? 'white' : '#ef4444',
                  cursor: (!currentUser || isLiking) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: localUserLiked 
                    ? '0 4px 15px rgba(239, 68, 68, 0.3)' 
                    : '0 2px 8px rgba(239, 68, 68, 0.15)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!isLiking && currentUser) {
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>
                  {localUserLiked ? '❤️' : '🤍'}
                </span>
                {localLikesCount > 0 && (
                  <span style={{
                    background: localUserLiked 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(239, 68, 68, 0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '700'
                  }}>
                    {localLikesCount}
                  </span>
                )}
              </button>

              {/* Bouton Commentaires */}
              <button
                onClick={handleCommentClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '25px',
                  border: 'none',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                {dream.comments_count > 0 && (
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '700'
                  }}>
                    {dream.comments_count}
                  </span>
                )}
              </button>
            </div>

            {/* Bouton Partager */}
            {canShare && (
              <button
                onClick={handleShareClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '25px',
                  border: 'none',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.background = 'rgba(16, 185, 129, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>📤</span>
                Partager
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickShareModal
        show={showQuickShareModal}
        onClose={() => setShowQuickShareModal(false)}
        dream={dream}
        onDreamShared={handleDreamShared}
      />
      
      <DreamComments
        show={showComments}
        onClose={() => setShowComments(false)}
        dreamId={dream.dream_id}
        dreamTitle={`Rêve de ${dream.user?.username}`}
      />
    </>
  );
};

export default ModernDreamCard;
