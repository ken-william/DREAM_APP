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
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/users/whoami/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.username));
  }, []);

  useEffect(() => {
    if (!username) {
      fetch("http://localhost:8000/api/social/friends/", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setFriends(data));
    } else {
      fetch(`http://localhost:8000/api/social/messages/${username}/`, {
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => setMessages(data));
    }
  }, [username]);

  const handleSend = async () => {
    const csrftoken = getCookie("csrftoken");

    await fetch(`http://localhost:8000/api/social/messages/send/${username}/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({ content: message }),
    });

    setMessage("");
    const res = await fetch(`http://localhost:8000/api/social/messages/${username}/`, {
      credentials: "include"
    });
    const data = await res.json();
    setMessages(data);
  };

  if (!username) {
    return (
      <div className="container mt-5">
        <h2>Choisis un ami pour discuter</h2>
        <ul className="list-group">
          {friends.map((f) => (
            <li key={f.username} className="list-group-item d-flex justify-content-between align-items-center">
              {f.username}
              <a href={`/messaging/${f.username}`} className="btn btn-primary btn-sm">Discuter</a>
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
        {messages.map((msg, i) => {
            const isMine = msg.sender === currentUser;
            return (
                <div
                key={i}
                className={`d-flex mb-2 ${isMine ? "justify-content-end" : "justify-content-start"}`}
                >
                <div
                    className={`p-2 rounded ${isMine ? "bg-primary text-white" : "bg-light text-dark"}`}
                    style={{ maxWidth: "60%", whiteSpace: "pre-wrap" }}
                >
                    <div style={{ fontSize: "0.8em", fontWeight: "bold" }}>{msg.sender}</div>
                    {msg.content}
                </div>
                </div>
            );
            })}
      </div>

      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Écris un message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSend}>Envoyer</button>
      </div>
    </div>
  );
}

export default MessagingPage;
