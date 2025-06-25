// frontend_dream_synthesizer/src/components/auth/GlobalMessage.jsx
import React, { useEffect, useState } from 'react';

const GlobalMessage = ({ message, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [message, duration]);

  if (!isVisible) return null;

  const isError = message.includes('Erreur') || message.includes('failed') || message.includes('bloqué');
  const bgColor = isError ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300';
  const textColor = isError ? 'text-red-800' : 'text-green-800';

  return (
    <div className={`fixed top-16 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg z-50 transition-all duration-300 opacity-0 transform -translate-y-full ${isVisible ? 'opacity-100 translate-y-0' : ''} ${bgColor} ${textColor}`}>
      {message}
    </div>
  );
};

export default GlobalMessage;
