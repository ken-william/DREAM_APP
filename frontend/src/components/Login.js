import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("http://localhost:8000/api/account/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem("token", data.token);
      navigate("/profile");
    } else {
      setMessage(data.detail || "Identifiants incorrects");
    }
  };

  return (
    <div className="login-container">
      <h1>Connexion</h1>

      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Mot de passe" required />
        <button type="submit">Se connecter</button>
      </form>

      <p className="switch-link">
        Pas encore inscrit ? <span onClick={() => navigate("/register")}>Créer un compte</span>
      </p>

      {message && <p className="error">{message}</p>}
    </div>
  );
};

export default Login;
