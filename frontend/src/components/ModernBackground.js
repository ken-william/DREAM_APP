import React from 'react';
import '../styles/ModernBackground.css';

const ModernBackground = ({ children }) => {
  return (
    <div className="modern-background">
      {/* Éléments décoratifs flottants */}
      <div className="bg-float-element bg-float-1" />
      <div className="bg-float-element bg-float-2" />
      <div className="bg-float-element bg-float-3" />

      {/* Contenu principal */}
      <div className="modern-background-content">
        {children}
      </div>
    </div>
  );
};

export default ModernBackground;
