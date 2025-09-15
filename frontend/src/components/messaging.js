import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

function MessagingPage() {
  const { username } = useParams();
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    if (!username) {
      fetch("http://localhost:8000/api/social/friends/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setFriends(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error("Erreur amis:", err));
    } else {
      fetch(`http://localhost:8000/api/social/messages/${username}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(data);
          } else {
            console.warn("Réponse inattendue (pas un tableau):", data);
            setMessages([]);
          }
        })
        .catch((err) => {
          console.error("Erreur messages:", err);
          setMessages([]);
        });
    }
  }, [username, token]);

  const handleSend = async () => {
    const csrftoken = getCookie("csrftoken");

    await fetch(`http://localhost:8000/api/social/messages/send/${username}/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({ content: message }),
    });

    setMessage("");

    const res = await fetch(`http://localhost:8000/api/social/messages/${username}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  };

  if (!username) {
    return (
      <div className="container mt-5">
        <h2>Choisis un ami pour discuter</h2>
        <ul className="list-group">
          {friends.map((f) => (
            <li
              key={f.username}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {f.username}
              <a href={`/messaging/${f.username}`} className="btn btn-primary btn-sm">
                Discuter
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2>Messagerie avec {username}</h2>

      <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "20px" }}>
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`d-flex mb-2 ${
                msg.sender === username ? "justify-content-start" : "justify-content-end"
              }`}
            >
              <div
                className={`p-2 rounded ${
                  msg.sender === username ? "bg-light text-dark" : "bg-primary text-white"
                }`}
                style={{ maxWidth: "60%", whiteSpace: "pre-wrap" }}
              >
                <div style={{ fontSize: "0.8em", fontWeight: "bold" }}>{msg.sender}</div>
                {msg.content}
              </div>
            </div>
          ))
        ) : (
          <p>Aucun message à afficher.</p>
        )}
      </div>

      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Écris un message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSend}>
          Envoyer
        </button>
      </div>
    </div>
  );
}

export default MessagingPage;
