// frontend_dream_synthesizer/src/components/dreams/DreamCard.jsx
import React, { useState } from 'react';

const DreamCard = ({ dream, onDiscuss, onDelete, onChangeVisibility }) => {
  const [currentVisibility, setCurrentVisibility] = useState(dream.visibility);

  const handleVisibilityChange = (e) => {
    const newVisibility = e.target.value;
    setCurrentVisibility(newVisibility);
    onChangeVisibility(dream.id, newVisibility);
  };

  return (
    <div className="border rounded-lg shadow-md overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
      {dream.image_path ? (
        <img src={dream.image_path} alt="Rêve" className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/D1D5DB/4B5563?text=Image+non+disponible'; }}/>
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">Pas d'image</div>
      )}
      <div className="p-4">
        <p className="text-gray-700 text-sm mb-2 line-clamp-3">{dream.raw_prompt}</p>
        <p className="text-xs text-gray-500 mb-2">
          Créé le: {new Date(dream.timestamp).toLocaleDateString()}
        </p>
        {dream.emotion_analysis && (
            <div className="flex flex-wrap gap-1 text-xs mb-2">
                {Object.entries(dream.emotion_analysis).map(([emotion, value]) => (
                    <span key={emotion} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {emotion}: {(value * 100).toFixed(0)}%
                    </span>
                ))}
            </div>
        )}
        <div className="flex flex-col space-y-2 mt-4">
          <button
            onClick={() => onDiscuss(dream)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Discuter avec l'IA
          </button>
          <select
            value={currentVisibility}
            onChange={handleVisibilityChange}
            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="private">Privé</option>
            <option value="friends">Amis uniquement</option>
            <option value="public">Public</option>
          </select>
          <button
            onClick={() => onDelete(dream.id)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DreamCard;