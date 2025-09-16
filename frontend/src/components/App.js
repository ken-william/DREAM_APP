// frontend/src/components/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";

// Composants modernes
import ModernNavbar from "./ModernNavbar";
import ModernBackground from "./ModernBackground";

// Pages
import LoginForm from "./login";
import RegisterForm from "./register";
import Home from "./home";
import CreateDream from "./create_dreams";
import Profile from "./Profile";
import Social from "./social";
import FriendRequests from "./friend_requests";
import Messaging from "./messaging";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au démarrage
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      getCurrentUser()
        .then((user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        })
        .catch(() => {
          // Token invalide, nettoyer
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token');
          setCurrentUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <ModernBackground>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(59, 130, 246, 0.2)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '1.5rem 2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>🌙</div>
            <div style={{
              color: '#374151',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>DreamShare</div>
            <div style={{
              color: '#6b7280',
              fontSize: '0.9rem',
              marginTop: '0.25rem'
            }}>Chargement...</div>
          </div>
          
          {/* CSS Animation */}
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </ModernBackground>
    );
  }

  return (
    <Router>
      <ModernBackground>
        {isAuthenticated && (
          <ModernNavbar
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}
        
        <div style={{
          maxWidth: isAuthenticated ? '1200px' : '500px',
          margin: '0 auto',
          padding: isAuthenticated ? '2rem' : '0'
        }}>
          <Routes>
            {/* Routes publiques */}
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                  }}>
                    <LoginForm onLogin={handleLogin} />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/register"
              element={
                !isAuthenticated ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                  }}>
                    <RegisterForm />
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Routes protégées */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Home currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/home"
              element={
                isAuthenticated ? (
                  <Navigate to="/" />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/create-dream"
              element={
                isAuthenticated ? (
                  <CreateDream currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/dreams/create"
              element={
                isAuthenticated ? (
                  <Navigate to="/create-dream" />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? (
                  <Profile currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/social"
              element={
                isAuthenticated ? (
                  <Social currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/friend-requests"
              element={
                isAuthenticated ? (
                  <FriendRequests currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/messaging"
              element={
                isAuthenticated ? (
                  <Messaging currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/messaging/:username"
              element={
                isAuthenticated ? (
                  <Messaging currentUser={currentUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* 404 - Page non trouvée */}
            <Route
              path="*"
              element={
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '50vh',
                  textAlign: 'center'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '3rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😴</div>
                    <h2 style={{ color: '#374151', marginBottom: '1rem' }}>Page introuvable</h2>
                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                      Cette page semble s'être envolée dans les rêves...
                    </p>
                    <button
                      onClick={() => window.location.href = isAuthenticated ? '/' : '/login'}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      🏠 Retour à l'accueil
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </ModernBackground>
    </Router>
  );
}

export default App;
