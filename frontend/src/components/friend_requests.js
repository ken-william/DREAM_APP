import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";


function FriendRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/social/requests/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setRequests(data));
  }, []);

    useEffect(() => {
    fetch("http://localhost:8000/api/csrf/", { credentials: "include" });
  }, []);

  const respondToRequest = async (id, action) => {
    const csrftoken = getCookie("csrftoken");

    await fetch(`http://localhost:8000/api/social/respond/${id}/${action}/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({}) // facultatif mais recommandé pour éviter les erreurs de format
    });

  setRequests(requests.filter((r) => r.id !== id));
};
  function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

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
