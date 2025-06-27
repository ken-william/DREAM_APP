import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:8000/api/social/requests/", {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setRequests(data));
  }, []);

  const respondToRequest = async (id, action) => {
    await fetch(`http://localhost:8000/api/social/respond/${id}/${action}/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // pour éviter les erreurs de format
    });

    // Supprime la requête de la liste une fois traitée
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="container mt-5">
      <h1>Demandes d’amis reçues</h1>

      {requests.length > 0 ? (
        <ul>
          {requests.map((req) => (
            <li key={req.id}>
              {req.from_user?.username || req.from_user}
              <button onClick={() => respondToRequest(req.id, "accept")} className="btn btn-success ms-2">✅ Accepter</button>
              <button onClick={() => respondToRequest(req.id, "reject")} className="btn btn-danger ms-2">❌ Refuser</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucune demande en attente.</p>
      )}

      <Link to="/social">⬅ Retour</Link>
    </div>
  );
}

export default FriendRequests;
