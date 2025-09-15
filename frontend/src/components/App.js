import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Home from "./home";
import SocialHome from "./social";
import FriendRequests from "./friend_requests";
import SocialPage from "./social_page";
import Navbar from "./Navbar";
import MessagingPage from "./messaging";

function AppWrapper() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    fetch("http://localhost:8000/api/account/profile/", {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setIsAuthenticated(!!data?.email);
      })
      .catch(() => setIsAuthenticated(false));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  const hideNavbar = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar isAuthenticated={isAuthenticated} handleLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/social" element={<SocialHome />} />
        <Route path="/friend_requests" element={<FriendRequests />} />
        <Route path="/social_page" element={<SocialPage />} />
        <Route path="/messaging" element={<MessagingPage />} />
        <Route path="/messaging/:username" element={<MessagingPage />} />
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
