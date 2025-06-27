import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/index.css";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const response = await fetch("http://localhost:8000/api/account/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token);
      navigate("/login");
    } else {
      const err = await response.json();
      setError(err.detail || "Erreur lors de l’inscription.");
    }
  };

  return (
    <div className="container">
      <h2>Inscription</h2>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Adresse email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Créer un compte</button>
      </form>

      <button
        onClick={() => navigate("/login")}
        style={{
          background: "#eee",
          color: "#1976d2",
          border: "1px solid #ccc",
          marginTop: "10px",
        }}
      >
        Déjà inscrit ? Se connecter
      </button>
    </div>
  );
}

export default Register;
