// frontend_dream_synthesizer/src/components/pages/FeedPage.jsx
import React, { useEffect } from 'react';
import FeedDreamCard from '../dreams/FeedDreamCard'; // Assurez-vous du chemin correct

const FeedPage = ({
  setCurrentPage,
  feedDreams, feedLoading, feedError, fetchFeedDreams,
  onLike, onComment // Ces fonctions sont passées depuis App.jsx pour interagir avec le backend
}) => {
  // Récupère le fil d'actualité au montage du composant
  useEffect(() => {
    fetchFeedDreams(); // Appel de la fonction de récupération des données du backend
  }, [fetchFeedDreams]); // Dépendance à fetchFeedDreams pour s'assurer qu'elle est appelée lorsque nécessaire

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-64px)] bg-gray-50 p-4 w-full">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Fil d'Actualité des Rêves</h2>
        {feedLoading && <p className="text-center text-gray-600">Chargement du fil d'actualité...</p>}
        {feedError && <p className="text-center text-red-600">{feedError}</p>}
        
        {Array.isArray(feedDreams) && feedDreams.length === 0 && !feedLoading && !feedError && (
          <p className="text-center text-gray-600">Aucun rêve à afficher dans le fil d'actualité pour l'instant. Ajoutez des amis ou partagez vos rêves en public !</p>
        )}

        <div className="grid grid-cols-1 gap-6 mt-8"> {/* Utilise une seule colonne pour un look Instagram-like */}
          {Array.isArray(feedDreams) && feedDreams.map(dream => (
            <FeedDreamCard
              key={dream.id}
              dream={dream}
              onLike={onLike} // Passe la fonction de like au composant enfant
              onComment={onComment} // Passe la fonction de commentaire au composant enfant
            />
          ))}
        </div>

        <button onClick={() => setCurrentPage('dashboard')} className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
          Retour au Tableau de Bord
        </button>
      </div>
    </div>
  );
};

export default FeedPage;