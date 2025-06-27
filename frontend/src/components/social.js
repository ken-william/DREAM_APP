import React from "react";
import { Link } from "react-router-dom";

function SocialHome() {
  return (
    <div className="container mt-5">
      <h1 className="mb-4">Bienvenue dans l'espace social</h1>
      <p>Ici tu pourras ajouter des amis et discuter de tes rêves...</p>

      <div className="d-flex gap-3">
        <Link to="/social_page" className="btn btn-primary">
          Mes amis
        </Link>
        <Link to="/messaging" className="btn btn-primary">
          Messagerie
        </Link>

        {/* <Link to="/" className="btn btn-secondary">
          ← Retour à l’accueil
        </Link> */}
      </div>
    </div>
  );
}

export default SocialHome;
