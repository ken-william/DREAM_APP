import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/index.css";

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState("");

  // 🔒 Rediriger si non connecté
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:8000/api/account/profile/", {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setInfo(data))
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    const res = await fetch("http://localhost:8000/api/account/profile/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(data),
    });

    setMessage(res.ok ? "Profil mis à jour." : "Erreur lors de la mise à jour.");
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    const res = await fetch("http://localhost:8000/api/account/change-password/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(data),
    });

    setMessage(res.ok ? "Mot de passe modifié." : "Erreur : " + (await res.text()));
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/account/delete-account/", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ confirm: true }),
    });

    if (res.ok) {
      setMessage("Compte supprimé.");
      localStorage.clear();
      setTimeout(() => navigate("/register"), 2000);
    } else {
      setMessage("Erreur : " + (await res.text()));
    }
  };

  return (
    <div className="container">
      <h1>Mon Profil</h1>

      <button onClick={handleLogout}>Se déconnecter</button>

      <hr />
      {info && (
        <div>
          <p><strong>Email :</strong> {info.email}</p>
          <p><strong>Nom :</strong> {info.username}</p>
          <p><strong>Image de rêve ID :</strong> {info.photo_profil ?? "Non défini"}</p>
        </div>
      )}

      <form onSubmit={handleUpdate}>
        <input type="text" name="username" placeholder="Nouveau pseudo" />
        <input type="number" name="photo_profil" placeholder="ID du rêve (image profil)" />
        <button type="submit">Modifier le profil</button>
      </form>

      <hr />
      <h2>Changer mon mot de passe</h2>
      <form onSubmit={handlePassword}>
        <input type="password" name="old_password" placeholder="Ancien mot de passe" required />
        <input type="password" name="new_password" placeholder="Nouveau mot de passe" required />
        <button type="submit">Changer le mot de passe</button>
      </form>

      <hr />
      <h2>Supprimer mon compte</h2>
      <form onSubmit={handleDelete}>
        <label>
          <input type="checkbox" name="confirm" required /> Je confirme la suppression
        </label>
        <button type="submit">Supprimer</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Profile;
