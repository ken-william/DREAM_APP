import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../services/api';
import '../styles/ModernNavbar.css';

const ModernNavbar = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(3); // Mock notifications

  // Effet de scroll pour le glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logoutUser();
    if (onLogout) onLogout();
    navigate('/login');
  };

  const navItems = [
    { 
      path: '/', 
      icon: '🏠', 
      label: 'Accueil',
      isActive: location.pathname === '/' || location.pathname === '/home'
    },
    { 
      path: '/create-dream', 
      icon: '✨', 
      label: 'Créer',
      isActive: location.pathname === '/create-dream' || location.pathname === '/dreams/create'
    },
    { 
      path: '/social', 
      icon: '👥', 
      label: 'Social',
      isActive: location.pathname === '/social'
    },
    { 
      path: '/messaging', 
      icon: '💬', 
      label: 'Messages',
      isActive: location.pathname.startsWith('/messaging'),
      hasNotification: notifications > 0
    }
  ];

  return (
    <>
      {/* Navbar moderne avec glassmorphism */}
      <nav className={`modern-navbar ${isScrolled ? 'scrolled' : 'not-scrolled'}`}>
        <div className="navbar-container">
          
          {/* Logo moderne */}
          <div 
            onClick={() => navigate('/')}
            className="navbar-logo"
          >
            <span className="navbar-logo-icon">🌙</span>
            DreamShare
          </div>

          {/* Navigation centrale */}
          <div className="navbar-nav">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item ${item.isActive ? 'active' : ''}`}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
                
                {/* Badge de notification */}
                {item.hasNotification && (
                  <div className="nav-notification-badge" />
                )}
              </button>
            ))}
          </div>

          {/* Profil utilisateur */}
          <div className="navbar-profile">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`profile-button ${showProfileMenu ? 'open' : ''}`}
            >
              {/* Avatar */}
              <div className="profile-avatar">
                {currentUser?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              
              {/* Nom + chevron */}
              <div className="profile-info">
                <span className="profile-username">
                  {currentUser?.username || 'Utilisateur'}
                </span>
                <span className={`profile-chevron ${showProfileMenu ? 'open' : ''}`}>
                  ▼
                </span>
              </div>
            </button>

            {/* Menu déroulant profil */}
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-content">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-name">
                      {currentUser?.username}
                    </div>
                    <div className="profile-dropdown-email">
                      {currentUser?.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileMenu(false);
                    }}
                    className="profile-dropdown-button"
                  >
                    👤 Mon profil
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="profile-dropdown-button logout"
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer pour compenser la navbar fixe */}
      <div className="navbar-spacer" />
    </>
  );
};

export default ModernNavbar;
