import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function SocialHome({ currentUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentRequests, setSentRequests] = useState([]); // IDs des demandes envoyées
  const [friends, setFriends] = useState([]); // IDs des amis actuels

  // Charger les amis et demandes existantes au démarrage
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      // Charger les amis existants
      const friendsResponse = await api.get('/api/social/friends/');
      const friendsList = Array.isArray(friendsResponse.data) ? friendsResponse.data : [];
      setFriends(friendsList.map(f => f.id || f.user_id));

      // Charger les demandes envoyées
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
      
      // Filtrer l'utilisateur actuel des résultats
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
      
      // Ajouter à la liste des demandes envoyées
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
        return (
          <span style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            ✅ Ami
          </span>
        );
      
      case 'pending':
        return (
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            ⏳ En attente
          </span>
        );
      
      default:
        return (
          <button
            onClick={() => sendFriendRequest(user.id, user.username)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
            }}
          >
            👋 Ajouter
          </button>
        );
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Header moderne */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>👥</div>
        <h1 style={{
          margin: '0 0 1rem 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '2.5rem',
          fontWeight: '700'
        }}>
          Espace Social
        </h1>
        <p style={{
          margin: '0',
          color: '#6b7280',
          fontSize: '1.1rem'
        }}>
          Recherchez et ajoutez des amis pour partager vos rêves !
        </p>
      </div>

      {/* Barre de recherche moderne - MISE EN AVANT */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          margin: '0 0 1.5rem 0',
          color: '#374151',
          fontSize: '1.5rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textAlign: 'center',
          justifyContent: 'center'
        }}>
          🔍 Rechercher des utilisateurs
        </h2>
        
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Barre de recherche bien visible */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tapez le nom d'utilisateur ou l'email à rechercher..."
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '1.2rem 2rem',
              borderRadius: '30px',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              fontSize: '1.1rem',
              outline: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.15)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          />
          
          {/* Bouton rechercher en dessous */}
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            style={{
              padding: '1rem 3rem',
              borderRadius: '25px',
              border: 'none',
              background: loading || !searchTerm.trim() 
                ? '#d1d5db' 
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              cursor: loading || !searchTerm.trim() ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: loading || !searchTerm.trim() 
                ? 'none' 
                : '0 6px 20px rgba(59, 130, 246, 0.3)',
              minWidth: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transform: 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!loading && searchTerm.trim()) {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = loading || !searchTerm.trim() ? 'none' : '0 6px 20px rgba(59, 130, 246, 0.3)';
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Recherche en cours...
              </>
            ) : (
              <>🔍 Lancer la recherche</>
            )}
          </button>
        </form>

        {/* Message d'erreur */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            color: '#dc2626',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Navigation rapide */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: '0 0 1.5rem 0',
          color: '#374151',
          fontSize: '1.3rem',
          fontWeight: '600'
        }}>
          🚀 Accès rapide
        </h3>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <Link to="/friend-requests" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '25px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
            >
              📥 Mes demandes
            </button>
          </Link>
          
          <Link to="/messaging" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '25px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
            >
              💬 Messagerie
            </button>
          </Link>
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem 0',
            color: '#374151',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            📋 Résultats ({searchResults.length})
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {searchResults.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1.2rem',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}>
                    {user.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  
                  {/* Infos utilisateur */}
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '1.1rem',
                      marginBottom: '0.25rem'
                    }}>
                      {user.username}
                    </div>
                    <div style={{
                      color: '#6b7280',
                      fontSize: '0.9rem'
                    }}>
                      {user.email}
                    </div>
                  </div>
                </div>
                
                {/* Bouton d'action */}
                {getStatusButton(user)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de résultats mais recherche effectuée */}
      {searchTerm && !loading && searchResults.length === 0 && !error && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😅</div>
          <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
            Aucun utilisateur trouvé
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Essayez avec un autre nom d'utilisateur ou email.
          </p>
        </div>
      )}

      {/* CSS pour les animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default SocialHome;
