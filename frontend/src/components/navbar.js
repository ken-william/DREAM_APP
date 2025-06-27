import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/index.css";

function Navbar({ isAuthenticated, handleLogout }) {
  const navigate = useNavigate();

  const logoutAndRedirect = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/" style={styles.logo}>🌙 SynthèseRêves</Link>
      </div>
      <div style={styles.right}>
        {isAuthenticated ? (
          <>
            <Link to="/social" style={styles.link}>Réseau</Link>
            <Link to="/profile" style={styles.link}>Profil</Link>
            <button onClick={logoutAndRedirect} style={styles.button}>Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Connexion</Link>
            <Link to="/register" style={styles.link}>Inscription</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: "#1e1e2f",
    color: "white",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Inter, sans-serif",
  },
  left: {
    fontSize: "20px",
    fontWeight: "bold",
  },
  right: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  logo: {
    color: "white",
    textDecoration: "none",
  },
  link: {
    color: "#90caf9",
    textDecoration: "none",
    fontSize: "16px",
  },
  button: {
    backgroundColor: "#d32f2f",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  }
};

export default Navbar;
