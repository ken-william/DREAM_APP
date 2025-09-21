import React, { useState, useEffect } from "react";
import QuickShareModal from "./QuickShareModal";
import DreamComments from "./DreamComments";
import { toggleDreamLike, updateDreamPrivacy } from "../services/api";
import "../styles/DreamCard.css";

const ModernDreamCard = ({ dream, showAuthor = true, currentUser = null, onDreamUpdate }) => {
  const [showQuickShareModal, setShowQuickShareModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [currentPrivacy, setCurrentPrivacy] = useState(dream.privacy);
  const [localLikesCount, setLocalLikesCount] = useState(dream.likes_count || 0);
  const [localUserLiked, setLocalUserLiked] = useState(dream.user_liked || false);

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
      
      if (onDreamUpdate) {
        onDreamUpdate({
          ...dream,
          privacy: newPrivacy
        });
      }
      
    } catch (error) {
      console.error('Erreur changement privacy:', error);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleLikeClick = async () => {
    if (!currentUser || isLiking) return;
    
    setIsLiking(true);
    
    const newUserLiked = !localUserLiked;
    const newLikesCount = newUserLiked ? localLikesCount + 1 : localLikesCount - 1;
    
    setLocalUserLiked(newUserLiked);
    setLocalLikesCount(newLikesCount);
    
    try {
      const result = await toggleDreamLike(dream.dream_id);
      
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
      setLocalUserLiked(!newUserLiked);
      setLocalLikesCount(localLikesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShareClick = () => setShowQuickShareModal(true);
  const handleCommentClick = () => setShowComments(true);
  const handleDreamShared = (result, friend) => {
    console.log(`Rêve partagé avec ${friend.username} !`);
  };

  const canShare = currentUser && (
    dream.privacy === 'public' || 
    (dream.privacy === 'friends_only' && dream.user?.username === currentUser) ||
    dream.user?.username === currentUser
  );

  const privacyOptions = [
    { value: 'private', label: 'Privé', icon: '🔒', desc: 'Visible par vous seul' },
    { value: 'friends_only', label: 'Amis seulement', icon: '👥', desc: 'Visible par vos amis' },
    { value: 'public', label: 'Public', icon: '🌍', desc: 'Visible par tous' }
  ];

  return (
    <>
      <div className="dream-card">
        {/* Header avec auteur */}
        {showAuthor && dream.user && (
          <div className="dream-card-header">
            <div className="dream-author-info">
              <div className="dream-author-avatar">
                {dream.user.username?.[0]?.toUpperCase() || '?'}
              </div>
              
              <div className="dream-author-details">
                <h4>{dream.user.username}</h4>
                <div className="dream-author-meta">
                  <span>{formatDate(dream.date)}</span>
                  <span>•</span>
                  
                  <div className="privacy-selector">
                    {currentUser && dream.user?.username === currentUser.username ? (
                      <>
                        <button
                          className="privacy-button"
                          onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                          disabled={isUpdatingPrivacy}
                        >
                          {getPrivacyIcon(currentPrivacy)}
                          <span>{getPrivacyLabel(currentPrivacy)}</span>
                          {!isUpdatingPrivacy && <span>▼</span>}
                          {isUpdatingPrivacy && <div className="dream-loading-spinner" />}
                        </button>
                        
                        {showPrivacyDropdown && (
                          <div className="privacy-dropdown">
                            {privacyOptions.map((option) => (
                              <button
                                key={option.value}
                                className={`privacy-option ${currentPrivacy === option.value ? 'active' : ''}`}
                                onClick={() => handlePrivacyChange(option.value)}
                              >
                                <span className="privacy-option-icon">{option.icon}</span>
                                <div>
                                  <div className="privacy-option-label">{option.label}</div>
                                  <div className="privacy-option-desc">{option.desc}</div>
                                </div>
                                {currentPrivacy === option.value && (
                                  <span className="privacy-option-check">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="privacy-display">
                        {getPrivacyIcon(currentPrivacy)}
                        <span>{getPrivacyLabel(currentPrivacy)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button className="dream-menu-button">⋯</button>
          </div>
        )}

        {/* Image du rêve */}
        {dream.img_b64 && (
          <div className="dream-image-container">
            {!imageLoaded && (
              <div className="dream-image-loading">
                <div className="dream-image-spinner" />
              </div>
            )}
            <img
              src={dream.img_b64}
              alt="Rêve visualisé"
              className={`dream-image ${imageLoaded ? 'loaded' : 'loading'}`}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="dream-image-overlay" />
          </div>
        )}

        {/* Contenu textuel */}
        <div className="dream-content">
          {/* 🆕 AFFICHAGE DE L'ÉMOTION */}
          {(dream.emotion || dream.emotion_emoji) && (
            <div className="dream-emotion">
              <div className="dream-emotion-label">
                😊 Ambiance détectée
              </div>
              <div className="dream-emotion-display">
                <span className="dream-emotion-emoji">
                  {dream.emotion_emoji || '😐'}
                </span>
                <div className="dream-emotion-details">
                  <span className="dream-emotion-name">
                    {dream.emotion || 'Neutre'}
                  </span>
                  {dream.emotion_confidence && (
                    <span className="dream-emotion-confidence">
                      {Math.round(dream.emotion_confidence * 100)}% de confiance
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prompt reformé */}
          {dream.reformed_prompt && (
            <div className="dream-interpretation">
              <div className="dream-interpretation-label">
                ✨ Interprétation IA
              </div>
              <p className="dream-interpretation-text">
                {dream.reformed_prompt}
              </p>
            </div>
          )}

          {/* Transcription */}
          {dream.transcription && (
            <div className="dream-transcription">
              <div className="dream-transcription-label">
                🎙️ Récit original
              </div>
              <p className="dream-transcription-text">
                {dream.transcription}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="dream-actions">
            <div className="dream-actions-left">
              {/* Bouton Like */}
              <button
                className={`dream-action-button like ${localUserLiked ? 'liked' : 'not-liked'}`}
                onClick={handleLikeClick}
                disabled={!currentUser || isLiking}
              >
                <span className="dream-action-icon">
                  {localUserLiked ? '❤️' : '🤍'}
                </span>
                {localLikesCount > 0 && (
                  <span className="dream-action-count">
                    {localLikesCount}
                  </span>
                )}
              </button>

              {/* Bouton Commentaires */}
              <button
                className="dream-action-button comment"
                onClick={handleCommentClick}
              >
                <span className="dream-action-icon">💬</span>
                {dream.comments_count > 0 && (
                  <span className="dream-action-count">
                    {dream.comments_count}
                  </span>
                )}
              </button>
            </div>

            {/* Bouton Partager */}
            {canShare && (
              <button
                className="dream-action-button share"
                onClick={handleShareClick}
              >
                <span className="dream-action-icon">📤</span>
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
