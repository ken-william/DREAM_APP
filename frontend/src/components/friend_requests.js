import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api"; // ✅ CORRECTION: Utiliser api.js centralisé
import "../styles/FriendRequests.css";

function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const { data } = await api.get("/api/social/requests/");
        setRequests(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        console.error("Erreur demandes:", err);
        setError("Impossible de charger les demandes d'amis");
      } finally {
        setLoading(false);
      }
    };
    
    loadRequests();
  }, []);

  const respondToRequest = async (id, action) => {
    console.log(`Tentative de ${action} pour la demande ID: ${id}`);
    
    try {
      console.log(`Envoi requête: POST /api/social/respond/${id}/${action}/`);
      
      const response = await api.post(`/api/social/respond/${id}/${action}/`, {});
      
      console.log(`Réponse reçue:`, response.data);
      
      // Supprime la requête de la liste une fois traitée
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setError("");
      
      const actionText = action === 'accept' ? 'acceptée' : 'refusée';
      console.log(`✅ Demande ${actionText} avec succès !`);
      
    } catch (err) {
      console.error(`❌ Erreur ${action}:`, err);
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      
      setError(`Impossible de ${action === 'accept' ? 'accepter' : 'refuser'} la demande: ${err.response?.data?.detail || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Demandes d'amis reçues</h1>
        <Link to="/social" className="btn btn-secondary">
          ⬅ Retour
        </Link>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Liste des demandes */}
      {requests.length > 0 ? (
        <div className="row">
          {requests.map((req) => (
            <div key={req.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card friend-request-card">
                <div className="card-body friend-request-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="friend-avatar">
                      {/* ✅ CORRECTION: L'API retourne {"from": {"username": "..."}} */}
                      {req.from?.username?.charAt(0)?.toUpperCase() || '🚀'}
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="friend-username">
                        {req.from?.username || 'Utilisateur inconnu'}
                      </h5>
                      <p className="friend-email">
                        {req.from?.email || ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="friend-request-message">
                    <p className="text-center mb-0">
                      💬 Souhaite être votre ami
                    </p>
                  </div>
                  
                  <div className="d-grid gap-2">
                    <button 
                      onClick={() => respondToRequest(req.id, "accept")}
                      className="btn btn-success friend-accept-btn"
                    >
                      ✅ Accepter
                    </button>
                    <button 
                      onClick={() => respondToRequest(req.id, "reject")}
                      className="btn btn-outline-danger friend-reject-btn"
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center">
          <h4>📭 Aucune demande en attente</h4>
          <p className="mb-0">Vous n'avez reçu aucune nouvelle demande d'ami.</p>
          <Link to="/social" className="btn btn-primary mt-2">
            Rechercher des amis
          </Link>
        </div>
      )}
    </div>
  );
}

export default FriendRequests;