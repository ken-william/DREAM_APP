// frontend/src/components/ModernBackground.js
import React from 'react';

const ModernBackground = ({ children }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, 
          rgba(102, 126, 234, 0.1) 0%, 
          rgba(118, 75, 162, 0.1) 25%,
          rgba(59, 130, 246, 0.05) 50%,
          rgba(147, 197, 253, 0.1) 75%,
          rgba(165, 180, 252, 0.1) 100%
        ),
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
      `,
      backgroundAttachment: 'fixed',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Éléments décoratifs flottants */}
      <div style={{
        position: 'fixed',
        top: '10%',
        left: '5%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(59, 130, 246, 0.05))',
        filter: 'blur(40px)',
        animation: 'float1 20s ease-in-out infinite',
        zIndex: -1
      }} />
      
      <div style={{
        position: 'fixed',
        top: '60%',
        right: '10%',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.15), rgba(165, 180, 252, 0.1))',
        filter: 'blur(30px)',
        animation: 'float2 25s ease-in-out infinite',
        zIndex: -1
      }} />
      
      <div style={{
        position: 'fixed',
        bottom: '20%',
        left: '15%',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.1), rgba(102, 126, 234, 0.05))',
        filter: 'blur(25px)',
        animation: 'float3 30s ease-in-out infinite',
        zIndex: -1
      }} />

      {/* Contenu principal */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      {/* Animations CSS */}
      <style>
        {`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(120deg); }
            66% { transform: translate(-20px, 20px) rotate(240deg); }
          }
          
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-25px, -40px) rotate(180deg); }
          }
          
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(20px, -15px) rotate(90deg); }
            50% { transform: translate(-15px, -25px) rotate(180deg); }
            75% { transform: translate(-25px, 10px) rotate(270deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ModernBackground;
