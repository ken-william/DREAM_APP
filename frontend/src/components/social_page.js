import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// 🔐 Récupérer le token CSRF depuis les cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function SocialPage() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);

  // ✅ Important : récupérer le cookie CSRF au lancement
  useEffect(() => {
    fetch("http://localhost:8000/api/csrf/", { credentials: "include" });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/users/whoami/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data.username));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const res = await fetch(
      `http://localhost:8000/api/social/search/?search=${searchQuery}`,
      { credentials: "include" }
    );
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetch("http://localhost:8000/api/social/friends/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setFriends(data));
  }, []);

  const sendFriendRequest = async (username) => {
    const csrftoken = getCookie("csrftoken");

    await fetch(`http://localhost:8000/api/social/friend-request/${username}/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
  };

  return (
    <div className="container mt-5">
      <h1>Espace Social</h1>
      <p><strong>Bienvenue {user}</strong></p>

      <form onSubmit={handleSearch} className="mb-3">
        <input
          type="text"
          placeholder="Rechercher un utilisateur"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-control d-inline-block w-50 me-2"
        />
        <button type="submit" className="btn btn-primary">Rechercher</button>
      </form>

      {users.length > 0 ? (
        <>
          <h2>Utilisateurs trouvés :</h2>
          <ul>
            {users.map((u) => (
              <li key={u.username}>
                {u.username}{" "}
                <button onClick={() => sendFriendRequest(u.username)}>
                  Demander en ami
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : searchQuery && <p>Aucun utilisateur trouvé.</p>}

      <hr />
      <h2>Demandes reçues :</h2>
      <Link to="/friend_requests">Voir mes demandes en attente</Link>

      <hr />
      <h2>Mes amis :</h2>
      {friends.length > 0 ? (
        <ul>
          {friends.map((f) => (
            <li key={f.username}>{f.username}</li>
          ))}
        </ul>
      ) : (
        <p>Tu n’as pas encore d’amis 🥲</p>
      )}

      <hr />
      <Link to="/">← Retour à l’accueil</Link>
    </div>
  );
}

export default SocialPage;
