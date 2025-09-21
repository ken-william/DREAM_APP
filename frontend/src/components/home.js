import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicFeed, getFriendsFeed } from "../services/api";
import ModernDreamCard from "./ModernDreamCard";
import "../styles/Home.css";

function Home({ currentUser }) {
  // États d'authentification
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // États du feed
  const [activeTab, setActiveTab] = useState('discover');
  const [sortBy, setSortBy] = useState('recent');
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
    setCurrentPage(1);
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
          <h1 className="mb-4 home-landing-title">
            🌙 Synthétiseur de Rêves ✨
          </h1>
          
          <p className="lead mb-4 home-landing-subtitle">
            Transformez vos rêves en œuvres d'art et partagez-les avec la communauté
          </p>
          
          <div className="d-flex justify-content-center gap-3 mb-5">
            <Link to="/login">
              <button className="btn btn-primary btn-lg home-landing-button">
                🚀 Se connecter
              </button>
            </Link>
            <Link to="/register">
              <button className="btn btn-outline-primary btn-lg home-landing-button">
                ✨ S'inscrire
              </button>
            </Link>
          </div>

          {/* Section d'explication */}
          <div className="row mt-5">
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="home-feature-icon">🎤</div>
                <h5>Racontez votre rêve</h5>
                <p className="text-muted">Enregistrez votre rêve à la voix ou uploadez un fichier audio</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="home-feature-icon">🎨</div>
                <h5>IA génère l'image</h5>
                <p className="text-muted">Notre intelligence artificielle transforme votre récit en œuvre d'art</p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="home-feature-icon">🌍</div>
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
    <div className="container mt-4 home-container">
      {/* Header utilisateur */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="home-header">
            Bonjour, {user} 👋
          </h2>
          <p className="text-muted mb-0">Découvrez les rêves de la communauté</p>
        </div>
        <div className="home-user-actions">
          <Link to="/create-dream">
            <button className="btn btn-primary home-action-button">
              ➕ Créer un rêve
            </button>
          </Link>
          <button 
            onClick={handleLogout} 
            className="btn btn-outline-danger home-action-button"
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Onglets et contrôles */}
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Onglets principaux */}
        <div style={{ marginBottom: "1rem" }}>
          <ul className="nav nav-pills justify-content-center home-feed-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link home-tab-button ${activeTab === 'discover' ? 'active' : ''}`}
                onClick={() => handleTabChange('discover')}
              >
                🌍 Découvrir
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link home-tab-button ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => handleTabChange('friends')}
              >
                👥 Amis
              </button>
            </li>
          </ul>
        </div>

        {/* Contrôles de tri et actualisation */}
        <div className="home-feed-controls">
          {/* Boutons de tri */}
          <div className="home-sort-controls">
            <span className="home-sort-label">
              Trier par :
            </span>
            <button
              onClick={() => setSortBy('recent')}
              className={`home-sort-button ${sortBy === 'recent' ? 'active-recent' : ''}`}
            >
              🕓 Récents
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`home-sort-button ${sortBy === 'popular' ? 'active-popular' : ''}`}
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
            className={`home-refresh-button ${loading ? 'disabled' : 'enabled'}`}
          >
            {loading ? (
              <>
                <div className="home-refresh-spinner" />
                Actualisation...
              </>
            ) : (
              <>🔄 Actualiser</>
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
            <div className="home-empty-state">
              {activeTab === 'discover' ? (
                <>
                  <div className="home-empty-icon">🌙</div>
                  <h4>Aucun rêve public pour le moment</h4>
                  <p className="text-muted">Soyez le premier à partager un rêve public !</p>
                  <Link to="/create-dream">
                    <button className="btn btn-primary home-empty-button">
                      ✨ Créer mon premier rêve
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="home-empty-icon">👥</div>
                  <h4>Aucun rêve d'amis</h4>
                  <p className="text-muted">
                    {currentFeedData.message || "Ajoutez des amis pour voir leurs rêves !"}
                  </p>
                  <Link to="/social">
                    <button className="btn btn-primary home-empty-button">
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
                          className="page-link home-pagination-button"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!currentFeedData.pagination.has_previous}
                        >
                          ← Précédent
                        </button>
                      </li>

                      {/* Numéros de pages */}
                      {Array.from({ length: currentFeedData.pagination.total_pages }, (_, i) => i + 1)
                        .filter(pageNum => {
                          const delta = 2;
                          return pageNum === 1 || 
                                 pageNum === currentFeedData.pagination.total_pages ||
                                 (pageNum >= currentPage - delta && pageNum <= currentPage + delta);
                        })
                        .map((pageNum, index, filteredPages) => {
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
                          className="page-link home-pagination-button"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!currentFeedData.pagination.has_next}
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
                <div className="home-pagination-info">
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
