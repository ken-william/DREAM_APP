// frontend_dream_synthesizer/src/components/dreams/FeedDreamCard.jsx
import React from 'react';

const FeedDreamCard = ({ dream, onLike, onComment }) => {
  return (
    <div className="border rounded-lg shadow-md overflow-hidden bg-white p-4">
      <div className="flex items-center mb-4">
        {/* Placeholder for user avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold mr-3">
          {dream.user ? dream.user.charAt(0).toUpperCase() : '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{dream.user || 'Utilisateur inconnu'}</p>
          <p className="text-xs text-gray-500">{new Date(dream.timestamp).toLocaleString()}</p>
        </div>
      </div>
      
      {dream.image_path && (
        <img src={dream.image_path} alt="Rêve" className="w-full h-64 object-cover rounded-lg mb-4" />
      )}
      
      <p className="text-gray-700 mb-4">{dream.raw_prompt}</p>

      {dream.emotion_analysis && (
          <div className="flex flex-wrap gap-1 text-sm mb-4">
              {Object.entries(dream.emotion_analysis).map(([emotion, value]) => (
                  <span key={emotion} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      {emotion}: {(value * 100).toFixed(0)}%
                  </span>
              ))}
          </div>
      )}

      <div className="flex justify-between items-center text-gray-600 text-sm">
        <button
          onClick={() => onLike(dream.id)} // Passe l'ID du rêve pour le like
          className="flex items-center space-x-1 hover:text-red-500 transition duration-200"
        >
          ❤️ <span className="font-semibold">{dream.likes_count || 0}</span> J'aimes
        </button>
        <button
          onClick={() => onComment(dream.id)} // Passe l'ID du rêve pour le commentaire
          className="flex items-center space-x-1 hover:text-blue-500 transition duration-200"
        >
          💬 <span className="font-semibold">{dream.comments_count || 0}</span> Commentaires
        </button>
      </div>
    </div>
  );
};

export default FeedDreamCard;