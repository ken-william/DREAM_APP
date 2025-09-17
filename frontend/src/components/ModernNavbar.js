// frontend/src/components/ModernNavbar.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../services/api';

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
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: isScrolled 
          ? 'rgba(255, 255, 255, 0.85)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: isScrolled 
          ? '1px solid rgba(0, 0, 0, 0.1)' 
          : '1px solid rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isScrolled 
          ? '0 8px 32px rgba(0, 0, 0, 0.12)' 
          : '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px'
        }}>
          
          {/* Logo moderne */}
          <div 
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              transition: 'all 0.2s ease',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '1.2rem',
              letterSpacing: '-0.5px',
              transform: 'scale(1)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🌙</span>
            DreamShare
          </div>

          {/* Navigation centrale */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '0.5rem',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: item.isActive 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'transparent',
                  color: item.isActive ? 'white' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontWeight: item.isActive ? '600' : '500',
                  fontSize: '0.9rem',
                  boxShadow: item.isActive ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!item.isActive) {
                    e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.target.style.color = '#3b82f6';
                  }
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  if (!item.isActive) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#374151';
                  }
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
                
                {/* Badge de notification */}
                {item.hasNotification && (
                  <div style={{
                    position: 'absolute',
                    top: '0.25rem',
                    right: '0.25rem',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 0 0 2px white, 0 2px 8px rgba(239, 68, 68, 0.4)',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Profil utilisateur */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                borderRadius: '25px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                background: showProfileMenu 
                  ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: showProfileMenu 
                  ? '0 4px 20px rgba(0, 0, 0, 0.1)' 
                  : '0 2px 10px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.9rem',
                boxShadow: '0 3px 12px rgba(59, 130, 246, 0.3)'
              }}>
                {currentUser?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              
              {/* Nom + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  fontWeight: '500', 
                  color: '#374151',
                  fontSize: '0.9rem'
                }}>
                  {currentUser?.username || 'Utilisateur'}
                </span>
                <span style={{ 
                  color: '#9ca3af',
                  transition: 'transform 0.2s ease',
                  transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  ▼
                </span>
              </div>
            </button>

            {/* Menu déroulant profil */}
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                overflow: 'hidden',
                animation: 'fadeInUp 0.3s ease'
              }}>
                <div style={{ padding: '1rem' }}>
                  <div style={{ 
                    marginBottom: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ fontWeight: '600', color: '#374151' }}>
                      {currentUser?.username}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {currentUser?.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileMenu(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'transparent',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.target.style.color = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#374151';
                    }}
                  >
                    👤 Mon profil
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                    }}
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
      <div style={{ height: '70px' }} />

      {/* Animations CSS */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
};

export default ModernNavbar;
