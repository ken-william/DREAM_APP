// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./home";
import Login from "./login";
import Register from "./register";
import SocialHome from "./social";
import FriendRequests from "./friend_requests";
import SocialPage from "./social_page";
import Navbar from "./navbar";

function AppWrapper() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/users/whoami/", {
      credentials: "include",
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.username) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, [location.pathname]);

  const handleLogout = () => {
  fetch("http://localhost:8000/api/users/logout/", {
    method: "POST",
    credentials: "include",
  }).then(() => {
    setIsAuthenticated(false);
    window.location.href = "/login";  // redirection après logout
  });
};

  const hideNavbar = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideNavbar && (
        <Navbar isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/social" element={<SocialHome />} />
        <Route path="/friend_requests" element={<FriendRequests />} />
        <Route path="/social_page" element={<SocialPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
