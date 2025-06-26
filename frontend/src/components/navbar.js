import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/App.css";

function Navbar({ isAuthenticated, handleLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Cacher la navbar sur /login et /register
  if (["/login", "/register"].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg custom-navbar px-4 py-3">
      <Link className="navbar-brand" to="/">
        💤 Synthétiseur de Rêves
      </Link>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <Link className="nav-link" to="/">Accueil</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/create-dream">Créer un rêve</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/social">Espace social</Link>
          </li>
          <li className="nav-item">
            <span className="nav-link disabled">Settings</span>
          </li>
        </ul>
        <div>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-outline-light me-2">Se connecter</Link>
              <Link to="/register" className="btn btn-outline-light">S'inscrire</Link>
            </>
          ) : (
            <button onClick={handleLogout} className="btn btn-outline-light">Déconnexion</button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
