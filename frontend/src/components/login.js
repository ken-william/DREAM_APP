import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/index.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
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

    const response = await fetch("http://localhost:8000/api/account/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token);
      navigate("/profile");
    } else {
      const err = await response.json();
      setError(err.detail || "Identifiants incorrects.");
    }
  };

  return (
    <div className="container">
      <h2>Connexion</h2>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
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

        <button type="submit">Se connecter</button>
      </form>

      <button
        onClick={() => navigate("/register")}
        style={{
          background: "#eee",
          color: "#1976d2",
          border: "1px solid #ccc",
          marginTop: "10px",
        }}
      >
        Créer un compte
      </button>
    </div>
  );
}

export default Login;
