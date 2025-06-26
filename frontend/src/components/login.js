import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import '../styles/App.css';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fonction pour récupérer un cookie (ici le csrf)
  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  // Appel au backend pour récupérer le CSRF token au chargement
  useEffect(() => {
    fetch("http://localhost:8000/api/users/csrf/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        document.cookie = `csrftoken=${data.csrfToken}`;
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch("http://localhost:8000/api/users/login/", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: formData,
      });

      if (res.ok) {
        navigate("/");
      } else {
        const data = await res.json();
        setError(data.detail || "Identifiants invalides");
      }
    } catch (err) {
      setError("Erreur réseau : " + err.message);
    }
  };

return (
    <div className="auth-container">
      <h2 className="auth-title">Connexion</h2>
      <form className="auth-form" onSubmit={handleLogin}>
        <input
          type="username"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
      </form>
      <div className="auth-footer">
        <p>Pas encore de compte ? <Link to="/register">S’inscrire</Link></p>
      </div>
    </div>
  );
}

export default Login;
