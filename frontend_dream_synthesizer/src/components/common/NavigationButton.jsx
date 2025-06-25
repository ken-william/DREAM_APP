// frontend_dream_synthesizer/src/components/common/NavigationButton.jsx
import React from 'react';

const NavigationButton = ({ text, onClick, icon = null }) => (
  <button
    onClick={onClick} // La fonction `onClick` est reçue en prop. Elle est définie dans un composant parent (ex: App.jsx) et peut y déclencher des interactions avec le backend.
    className="text-white hover:text-indigo-200 transition duration-200 px-2 py-1 rounded-md text-sm sm:text-base flex items-center gap-1"
  >
    {icon && <span className="text-xl">{icon}</span>} {/* Affiche l'icône si fournie */}
    <span className="hidden sm:inline-block">{text}</span> {/* Affiche le texte, caché sur très petits écrans */}
  </button>
);

export default NavigationButton;