// frontend_dream_synthesizer/src/components/pages/MyDreamsPage.jsx
import React, { useEffect } from 'react';
import DreamCard from '../dreams/DreamCard'; // Assurez-vous du chemin correct

const MyDreamsPage = ({
  setCurrentPage,
  myDreams, myDreamsLoading, myDreamsError, fetchMyDreams,
  onDiscuss, onDelete, onChangeVisibility
}) => {
  // Récupère les rêves au montage du composant
  useEffect(() => {
    fetchMyDreams();
  }, [fetchMyDreams]);

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-64px)] bg-gray-50 p-4 w-full">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Mes Rêves</h2>
        {myDreamsLoading && <p className="text-center text-gray-600">Chargement de vos rêves...</p>}
        {myDreamsError && <p className="text-center text-red-600">{myDreamsError}</p>}
        
        {Array.isArray(myDreams) && myDreams.length === 0 && !myDreamsLoading && !myDreamsError && (
          <p className="text-center text-gray-600">Vous n'avez pas encore de rêves sauvegardés. Créez-en un !</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Array.isArray(myDreams) && myDreams.map(dream => (
            <DreamCard
              key={dream.id}
              dream={dream}
              onDiscuss={onDiscuss}
              onDelete={onDelete}
              onChangeVisibility={onChangeVisibility}
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

export default MyDreamsPage;