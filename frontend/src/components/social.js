import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/Social.css";

function SocialHome({ currentUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const friendsResponse = await api.get('/api/social/friends/');
      const friendsList = Array.isArray(friendsResponse.data) ? friendsResponse.data : [];
      setFriends(friendsList.map(f => f.id || f.user_id));

      const requestsResponse = await api.get('/api/social/requests/sent/');
      const requestsList = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
      setSentRequests(requestsList.map(r => r.to_user?.id || r.to_user));
    } catch (err) {
      console.error('Erreur chargement données sociales:', err);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await api.get(`/api/social/search/?q=${encodeURIComponent(searchTerm.trim())}`);
      const results = Array.isArray(response.data) ? response.data : [];
      
      const filteredResults = results.filter(user => 
        user.username !== currentUser?.username
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Erreur recherche:', err);
      if (err.response?.status === 404) {
        setSearchResults([]);
        setError("Aucun utilisateur trouvé.");
      } else {
        setError("Erreur lors de la recherche. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId, username) => {
    try {
      await api.post(`/api/social/add/${username}/`);
      setSentRequests(prev => [...prev, userId]);
      setError("");
      console.log(`✅ Demande d'ami envoyée à ${username}`);
    } catch (err) {
      console.error('Erreur envoi demande:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Impossible d'envoyer la demande d'ami.");
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchUsers();
  };

  const getUserStatus = (user) => {
    if (friends.includes(user.id)) return 'friend';
    if (sentRequests.includes(user.id)) return 'pending';
    return 'none';
  };

  const getStatusButton = (user) => {
    const status = getUserStatus(user);
    
    switch (status) {
      case 'friend':
        return <span className="status-badge friend">✅ Ami</span>;
      
      case 'pending':
        return <span className="status-badge pending">⏳ En attente</span>;
      
      default:
        return (
          <button
            className="status-button"
            onClick={() => sendFriendRequest(user.id, user.username)}
          >
            👋 Ajouter
          </button>
        );
    }
  };

  return (
    <div className="social-container">
      {/* Header moderne */}
      <div className="social-header">
        <div className="social-header-icon">👥</div>
        <h1 className="social-title">Espace Social</h1>
        <p className="social-subtitle">
          Recherchez et ajoutez des amis pour partager vos rêves !
        </p>
      </div>

      {/* Barre de recherche moderne */}
      <div className="search-section">
        <h2 className="search-title">🔍 Rechercher des utilisateurs</h2>
        
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tapez le nom d'utilisateur ou l'email à rechercher..."
            className="search-input"
          />
          
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className={`search-button ${loading || !searchTerm.trim() ? 'disabled' : 'enabled'}`}
          >
            {loading ? (
              <>
                <div className="search-loading-spinner" />
                Recherche en cours...
              </>
            ) : (
              <>🔍 Lancer la recherche</>
            )}
          </button>
        </form>

        {/* Message d'erreur */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Navigation rapide */}
      <div className="quick-nav">
        <h3 className="quick-nav-title">🚀 Accès rapide</h3>
        
        <div className="quick-nav-buttons">
          <Link to="/friend-requests" className="quick-nav-button friends">
            📥 Mes demandes
          </Link>
          
          <Link to="/messaging" className="quick-nav-button messages">
            💬 Messagerie
          </Link>
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div className="results-section">
          <h3 className="results-title">
            📋 Résultats ({searchResults.length})
          </h3>
          
          <div className="results-grid">
            {searchResults.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  
                  <div className="user-details">
                    <div className="user-username">{user.username}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                
                {getStatusButton(user)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de résultats */}
      {searchTerm && !loading && searchResults.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon">😅</div>
          <h3 className="empty-state-title">Aucun utilisateur trouvé</h3>
          <p className="empty-state-message">
            Essayez avec un autre nom d'utilisateur ou email.
          </p>
        </div>
      )}
    </div>
  );
}

export default SocialHome;
