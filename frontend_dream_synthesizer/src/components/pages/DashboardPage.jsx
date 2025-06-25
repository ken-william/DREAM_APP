// frontend_dream_synthesizer/src/components/pages/DashboardPage.jsx
import React from 'react';
import DashboardButton from '../common/DashboardButton'; // Assurez-vous du chemin correct

const DashboardPage = ({ setCurrentPage, currentUser, handleLogout }) => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4 w-full">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl text-center border border-gray-100"> {/* Coins plus arrondis, ombre plus profonde */}
        <h2 className="text-4xl font-extrabold text-indigo-800 mb-4 tracking-tight">Bienvenue, {currentUser?.username || 'Utilisateur'} !</h2>
        <p className="text-gray-700 text-lg mb-8 font-light">Votre espace personnel pour gérer vos rêves et interagir avec la communauté.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardButton text="Créer un Rêve" icon="✨" onClick={() => setCurrentPage('create-dream')} />
          <DashboardButton text="Mes Rêves" icon="📖" onClick={() => setCurrentPage('my-dreams')} />
          <DashboardButton text="Fil d'Actualité" icon="🌐" onClick={() => setCurrentPage('feed')} />
          <DashboardButton text="Gérer Amis" icon="🤝" onClick={() => setCurrentPage('friends')} />
          <DashboardButton text="Notifications" icon="🔔" onClick={() => setCurrentPage('notifications')} />
          <DashboardButton text="Chat IA (Interprétation)" icon="💬" onClick={() => setCurrentPage('chat-dream')} />
        </div>

        <button onClick={handleLogout} className="mt-10 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-300 text-lg"> {/* Bouton déconnexion plus grand */}
          Déconnexion
        </button>
      </div>
    </div>
  );

export default DashboardPage;