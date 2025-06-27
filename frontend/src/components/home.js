// src/components/home.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:8000/api/account/profile/", {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.username) setUser(data.username);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <div className="container mt-5">
      <h1>Bienvenue dans le Synthétiseur de Rêves</h1>

      {user ? (
        <>
          <p>Bonjour, {user} 👋</p>
          <button onClick={handleLogout} className="btn btn-danger">
            Se déconnecter
          </button>
        </>
      ) : (
        <>
          <Link to="/login">
            <button className="btn btn-primary me-2">Se connecter</button>
          </Link>
          <Link to="/register">
            <button className="btn btn-success">S'inscrire</button>
          </Link>
        </>
      )}

      <hr />
    </div>
  );
}

export default Home;
