import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

const Register = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());

    const res = await fetch("http://localhost:8000/api/account/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      setMessage("Compte créé ! Redirection vers la connexion...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setMessage(data.detail || "Erreur lors de l'inscription.");
    }
  };

  return (
    <div className="register-container">
      <h1>Inscription</h1>

      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Nom d'utilisateur" required />
        <input type="email" name="email" placeholder="Adresse email" required />
        <input type="password" name="password" placeholder="Mot de passe" required />
        <button type="submit">Créer un compte</button>
      </form>

      <p className="switch-link">
        Déjà un compte ? <span onClick={() => navigate("/login")}>Se connecter</span>
      </p>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Register;
