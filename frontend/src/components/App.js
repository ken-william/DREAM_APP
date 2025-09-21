import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";
import "../styles/App.css";

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
        <div className="app-loading-container">
          <div className="app-loading-spinner" />
          <div className="app-loading-card">
            <div className="app-loading-icon">🌙</div>
            <div className="app-loading-title">DreamShare</div>
            <div className="app-loading-subtitle">Chargement...</div>
          </div>
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
        
        <div className={`app-content-container ${isAuthenticated ? 'authenticated' : 'public'}`}>
          <Routes>
            {/* Routes publiques */}
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <div className="app-auth-container">
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
                  <div className="app-auth-container">
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
                <div className="app-404-container">
                  <div className="app-404-card">
                    <div className="app-404-icon">😴</div>
                    <h2 className="app-404-title">Page introuvable</h2>
                    <p className="app-404-message">
                      Cette page semble s'être envolée dans les rêves...
                    </p>
                    <button
                      onClick={() => window.location.href = isAuthenticated ? '/' : '/login'}
                      className="app-404-button"
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
