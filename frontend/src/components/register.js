import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🔐 Fonction pour récupérer le cookie CSRF
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

  // 🔁 On récupère le token CSRF au chargement de la page
  useEffect(() => {
    fetch("http://localhost:8000/api/users/csrf/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        document.cookie = `csrftoken=${data.csrfToken}`;
      });
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch("http://localhost:8000/api/users/register/", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: formData,
      });

      if (res.ok) {
        navigate("/login");
      } else {
        const data = await res.json();
        setError(data.detail || "Erreur à l'inscription");
      }
    } catch (err) {
      setError("Erreur réseau : " + err.message);
    }
  };

return (
    <div className="auth-container">
      <h2 className="auth-title">Inscription</h2>
      <form className="auth-form" onSubmit={handleRegister}>
        <input
          type="text"
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
        <button type="submit">S'inscrire</button>
      </form>
      <div className="auth-footer">
        <p>Déjà inscrit ? <Link to="/login">Connexion</Link></p>
      </div>
    </div>
  );
}

export default Register;
