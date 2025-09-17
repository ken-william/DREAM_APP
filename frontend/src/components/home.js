// frontend/src/components/home.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicFeed, getFriendsFeed } from "../services/api";
import ModernDreamCard from "./ModernDreamCard";

function Home({ currentUser }) {
  // États d'authentification
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // États du feed
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' ou 'friends'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' ou 'popular'
  const [publicFeed, setPublicFeed] = useState({ dreams: [], pagination: null });
  const [friendsFeed, setFriendsFeed] = useState({ dreams: [], pagination: null });
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Vérifier l'authentification au chargement
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser.username);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [currentUser]);

  // Charger le feed au changement d'onglet, page ou tri
  useEffect(() => {
    if (isAuthenticated) {
      loadFeed();
    }
  }, [isAuthenticated, activeTab, currentPage, sortBy]);

  const loadFeed = async () => {
    setLoading(true);
    setError("");
    
    try {
      if (activeTab === 'discover') {
        const data = await getPublicFeed(currentPage, ITEMS_PER_PAGE, sortBy);
        setPublicFeed(data);
      } else if (activeTab === 'friends') {
        const data = await getFriendsFeed(currentPage, ITEMS_PER_PAGE, sortBy);
        setFriendsFeed(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du feed:', err);
      setError("Erreur lors du chargement du feed. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset à la page 1
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  // Rendu pour les utilisateurs non connectés
  if (!isAuthenticated) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <h1 className="mb-4" style={{ 
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '3rem',
            fontWeight: 'bold'
          }}>
            🌙 Synthétiseur de Rêves ✨
          </h1>
          
          <p className="lead mb-4" style={{ fontSize: '1.2rem', color: '#6c757d' }}>
            Transformez vos rêves en œuvres d'art et partagez-les avec la communauté
          </p>
          
          <div className="d-flex justify-content-center gap-3 mb-5">
            <Link to="/login">
              <button className="btn btn-primary btn-lg" style={{ 
                borderRadius: '25px',
                padding: '0.75rem 2rem'
              }}>
                🚀 Se connecter
              </button>
            </Link>
            <Link to="/register">
              <button className="btn btn-outline-primary btn-lg" style={{ 
                borderRadius: '25px',
                padding: '0.75rem 2rem'
              }}>
                ✨ S'inscrire
              </button>
            </Link>
          </div>

          {/* Section d'explication */}
          <div className="row mt-5">
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎤</div>
                <h5>Racontez votre rêve</h5>
                <p className="text-muted">Enregistrez votre rêve à la voix ou uploadez un fichier audio</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
                <h5>IA génère l'image</h5>
                <p className="text-muted">Notre intelligence artificielle transforme votre récit en œuvre d'art</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌍</div>
                <h5>Partagez avec le monde</h5>
                <p className="text-muted">Publiez vos rêves et découvrez ceux des autres rêveurs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu pour les utilisateurs connectés (Feed social)
  const getCurrentFeed = () => {
    return activeTab === 'discover' ? publicFeed : friendsFeed;
  };

  const currentFeedData = getCurrentFeed();

  return (
    <div className="container mt-4" style={{ maxWidth: '800px' }}>
      {/* Header utilisateur */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>
            Bonjour, {user} 👋
          </h2>
          <p className="text-muted mb-0">Découvrez les rêves de la communauté</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/create-dream">
            <button className="btn btn-primary" style={{ borderRadius: '20px' }}>
              ➕ Créer un rêve
            </button>
          </Link>
          <button 
            onClick={handleLogout} 
            className="btn btn-outline-danger"
            style={{ borderRadius: '20px' }}
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Onglets et contrôles */}
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Onglets principaux */}
        <div style={{ marginBottom: "1rem" }}>
          <ul className="nav nav-pills justify-content-center" style={{ 
            backgroundColor: '#f8f9fa',
            borderRadius: '25px',
            padding: '0.5rem'
          }}>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'discover' ? 'active' : ''}`}
                onClick={() => handleTabChange('discover')}
                style={{ 
                  borderRadius: '20px',
                  fontWeight: '500',
                  padding: '0.75rem 1.5rem'
                }}
              >
                🌍 Découvrir
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => handleTabChange('friends')}
                style={{ 
                  borderRadius: '20px',
                  fontWeight: '500',
                  padding: '0.75rem 1.5rem'
                }}
              >
                👥 Amis
              </button>
            </li>
          </ul>
        </div>

        {/* Contrôles de tri et actualisation */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          {/* Boutons de tri */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: "500" }}>
              Trier par :
            </span>
            <button
              onClick={() => setSortBy('recent')}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                border: "1px solid #d1d5db",
                backgroundColor: sortBy === 'recent' ? "#3b82f6" : "#fff",
                color: sortBy === 'recent' ? "white" : "#374151",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
            >
              🕓 Récents
            </button>
            <button
              onClick={() => setSortBy('popular')}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                border: "1px solid #d1d5db",
                backgroundColor: sortBy === 'popular' ? "#ef4444" : "#fff",
                color: sortBy === 'popular' ? "white" : "#374151",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
            >
              🔥 Populaires
            </button>
          </div>

          {/* Bouton actualiser */}
          <button
            onClick={() => {
              setCurrentPage(1);
              loadFeed();
            }}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "25px",
              border: "none",
              backgroundColor: loading ? "#d1d5db" : "#10b981",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              transition: "all 0.2s",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                Actualisation...
              </>
            ) : (
              <>
                🔄 Actualiser
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenu du feed */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Chargement des rêves...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center" role="alert">
          <h5>😔 Oups !</h5>
          <p className="mb-0">{error}</p>
          <button 
            className="btn btn-outline-danger btn-sm mt-2"
            onClick={loadFeed}
          >
            🔄 Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* Message si aucun rêve */}
          {(!currentFeedData.dreams || currentFeedData.dreams.length === 0) ? (
            <div className="text-center py-5">
              {activeTab === 'discover' ? (
                <>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌙</div>
                  <h4>Aucun rêve public pour le moment</h4>
                  <p className="text-muted">Soyez le premier à partager un rêve public !</p>
                  <Link to="/create-dream">
                    <button className="btn btn-primary" style={{ borderRadius: '20px' }}>
                      ✨ Créer mon premier rêve
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                  <h4>Aucun rêve d'amis</h4>
                  <p className="text-muted">
                    {currentFeedData.message || "Ajoutez des amis pour voir leurs rêves !"}
                  </p>
                  <Link to="/social">
                    <button className="btn btn-primary" style={{ borderRadius: '20px' }}>
                      🔍 Trouver des amis
                    </button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Liste des rêves */}
              <div className="row">
                {currentFeedData.dreams.map((dream) => (
                  <div key={dream.dream_id} className="col-12 mb-4">
                    <ModernDreamCard 
                      dream={dream} 
                      showAuthor={true} 
                      currentUser={user}
                      onDreamUpdate={(updatedDream) => {
                        // Mettre à jour le rêve dans le feed local
                        const updateFeed = (feed) => ({
                          ...feed,
                          dreams: feed.dreams.map(d => 
                            d.dream_id === updatedDream.dream_id ? updatedDream : d
                          )
                        });
                        
                        if (activeTab === 'discover') {
                          setPublicFeed(updateFeed);
                        } else {
                          setFriendsFeed(updateFeed);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {currentFeedData.pagination && currentFeedData.pagination.total_pages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav aria-label="Navigation du feed">
                    <ul className="pagination">
                      {/* Bouton Précédent */}
                      <li className={`page-item ${!currentFeedData.pagination.has_previous ? 'disabled' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!currentFeedData.pagination.has_previous}
                          style={{ borderRadius: '8px 0 0 8px' }}
                        >
                          ← Précédent
                        </button>
                      </li>

                      {/* Numéros de pages */}
                      {Array.from({ length: currentFeedData.pagination.total_pages }, (_, i) => i + 1)
                        .filter(pageNum => {
                          // Afficher seulement quelques pages autour de la page actuelle
                          const delta = 2;
                          return pageNum === 1 || 
                                 pageNum === currentFeedData.pagination.total_pages ||
                                 (pageNum >= currentPage - delta && pageNum <= currentPage + delta);
                        })
                        .map((pageNum, index, filteredPages) => {
                          // Ajouter des "..." si nécessaire
                          const showEllipsis = index > 0 && pageNum - filteredPages[index - 1] > 1;
                          
                          return (
                            <React.Fragment key={pageNum}>
                              {showEllipsis && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}
                              <li className={`page-item ${pageNum === currentPage ? 'active' : ''}`}>
                                <button 
                                  className="page-link"
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </button>
                              </li>
                            </React.Fragment>
                          );
                        })
                      }

                      {/* Bouton Suivant */}
                      <li className={`page-item ${!currentFeedData.pagination.has_next ? 'disabled' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!currentFeedData.pagination.has_next}
                          style={{ borderRadius: '0 8px 8px 0' }}
                        >
                          Suivant →
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}

              {/* Informations de pagination */}
              {currentFeedData.pagination && (
                <div className="text-center mt-3 mb-4">
                  <small className="text-muted">
                    Page {currentFeedData.pagination.current_page} sur {currentFeedData.pagination.total_pages}
                    ({currentFeedData.pagination.total_items} rêve{currentFeedData.pagination.total_items > 1 ? 's' : ''} au total)
                    {activeTab === 'friends' && currentFeedData.friends_count && (
                      <> • {currentFeedData.friends_count} ami{currentFeedData.friends_count > 1 ? 's' : ''}</>
                    )}
                  </small>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
