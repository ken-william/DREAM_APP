import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [user, setUser] = useState(null);

  // On vérifie si l'utilisateur est connecté au chargement de la page
  useEffect(() => {
    fetch("http://localhost:8000/api/users/whoami/", {
      credentials: "include", // pour inclure les cookies Django
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setUser(data.username);
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/users/logout/", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <div className="container mt-5">
      <h1>Bienvenue dans le Synthétiseur de Rêves</h1>

      {user ? (
        <>
          <p>Bonjour, {user} 👋</p>
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
