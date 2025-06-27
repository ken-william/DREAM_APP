import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return navigate("/login");

    fetch("http://localhost:8000/api/account/profile/", {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("http://localhost:8000/api/account/profile/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(payload),
    });

    setMessage(res.ok ? "Profil mis à jour" : "Erreur lors de la mise à jour");
  };

  const handlePasswordChange = async (e) => {
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

    setMessage(res.ok ? "Mot de passe modifié" : "Erreur lors du changement");
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
      localStorage.clear();
      navigate("/register");
    } else {
      setMessage("Erreur lors de la suppression");
    }
  };

  if (!user) return <div className="loading">Chargement du profil...</div>;

  return (
    <div className="profile-container">
      <h1>Mon Profil</h1>
      <button className="logout-btn" onClick={handleLogout}>Se déconnecter</button>

      <div className="profile-info">
        <p><strong>Email :</strong> {user.email}</p>
        <p><strong>Nom :</strong> {user.username}</p>
        <p><strong>Image rêve (ID) :</strong> {user.photo_profil ?? "non défini"}</p>
      </div>

      <form onSubmit={handleUpdate} className="form-section">
        <h2>Modifier mon profil</h2>
        <input name="username" placeholder="Nouveau nom" />
        <input name="photo_profil" placeholder="ID rêve (image)" />
        <button type="submit">Mettre à jour</button>
      </form>

      <form onSubmit={handlePasswordChange} className="form-section">
        <h2>Changer mon mot de passe</h2>
        <input type="password" name="old_password" placeholder="Ancien mot de passe" required />
        <input type="password" name="new_password" placeholder="Nouveau mot de passe" required />
        <button type="submit">Changer le mot de passe</button>
      </form>

      <form onSubmit={handleDelete} className="form-section">
        <h2>Supprimer mon compte</h2>
        <label><input type="checkbox" required /> Confirmer la suppression</label>
        <button type="submit" className="danger">Supprimer</button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Profile;
