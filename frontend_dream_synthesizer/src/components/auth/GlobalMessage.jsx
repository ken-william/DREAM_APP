// frontend_dream_synthesizer/src/components/common/GlobalMessage.jsx
import React, { useEffect, useState } from 'react';

const GlobalMessage = ({ message, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Gère la visibilité du message en fonction de la prop 'message'
  useEffect(() => {
    if (message) {
      setIsVisible(true);
      // Définit un minuteur pour masquer le message après 'duration' millisecondes
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      // Nettoyage : annule le minuteur si le composant est démonté ou si le message change
      return () => clearTimeout(timer);
    } else {
      // Si le message est vide, assure qu'il n'est pas visible
      setIsVisible(false);
    }
  }, [message, duration]); // Les dépendances assurent que l'effet se réexécute si 'message' ou 'duration' changent

  // Ne rend rien si le message n'est pas visible
  if (!isVisible) return null;

  // Détermine la couleur de fond et du texte en fonction du contenu du message (pour les erreurs)
  const isError = message.includes('Erreur') || message.includes('failed') || message.includes('bloqué') || message.includes('Impossible');
  const bgColor = isError ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300';
  const textColor = isError ? 'text-red-800' : 'text-green-800';

  return (
    // Utilise des classes Tailwind CSS pour le positionnement, le style et les transitions
    <div className={`fixed top-16 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'} ${bgColor} ${textColor}`}>
      {message}
    </div>
  );
};

export default GlobalMessage;